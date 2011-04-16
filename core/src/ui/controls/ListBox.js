(function () {
    var controls = glinamespace("gli.ui.controls");
    
    var ListBox = function ListBox(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-listbox");
        parentElement.appendChild(el);
    };
    
    controls.ListBox = ListBox;
    
})();
