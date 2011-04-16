(function () {
    var ui = glinamespace("gli.ui");
    
    var Window = function Window(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-window");
        parentElement.appendChild(el);
    };
    
    ui.Window = Window;
    
})();
