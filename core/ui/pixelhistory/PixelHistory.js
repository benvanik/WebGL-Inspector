(function () {
    var ui = glinamespace("gli.ui");

    var PixelHistory = function (context) {
        var self = this;
        this.context = context;

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=610,innerHeight=600");
        w.document.writeln("<html><head><title>Pixel History</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
        w.focus();

        w.addEventListener("unload", function () {
            if (self.browserWindow) {
                self.browserWindow.closed = true;
                self.browserWindow = null;
            }
            context.ui.pixelHistory = null;
        }, false);

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        } else {
            var targets = [w.document.body, w.document.head, w.document.documentElement];
            for (var n = 0; n < targets.length; n++) {
                var target = targets[n];
                if (target) {
                    var link = w.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = window["gliCssUrl"];
                    target.appendChild(link);
                    break;
                }
            }
        }

        setTimeout(function () {
            self.setup();
        }, 0);
    };

    PixelHistory.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var gl = context;

        // Build UI
        var body = this.browserWindow.document.body;

        var toolbarDiv = document.createElement("div");
        toolbarDiv.className = "pixelhistory-toolbar";
        body.appendChild(toolbarDiv);

        var pickerDiv = document.createElement("div");
        pickerDiv.className = "pixelhistory-inner";
        body.appendChild(pickerDiv);
    };

    PixelHistory.prototype.inspectPixel = function (frame, x, y) {
        console.log("inspect");
    };

    PixelHistory.prototype.focus = function () {
        this.browserWindow.focus();
    };
    PixelHistory.prototype.close = function () {
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        this.context.ui.pixelHistory = null;
    };
    PixelHistory.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    ui.PixelHistory = PixelHistory;
})();
