(function () {
    var controls = glinamespace("gli.ui.controls");
    
    var SurfaceView = function SurfaceView(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-surfaceview");
        parentElement.appendChild(el);
    };
    
    controls.SurfaceView = SurfaceView;
    
})();
