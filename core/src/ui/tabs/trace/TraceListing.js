(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var TraceListing = function TraceListing(parentElement, session, controller) {
        var self = this;
        var doc = parentElement.ownerDocument;

        this.session = session;
        this.controller = controller;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-tracelisting");
        parentElement.appendChild(el);

        var callCanvas = this.callCanvas = doc.createElement("canvas");
        gli.ui.addClass(callCanvas, "gli-tracelisting-calls");
        el.appendChild(callCanvas);

        var mapCanvas = this.mapCanvas = doc.createElement("canvas");
        gli.ui.addClass(mapCanvas, "gli-tracelisting-map");
        mapCanvas.width = 80;
        el.appendChild(mapCanvas);

        var miniMap = this.miniMap = doc.createElement("canvas");
        var frag = doc.createDocumentFragment();
        frag.appendChild(miniMap);

        controller.stateChanged.addListener(this, this.setState);
        controller.frameChanged.addListener(this, this.setFrame);
        controller.frameStepped.addListener(this, this.frameStepped);

        this.frame = null;
        this.rowInfos = [];
        this.callIndex = null;

        this.scrollOffset = 0;
        this.scrollHeight = 0;

        this.minidy = 1;

        function onmousewheel(e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = e.wheelDelta;
                if (e.shiftKey) {
                    delta /= 120;
                }
            } else if (e.detail) {
                delta = -e.detail;
                if (e.shiftKey) {
                    delta /= 3;
                }
            }
            if (delta) {
                var x = e.offsetX;
                var y = e.offsetY;
                if (!isNaN(x) && !isNaN(y)) {
                    self.onMouseWheel(x, y, delta, e.shiftKey);
                }
            }
            e.preventDefault();
            e.stopPropagation();
        };

        callCanvas.addEventListener("mousewheel", onmousewheel, false);
        mapCanvas.addEventListener("mousewheel", onmousewheel, false);

        callCanvas.addEventListener('mousedown', function(e) {
            self.callsMouseDown(e);
        }, false);
        callCanvas.addEventListener('mouseup', function(e) {
            self.callsMouseUp(e);
        }, false);
        callCanvas.addEventListener('mouseout', function(e) {
            self.callsMouseUp(e);
        }, false);
        this.boundCallsMouseMove = function(e) {
            self.callsMouseMove(e);
        };
        mapCanvas.addEventListener('mousedown', function(e) {
            self.mapMouseDown(e);
        }, false);
        mapCanvas.addEventListener('mouseup', function(e) {
            self.mapMouseUp(e);
        }, false);
        mapCanvas.addEventListener('mouseout', function(e) {
            self.mapMouseUp(e);
        }, false);
        this.boundMapMouseMove = function(e) {
            self.mapMouseMove(e);
        };

        gli.util.setTimeout(function () {
            self.layout();
        }, 0);
    };

    TraceListing.prototype.layout = function layout() {
        var w = this.el.clientWidth;
        var h = this.el.clientHeight;
        this.callCanvas.width = w - 80 - 1;
        this.callCanvas.height = h;
        this.mapCanvas.width = 80;
        this.mapCanvas.height = h;

        this.renderMiniMap();
        this.renderCalls();
    };

    TraceListing.prototype.setState = function setState(state) {
        var enableControls = false;

        switch (state) {
            case "disabled":
                enableControls = false;
                break;
            case "loading":
                enableControls = false;
                break;
            case "ready":
                enableControls = true;
                break;
        }

        //this.miniBar.enabled = enableControls;
    };

    // [icon] | [ordinal] | C | [line contents ----------------------------- ] | actions
    var kRowHeight = 15;
    var kRowPadY = 1;
    var kIconGutterWidth = 18;
    var kOrdinalGutterWidth = 40;
    var kColorGutterWidth = 4;
    var kActionsGutterWidth = 40;
    var kContentPadLeft = 8;

    var kActiveColor = "#bfd9f9";
    var kActiveBorderColor = "#2f84eb";
    var kActiveRegionColor = "rgba(100,100,100,0.3)";
    var kIconGutterColor = "rgb(237,237,237)";
    var kIconGutterBorderColor = "rgb(217,217,217)";
    var kInnerGutterColor = "rgb(253,253,253)";
    var kDividerColor = "rgb(187,187,187)";
    var kOrdinalFont = "12px 'Courier New', 'Courier New', monospace";
    var kContentFont = "12px 'Courier New', 'Courier New', monospace";
    var kOrdinalColor = "rgb(0,0,0)";
    var kContentColor = "rgb(0,0,0)";

    var kStateColor = "rgb(0,255,0)";
    var kUniformColor = "rgb(0,0,255)";
    var kDrawColor = "rgb(255,0,0)";

    var kRedundantColor = "#FFFF00";
    var kErrorColor = "#FF8F8F";

    var kMiniLineColor = "#444444";
    var kMiniFont = "2px 'Courier New', 'Courier New', monospace";

    TraceListing.prototype.setFrame = function setFrame(frame) {
        this.frame = frame;

        if (frame) {
            this.scrollOffset = 0;
            this.scrollHeight = frame.calls.length * (kRowHeight + kRowPadY);
        } else {
            this.scrollOffset = 0;
            this.scrollHeight = 0;
        }

        this.buildRowInfos();
        this.buildMiniMap();

        this.renderMiniMap();
        this.renderCalls();
    };

    TraceListing.prototype.buildRowInfos = function buildRowInfos() {
        var frame = this.frame;
        if (!frame) {
            this.rowInfos = [];
            return;
        }

        var rowInfos = this.rowInfos = new Array(frame.calls.length);

        var ctx = this.callCanvas.getContext("2d");
        ctx.font = kOrdinalFont;

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            var color = null;
            if (call.error) {
                color = kErrorColor;
            } else if (call.redundant) {
                color = kRedundantColor;
            } else if (call.stall) {
                color = kStallColor;
            } else if (call.draw) {
                color = kDrawColor;
            }

            var ordinalWidth = ctx.measureText(call.ordinal).width;

            rowInfos[n] = {
                color: color,
                ordinalWidth: ordinalWidth
            };
        }
    };

    TraceListing.prototype.buildMiniMap = function buildMiniMap() {
        var frame = this.frame;

        var count = this.rowInfos.length;
        var canvasHeight = 512;
        var dy = this.minidy = Math.max(1, count / canvasHeight);

        var canvasWidth = 80;
        this.miniMap.width = canvasWidth;
        this.miniMap.height = canvasHeight;

        var ctx = this.miniMap.getContext("2d");
        if (!frame) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            return;
        }

        ctx.textBaseline = "top";
        ctx.font = kMiniFont;

        var y = 0;
        for (var n = 0; n < this.rowInfos.length; n++) {
            var x = 1;
            var row = this.rowInfos[n];
            var call = frame.calls[n];
            var callWidth = call.name.length * 2;
            var argWidth = call.args.length * 2;
            ctx.fillStyle = row.color || kMiniLineColor;
            ctx.fillRect(x, y, callWidth, 1);
            //ctx.fillText(call.name, x, y);
            x += callWidth + 1;
            ctx.fillRect(x, y, argWidth, 1);
            y += 1 / dy;
        }
    };

    TraceListing.prototype.renderMiniMap = function renderMiniMap() {
        var frame = this.frame;

        var canvasWidth = this.mapCanvas.width;
        var canvasHeight = this.mapCanvas.height;

        var sy = canvasHeight / this.miniMap.height;
        var vy = canvasHeight / this.scrollHeight;

        var ctx = this.mapCanvas.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        if (!frame) {
            return;
        }

        ctx.drawImage(this.miniMap, 0, 0, canvasWidth, canvasHeight);

        // Draw scroll region at this.scrollOffset
        ctx.fillStyle = kActiveRegionColor;
        ctx.fillRect(0, this.scrollOffset * vy, canvasWidth, this.callCanvas.height * vy);

        // Draw scroll line
        var y = this.callIndex * (canvasHeight / this.miniMap.height) / this.minidy;
        ctx.fillStyle = kActiveBorderColor;
        ctx.fillRect(0, y - 1, canvasWidth, 3);
    };

    TraceListing.prototype.renderCall = function renderCall(ctx, y, call, rowInfo) {
        var canvasWidth = this.callCanvas.width;
        var x = 0;

        // Icon
        //ctx.fillStyle = "rgb(255,0,0)";
        //ctx.fillRect(x, y, kIconGutterWidth, kRowHeight);
        x += kIconGutterWidth + 4;

        // Ordinal
        ctx.font = kOrdinalFont;
        ctx.fillStyle = kOrdinalColor;
        ctx.fillText(call.ordinal, x + kOrdinalGutterWidth - rowInfo.ordinalWidth, y);
        x += kOrdinalGutterWidth + 4;

        // Color line
        if (rowInfo.color) {
            ctx.fillStyle = rowInfo.color;
            ctx.fillRect(x, y, kColorGutterWidth, kRowHeight + 1);
        }
        x += kColorGutterWidth + 4;

        // Divider
        x++;

        // Active line
        if (this.callIndex == call.ordinal) {
            var contentWidth = canvasWidth - x;
            ctx.fillStyle = kActiveBorderColor;
            ctx.fillRect(x, y, contentWidth, kRowHeight + 1);
            ctx.fillStyle = kActiveColor;
            ctx.fillRect(x, y + 1, contentWidth, kRowHeight - 1);
        }

        // Contents
        x += kContentPadLeft;
        ctx.font = kContentFont;
        ctx.fillStyle = kContentColor;
        ctx.fillText(call.name, x, y);

        // Actions
        x = canvasWidth - kActionsGutterWidth;
        //ctx.fillStyle = "rgb(0,255,255)";
        //ctx.fillRect(x, y, kActionsGutterWidth, kRowHeight);
    };

    TraceListing.prototype.renderCalls = function renderCalls(calls) {
        var frame = this.frame;

        var canvasWidth = this.callCanvas.width;
        var canvasHeight = this.callCanvas.height;

        var ctx = this.callCanvas.getContext("2d");
        if (!frame) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            return;
        }

        ctx.textBaseline = "top";

        function drawShared(y, height) {
            var x = 0;

            ctx.clearRect(0, y, canvasWidth, height);

            // Draw icon gutter
            ctx.fillStyle = kIconGutterColor;
            ctx.fillRect(x, y, kIconGutterWidth, height);
            ctx.fillStyle = kIconGutterBorderColor;
            ctx.fillRect(x + kIconGutterWidth - 1, y, 1, height);
            x += kIconGutterWidth;

            // Draw ordinal gutter
            var innerWidth = 4 + kOrdinalGutterWidth + 4 + kColorGutterWidth + 4;
            ctx.fillStyle = kInnerGutterColor;
            ctx.fillRect(x, y, innerWidth, height);
            x += innerWidth;

            // Draw divider line
            ctx.fillStyle = kDividerColor;
            ctx.fillRect(x, y, 1, height);
        };

        if (!calls) {
            drawShared(0, canvasHeight);
        }

        var top = 0;
        var bottom = canvasHeight;
        var startIndex = Math.floor(this.scrollOffset / (kRowHeight + kRowPadY));
        var y = -Math.floor(this.scrollOffset - startIndex * (kRowHeight + kRowPadY));
        for (var n = startIndex; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var rowInfo = this.rowInfos[n];

            if (!calls) {
                this.renderCall(ctx, y, call, rowInfo);
            } else {
                if (calls.indexOf(call) >= 0) {
                    drawShared(y, kRowHeight + kRowPadY);
                    this.renderCall(ctx, y, call, rowInfo);
                }
            }

            y += kRowHeight + kRowPadY;
            if (y >= bottom) {
                break;
            }
        }
    };

    TraceListing.prototype.scroll = function scroll(dy) {
        this.scrollTo(this.scrollOffset - dy);
    };

    TraceListing.prototype.scrollTo = function scrollTo(offset) {
        if (offset < 0) {
            offset = 0;
        } else if (offset + this.callCanvas.height >= this.scrollHeight) {
            offset = Math.max(0, this.scrollHeight - this.callCanvas.height);
        }
        this.scrollOffset = offset;

        this.renderMiniMap();
        this.renderCalls();
    };

    TraceListing.prototype.scrollIntoView = function scrollIntoView(callIndex) {
        // if not needed, return false
        var startIndex = (this.scrollOffset - kRowPadY) / (kRowHeight + kRowPadY);
        var endIndex = startIndex + Math.floor(this.callCanvas.height / (kRowHeight + kRowPadY));
        if (callIndex < startIndex || callIndex > endIndex) {
            var y = callIndex * (kRowHeight + kRowPadY);
            this.scrollOffset = Math.max(0, y - (5 * (kRowHeight + kRowPadY)));
        }
        this.renderMiniMap();
        this.renderCalls();
        return true;
    };

    TraceListing.prototype.onMouseWheel = function onMouseWheel(x, y, delta, shiftKey) {
        if (shiftKey) {
            this.controller.step(-delta);
        } else {
            this.scroll(delta);
        }
    };

    TraceListing.prototype.frameStepped = function frameStepped(context) {
        console.log("step");
        if (this.callIndex === context.callIndex) {
            return;
        }
        var oldIndex = this.callIndex;
        this.callIndex = context.callIndex;
        if (this.scrollIntoView(this.callIndex)) {
            this.renderMiniMap();
            this.renderCalls([oldIndex, this.callIndex]);
        }
    };

    TraceListing.prototype.callsMouseDown = function callsMouseDown(e) {
        var y = e.offsetY;
        var row = (this.scrollOffset + y - kRowPadY) / (kRowHeight + kRowPadY);
        this.controller.seek(row);

        this.callCanvas.addEventListener('mousemove', this.boundCallsMouseMove, false);
    };

    TraceListing.prototype.callsMouseMove = function callsMouseMove(e) {
        var y = e.offsetY;
        var row = (this.scrollOffset + y - kRowPadY) / (kRowHeight + kRowPadY);
        this.controller.seek(row);
    };

    TraceListing.prototype.callsMouseUp = function callsMouseUp(e) {
        var y = e.offsetY;
        var row = (this.scrollOffset + y - kRowPadY) / (kRowHeight + kRowPadY);

        this.callCanvas.removeEventListener('mousemove', this.boundCallsMouseMove, false);
    };

    TraceListing.prototype.mapMouseDown = function mapMouseDown(e) {
        var y = e.offsetY;
        var vy = (y / this.mapCanvas.height) * this.scrollHeight;

        this.mapCanvas.addEventListener('mousemove', this.boundMapMouseMove, false);

        this.scrollTo(vy - this.callCanvas.height / 2);
    };

    TraceListing.prototype.mapMouseMove = function mapMouseMove(e) {
        var y = e.offsetY;
        var vy = (y / this.mapCanvas.height) * this.scrollHeight;

        this.scrollTo(vy - this.callCanvas.height / 2);
    };

    TraceListing.prototype.mapMouseUp = function mapMouseUp(e) {
        var y = e.offsetY;

        this.mapCanvas.removeEventListener('mousemove', this.boundMapMouseMove, false);
    };

    trace.TraceListing = TraceListing;

})();
