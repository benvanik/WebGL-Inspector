(function () {
    var ui = glinamespace("gli.ui");

    var DrawInfo = function (context, name) {
        glisubclass(gli.ui.PopupWindow, this, [context, name, "Draw Info", 610, 600]);
    };

    DrawInfo.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var doc = this.browserWindow.document;
        var gl = context;

        // TODO: toolbar buttons/etc
        
        // TODO: move to shared code
        function prepareCanvas(canvas) {
            var frag = doc.createDocumentFragment();
            frag.appendChild(canvas);
            var gl = null;
            try {
                if (canvas.getContextRaw) {
                    gl = canvas.getContextRaw("experimental-webgl");
                } else {
                    gl = canvas.getContext("experimental-webgl");
                }
            } catch (e) {
                // ?
                alert("Unable to create pixel history canvas: " + e);
            }
            gli.enableAllExtensions(gl);
            gli.hacks.installAll(gl);
            return gl;
        };
        this.canvas = doc.createElement("canvas");
        this.gl = prepareCanvas(this.canvas);
    };

    DrawInfo.prototype.dispose = function () {
        this.canvas = null;
        this.gl = null;
    };

    DrawInfo.prototype.clear = function () {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info";
        this.elements.innerDiv.innerHTML = "";
    };
    
    DrawInfo.prototype.captureDrawInfo = function (frame, call) {
        var drawInfo = {
        };
        
        return drawInfo;
    };

    DrawInfo.prototype.inspectDrawCall = function (frame, call) {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info: #" + call.ordinal + " " + call.name;

        // Switch mirror set
        frame.switchMirrors("drawinfo");

        // TODO: build UI
        var drawInfo = this.captureDrawInfo(frame, call);

        // Restore all resource mirrors
        frame.switchMirrors(null);
    };

    ui.DrawInfo = DrawInfo;
})();
