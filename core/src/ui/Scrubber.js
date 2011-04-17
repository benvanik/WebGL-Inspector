(function () {
    var ui = glinamespace("gli.ui");

    var Scrubber = function Scrubber(parentElement, controller) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        this.controller = controller;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-scrubber");
        gli.ui.addClass(el, "gli-scrubber-disabled");
        parentElement.appendChild(el);

        var highlightCanvas = this.highlightCanvas = doc.createElement("canvas");
        gli.ui.addClass(highlightCanvas, "gli-scrubber-canvas");
        highlightCanvas.height = 40;
        el.appendChild(highlightCanvas);

        var callCanvas = this.callCanvas = doc.createElement("canvas");
        gli.ui.addClass(callCanvas, "gli-scrubber-canvas");
        callCanvas.height = 40;
        el.appendChild(callCanvas);

        var inputLayer = this.inputLayer = doc.createElement("div");
        gli.ui.addClass(inputLayer, "gli-scrubber-input");
        el.appendChild(inputLayer);

        var scrubThreshold = 5;
        var downX = 0;
        var accumX = 0;
        var mouseDown = false;
        inputLayer.addEventListener("mousedown", function (e) {
            downX = e.screenX;
            accumX = 0;
            mouseDown = true;
            gli.ui.beginInteractive();
        }, false);
        inputLayer.addEventListener("mouseup", function (e) {
            if (mouseDown) {
                gli.ui.endInteractive();
                mouseDown = false;
            }
        }, false);
        inputLayer.addEventListener("mouseout", function (e) {
            if (mouseDown) {
                gli.ui.endInteractive();
                mouseDown = false;
            }
        }, false);
        inputLayer.addEventListener("mousemove", function (e) {
            if (mouseDown) {
                var dx = e.screenX - downX;
                downX = e.screenX;
                if (((dx < 0) && (accumX > 0)) ||
                    ((dx > 0) && (accumX < 0))) {
                    accumX = 0;
                }
                accumX += dx * (callCanvas.width / callCanvas.offsetWidth);

                if (Math.abs(accumX) > scrubThreshold) {
                    var units = Math.floor(accumX / scrubThreshold);
                    if (accumX > 0) {
                        accumX -= units;
                    } else {
                        accumX += -units;
                    }
                    controller.step(units);
                }
            }
        }, false);

        this.frame = null;
        this.callIndex = null;

        controller.stateChanged.addListener(this, this.setState);
        controller.frameChanged.addListener(this, this.setFrame);
        controller.frameCleared.addListener(this, this.frameCleared);
        controller.frameStepped.addListener(this, this.frameStepped);
    };

    Scrubber.prototype.setState = function setState(state) {
    };

    Scrubber.prototype.setFrame = function setFrame(frame) {
        this.frame = frame;
        this.callIndex = null;

        if (frame) {
            gli.ui.changeClass(this.el, "gli-scrubber-disabled", "gli-scrubber-enabled");
        } else {
            gli.ui.changeClass(this.el, "gli-scrubber-enabled", "gli-scrubber-disabled");
        }

        this.measure();
        this.redrawHighlight();
        this.redrawCalls();
    };

    Scrubber.prototype.frameCleared = function frameCleared(context) {
        //this.setCallIndex(null);
    };

    Scrubber.prototype.frameStepped = function frameStepped(context) {
        this.setCallIndex(context.callIndex);
    };

    Scrubber.prototype.setCallIndex = function setCallIndex(callIndex) {
        if (this.callIndex === callIndex) {
            return;
        }

        console.log("set index: " + callIndex);

        this.callIndex = callIndex;

        this.redrawHighlight();
    };

    Scrubber.prototype.measure = function measure() {
        var frame = this.frame;
        if (!frame) {
            return;
        }

        this.highlightCanvas.width = frame.calls.length * 3;
        this.callCanvas.width = frame.calls.length * 3;
    };

    Scrubber.prototype.clearHighlight = function clearHighlight() {
        var ctx = this.highlightCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.highlightCanvas.width, this.highlightCanvas.height);
    };

    Scrubber.prototype.redrawHighlight = function redrawHighlight() {
        if (!this.frame || (this.callIndex === null)) {
            this.clearHighlight();
            return;
        }

        var ctx = this.highlightCanvas.getContext("2d");

        var w = this.highlightCanvas.width;
        var h = this.highlightCanvas.height;
        var frame = this.frame;

        ctx.clearRect(0, 0, w, h);

        var scalex = 3;

        var x = this.callIndex * scalex;
        var linew = scalex;
        ctx.fillStyle = "rgb(255,0,0)";
        ctx.fillRect(x, 0, linew, h);
    };

    Scrubber.prototype.clearCalls = function clearCalls() {
        var ctx = this.callCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.callCanvas.width, this.callCanvas.height);
    };

    Scrubber.prototype.redrawCalls = function redrawCalls() {
        if (!this.frame) {
            this.clearCalls();
            return;
        }

        var ctx = this.callCanvas.getContext("2d");

        var w = this.callCanvas.width;
        var h = this.callCanvas.height;
        var frame = this.frame;

        ctx.clearRect(0, 0, w, h);

        var scalex = 3;
        var linew = 1;
        var linepad = 1;
        var scaley = h / 2;

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            var x = n * scalex + linepad;
            var lineh = scaley;
            ctx.fillRect(x, h - lineh, linew, lineh);
        }
    };

    ui.Scrubber = Scrubber;

})();
