(function () {
    var ui = glinamespace("gli.ui");

    var Tab = function Tab(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-tab");
        gli.ui.addClass(el, "gli-tab-hidden");
        parentElement.appendChild(el);
    };

    Tab.prototype.show = function show() {
        gli.ui.changeClass(this.el, "gli-tab-hidden", "gli-tab-visible");
    };

    Tab.prototype.hide = function hide() {
        gli.ui.changeClass(this.el, "gli-tab-visible", "gli-tab-hidden");
    };

    Tab.prototype.layout = function layout() {
    };

    ui.Tab = Tab;

})();
