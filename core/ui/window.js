(function () {

    var Titlebar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            titlecap: w.root.getElementsByClassName("window-titlecap")[0],
            titlename: w.root.getElementsByClassName("window-titlename")[0],
            windowControls: {
                minimize: w.root.getElementsByClassName("window-control-minimize")[0],
                maximize: w.root.getElementsByClassName("window-control-maximize")[0],
                restore: w.root.getElementsByClassName("window-control-restore")[0]
            }
        };

        this.elements.titlename.innerHTML = "WebGL Inspector";

        this.elements.titlecap.onclick = function () {
            w.captureFrame();
        };

        this.elements.windowControls.minimize.onclick = function () {
            w.minimize();
        };
        this.elements.windowControls.maximize.onclick = function () {
            w.maximize();
        };
        this.elements.windowControls.restore.onclick = function () {
            w.restore();
        };
    };

    var Toolbar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            toolbar: w.root.getElementsByClassName("window-toolbar")[0]
        };
    };

    var Statusbar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {};
    };

    var Window = function (context, root, stateHUD, outputHUD) {
        this.context = context;
        this.root = root;

        this.stateHUD = stateHUD;
        this.outputHUD = outputHUD;

        this.elements = {
            titlebar: this.root.getElementsByClassName("window-titlebar")[0],
            toolbar: this.root.getElementsByClassName("window-toolbar")[0],
            middle: this.root.getElementsByClassName("window-middle")[0],
            bottom: this.root.getElementsByClassName("window-bottom")[0]
        };

        this.titlebar = new Titlebar(this);
        this.toolbar = new Toolbar(this);
        this.frameListing = new gli.ui.FrameListing(this);
        this.traceView = new gli.ui.TraceView(this);
        this.statusbar = new Statusbar(this);
    };

    Window.prototype.minimize = function () {
        this.elements.toolbar.style.display = "none";
        this.elements.middle.style.display = "none";
        this.elements.bottom.style.display = "none";
    };
    Window.prototype.maximize = function () {
        // TODO: proper maximize behavior
        this.restore();
    };
    Window.prototype.restore = function () {
        this.elements.toolbar.style.display = "";
        this.elements.middle.style.display = "";
        this.elements.bottom.style.display = "";
    };

    Window.prototype.captureFrame = function () {
        var self = this;
        this.context.capture(function (context, stream) {
            var frame = stream.frames[stream.frames.length - 1];
            self.frameListing.addFrame(frame);
            self.frameListing.selectFrame(frame);
        });
    };

    gli.ui = gli.ui || {};
    gli.ui.Window = Window;

    gli.ui.initialize = function (context, windowEl, stateHUDEl, outputHUDEl) {
        gli.ui.stateHUD = new gli.ui.StateHUD(context, stateHUDEl);
        gli.ui.outputHUD = new gli.ui.OutputHUD(context, outputHUDEl);
        gli.ui.window = new gli.ui.Window(context, windowEl, gli.ui.stateHUD, gli.ui.outputHUD);
    };
})();
