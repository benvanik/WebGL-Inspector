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

        function onmousewheel(e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = e.wheelDelta; // / (120 / 3);
            } else if (e.detail) {
                delta = -e.detail / (3 / 3);
            }
            if (delta) {
                var x = e.offsetX;
                var y = e.offsetY;
                if (!isNaN(x) && !isNaN(y)) {
                    self.onMouseWheel(x, y, delta);
                }
            }
            e.preventDefault();
            e.stopPropagation();
        };

        callCanvas.addEventListener("mousewheel", onmousewheel, false);

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
    var kIconGutterColor = "rgb(237,237,237)";
    var kIconGutterBorderColor = "rgb(217,217,217)";
    var kInnerGutterColor = "rgb(247,247,247)";
    var kDividerColor = "rgb(187,187,187)";
    var kOrdinalFont = "12px 'Courier New', 'Courier New', monospace";
    var kContentFont = "12px 'Courier New', 'Courier New', monospace";
    var kOrdinalColor = "rgb(0,0,0)";
    var kContentColor = "rgb(0,0,0)";

    var kStateColor = "rgb(0,255,0)";
    var kUniformColor = "rgb(0,0,255)";
    var kDrawColor = "rgb(255,0,0)";

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
            // TODO: put type in function info, switch on that
            switch (call.name) {
                case "drawArrays":
                case "drawElements":
                    color = kDrawColor;
                    break;
            };

            var ordinalWidth = ctx.measureText(call.ordinal).width;

            rowInfos[n] = {
                color: color,
                ordinalWidth: ordinalWidth
            };
        }
    };

    TraceListing.prototype.buildMiniMap = function buildMiniMap() {
        var frame = this.frame;

        var canvasWidth = 80;
        var canvasHeight = 1024; // ?
        this.miniMap.width = canvasWidth;
        this.miniMap.height = canvasHeight;

        var ctx = this.miniMap.getContext("2d");
        if (!frame) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            return;
        }

        //
    };

    TraceListing.prototype.renderMiniMap = function renderMiniMap() {
        var frame = this.frame;

        var canvasWidth = this.mapCanvas.width;
        var canvasHeight = this.mapCanvas.height;

        var ctx = this.mapCanvas.getContext("2d");
        if (!frame) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            return;
        }

        ctx.drawImage(this.miniMap, 0, 0, canvasWidth, canvasHeight);

        // TODO: draw scroll region at this.scrollOffset
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
            ctx.fillStyle = kActiveBorderColor
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

    TraceListing.prototype.renderCalls = function renderCalls() {
        var frame = this.frame;

        var canvasWidth = this.callCanvas.width;
        var canvasHeight = this.callCanvas.height;

        var ctx = this.callCanvas.getContext("2d");
        if (!frame) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            return;
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.textBaseline = "top";

        var x = 0;
        // Draw icon gutter
        ctx.fillStyle = kIconGutterColor;
        ctx.fillRect(x, 0, kIconGutterWidth, canvasHeight);
        ctx.fillStyle = kIconGutterBorderColor;
        ctx.fillRect(x + kIconGutterWidth - 1, 0, 1, canvasHeight);
        x += kIconGutterWidth;

        // Draw ordinal gutter
        var innerWidth = 4 + kOrdinalGutterWidth + 4 + kColorGutterWidth + 4;
        ctx.fillStyle = kInnerGutterColor;
        ctx.fillRect(x, 0, innerWidth, canvasHeight);
        x += innerWidth;

        // Draw divider line
        ctx.fillStyle = kDividerColor;
        ctx.fillRect(x, 0, 1, canvasHeight);

        // this.scrollOffset
        // this.scrollHeight
        var top = 0;
        var bottom = canvasHeight;
        var startOffset = this.scrollOffset;
        var startIndex = 0;

        var y = -startOffset;
        for (var n = startIndex; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var rowInfo = this.rowInfos[n];
            this.renderCall(ctx, y, call, rowInfo);

            y += kRowHeight + kRowPadY;
            if (y >= bottom) {
                break;
            }
        }
    };

    TraceListing.prototype.scroll = function scroll(dy) {
        var offset = this.scrollOffset - dy;
        if (offset < 0) {
            offset = 0;
        } else if (offset > this.scrollHeight) {
            offset = this.scrollHeight - this.callCanvas.height;
        }
        this.scrollOffset = offset;

        this.renderMiniMap();
        this.renderCalls();
    };

    TraceListing.prototype.onMouseWheel = function onMouseWheel(x, y, delta) {
        this.scroll(delta);
    };

    TraceListing.prototype.frameStepped = function frameStepped(context) {
        console.log("step");
        if (this.callIndex === context.callIndex) {
            return;
        }
        this.callIndex = context.callIndex;
        this.renderMiniMap();
        this.renderCalls();
    };

    trace.TraceListing = TraceListing;

})();
