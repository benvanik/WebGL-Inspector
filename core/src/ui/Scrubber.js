(function () {
    var ui = glinamespace("gli.ui");
    
    var Scrubber = function Scrubber(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-scrubber");
        parentElement.appendChild(el);
    };
    
    ui.Scrubber = Scrubber;
    
})();
