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
            toolbar: w.root.getElementsByClassName("hud-toolbar")[0],
            bufferList: w.root.getElementsByClassName("output-buffer-dropdown")[0],
            sizeList: w.root.getElementsByClassName("output-size-dropdown")[0]
        };

        this.elements.bufferList.onchange = function () {
            var value = self.elements.bufferList.options[self.elements.bufferList.selectedIndex].value;
            w.displayBuffer(value);
        };

        this.elements.sizeList.onchange = function () {
            var value = self.elements.sizeList.options[self.elements.sizeList.selectedIndex].value;
            w.resizeTo(value);
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
        this.canvas.internalInspectorSurface = true;
        var sourceCanvas = context.canvas;
        this.canvas.width = sourceCanvas.width;
        this.canvas.height = sourceCanvas.height;
        // TODO: watch canvas resize

        this.scaledCanvas = document.createElement("canvas");
        this.scaledCanvas.className = this.canvas.className;
        this.scaledCanvas.width = sourceCanvas.width;
        this.scaledCanvas.height = sourceCanvas.height;
        this.canvas.parentNode.appendChild(this.scaledCanvas);

        this.titlebar = new Titlebar(this);
        this.toolbar = new Toolbar(this);
        this.statusbar = new Statusbar(this);

        //this.minimize();

        this.scale = 75;
        this.resizeTo(this.scale);
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

    OutputHUD.prototype.displayBuffer = function (id) {
        alert("would switch buffers");
    };

    OutputHUD.prototype.resizeTo = function (scale) {
        if (scale == 100) {
            // Native scale - remove any hacks and be normal
            this.canvas.style.display = "";
            this.scaledCanvas.style.display = "none";
            this.scaledCanvas.width = 1;
            this.scaledCanvas.height = 1;
        } else {
            // Custom scale - need to draw into a temporary canvas
            this.canvas.style.display = "none";
            this.scaledCanvas.style.display = "";
            this.scaledCanvas.width = this.canvas.width * (scale / 100);
            this.scaledCanvas.height = this.canvas.height * (scale / 100);
        }
        this.scale = scale;
        this.refresh();
    };

    OutputHUD.prototype.refresh = function () {
        if (this.scale != 100) {
            // Redraw the scaled canvas
            var dw = this.scaledCanvas.width;
            var dh = this.scaledCanvas.height;
            var ctx = this.scaledCanvas.getContext("2d");
            ctx.clearRect(0, 0, dw, dh);
            ctx.drawImage(this.canvas, 0, 0, dw, dh);
        }
    };

    gli = gli || {};
    gli.ui = gli.ui || {};
    gli.ui.OutputHUD = OutputHUD;

})();
