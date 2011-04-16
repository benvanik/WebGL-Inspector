(function () {
    var ui = glinamespace("gli.ui");

    var Scrubber = function Scrubber(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

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

        callCanvas.addEventListener("mousedown", function (e) {
        }, false);
        callCanvas.addEventListener("mouseup", function (e) {
        }, false);
        callCanvas.addEventListener("mouseout", function (e) {
        }, false);
        callCanvas.addEventListener("mousemove", function (e) {
        }, false);

        this.frame = null;
        this.index = 0;
    };

    Scrubber.prototype.setFrame = function setFrame(frame) {
        this.frame = frame;

        if (frame) {
            gli.ui.changeClass(this.el, "gli-scrubber-disabled", "gli-scrubber-enabled");
        } else {
            gli.ui.changeClass(this.el, "gli-scrubber-enabled", "gli-scrubber-disabled");
        }

        this.measure();
        this.redrawHighlight();
        this.redrawCalls();
    };

    Scrubber.prototype.setIndex = function setIndex(index) {
        this.index = index;

        this.redrawHighlight();
    };

    Scrubber.prototype.measure = function measure() {
        var frame = this.frame;
        if (!frame) {
            return;
        }

        this.highlightCanvas.width = frame.calls.length * 2;
        this.callCanvas.width = frame.calls.length * 2;
    };

    Scrubber.prototype.clearHighlight = function clearHighlight() {
        var ctx = this.highlightCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.highlightCanvas.width, this.highlightCanvas.height);
    };

    Scrubber.prototype.redrawHighlight = function redrawHighlight() {
        if (!this.frame) {
            this.clearHighlight();
            return;
        }

        var ctx = this.highlightCanvas.getContext("2d");

        var w = this.highlightCanvas.width;
        var h = this.highlightCanvas.height;
        var frame = this.frame;

        ctx.clearRect(0, 0, w, h);

        var scalex = 3;

        var x = this.index * scalex;
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
