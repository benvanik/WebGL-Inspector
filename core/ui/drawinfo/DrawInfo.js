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
    };

    DrawInfo.prototype.dispose = function () {
    };

    DrawInfo.prototype.clear = function () {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info";
        this.elements.innerDiv.innerHTML = "";
    };

    DrawInfo.prototype.inspectDrawCall = function (frame, call) {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info: #" + call.ordinal + " " + call.name;

        // Switch mirror set
        frame.switchMirrors("drawinfo");

        // TODO: build UI

        // Restore all resource mirrors
        frame.switchMirrors(null);
    };

    ui.DrawInfo = DrawInfo;
})();
