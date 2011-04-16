(function () {
    var ui = glinamespace("gli.ui");

    var Scrubber = function Scrubber(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-scrubber");
        gli.ui.addClass(el, "gli-scrubber-disabled");
        parentElement.appendChild(el);

        this.frame = null;
    };

    Scrubber.prototype.setFrame = function setFrame(frame) {
        this.frame = frame;

        if (frame) {
            gli.ui.changeClass(this.el, "gli-scrubber-disabled", "gli-scrubber-enabled");
        } else {
            gli.ui.changeClass(this.el, "gli-scrubber-enabled", "gli-scrubber-disabled");
        }
    };

    ui.Scrubber = Scrubber;

})();
