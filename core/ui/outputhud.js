(function () {

    var Titlebar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            titlename: w.root.getElementsByClassName("hud-titlename")[0],
            windowControls: {
                minimize: w.root.getElementsByClassName("hud-control-minimize")[0],
                restore: w.root.getElementsByClassName("hud-control-restore")[0]
            }
        };

        this.elements.titlename.innerHTML = "Output";

        this.elements.windowControls.minimize.onclick = function () {
            w.minimize();
        };
        this.elements.windowControls.restore.onclick = function () {
            w.restore();
        };
    };

    var Toolbar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            toolbar: w.root.getElementsByClassName("hud-toolbar")[0]
        };
    };

    var Statusbar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {};
    };

    var OutputHUD = function (context, root) {
        this.context = context;
        this.root = root;

        this.elements = {
            titlebar: this.root.getElementsByClassName("hud-titlebar")[0],
            toolbar: this.root.getElementsByClassName("hud-toolbar")[0],
            middle: this.root.getElementsByClassName("hud-middle")[0],
            bottom: this.root.getElementsByClassName("hud-bottom")[0]
        };

        this.canvas = this.root.getElementsByClassName("output-canvas")[0];
        var sourceCanvas = context.canvas;
        this.canvas.width = sourceCanvas.width;
        this.canvas.height = sourceCanvas.height;
        // TODO: watch canvas resize

        this.titlebar = new Titlebar(this);
        this.toolbar = new Toolbar(this);
        this.statusbar = new Statusbar(this);
    };

    OutputHUD.prototype.minimize = function () {
        this.elements.toolbar.style.display = "none";
        this.elements.middle.style.display = "none";
        this.elements.bottom.style.display = "none";
    };

    OutputHUD.prototype.restore = function () {
        this.elements.toolbar.style.display = "";
        this.elements.middle.style.display = "";
        this.elements.bottom.style.display = "";
    };

    gli = gli || {};
    gli.ui = gli.ui || {};
    gli.ui.OutputHUD = OutputHUD;

})();
