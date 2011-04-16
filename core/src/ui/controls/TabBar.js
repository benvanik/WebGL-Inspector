(function () {
    var controls = glinamespace("gli.ui.controls");
    
    var TabBar = function TabBar(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-tabbar");
        parentElement.appendChild(el);
    };
    
    controls.TabBar = TabBar;
    
})();
