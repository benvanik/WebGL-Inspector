(function () {
    var ui = glinamespace("gli.ui");

    var Popup = function Popup(name, options) {
        var self = this;

        this.options = options;

        var dimensions = gli.ui.settings.session.popups[name];

        var child = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + dimensions.width + ",innerHeight=" + dimensions.height + "");
        child.document.writeln("<html><head><title>" + options.title + "</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
        child.focus();

        child.gli = window.gli;
        child.gliloader = window.gliloader;
        child.gliCssUrl = window.gliCssUrl;

        if (window.gliloader) {
            gliloader.load(["ui_css"], function () { }, child);
        } else {
            var targets = [child.document.body, child.document.head, child.document.documentElement];
            for (var n = 0; n < targets.length; n++) {
                var target = targets[n];
                if (target) {
                    var link = child.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = window.gliCssUrl;
                    target.appendChild(link);
                    break;
                }
            }
        }

        this.elements = {};

        function onResize() {
            gli.ui.settings.session.popups[name] = {
                width: child.innerWidth,
                height: child.innerHeight
            };
            gli.ui.settings.save();
        };
        child.addEventListener("resize", onResize, false);

        function onUnload() {
            child.removeEventListener("resize", onResize, false);
            child.removeEventListener("unload", onUnload, false);
            self.dispose();
            if (self.browserWindow) {
                self.browserWindow.closed = true;
                self.browserWindow = null;
            }
            Popup.allWindows[name] = null;
        };
        child.addEventListener("unload", onUnload, false);

        gli.util.setTimeout(function () {
            var doc = self.browserWindow.document;

            var body = doc.body;
            gli.ui.addClass(body, "gli-popup");

            if (options.miniBar) {
                // TODO: minibar
                var toolbarDiv = self.elements.toolbarDiv = doc.createElement("div");
                gli.ui.addClass(toolbarDiv, "gli-popup-toolbar");
                body.appendChild(toolbarDiv);
            }

            var innerDiv = self.elements.innerDiv = doc.createElement("div");
            gli.ui.addClass(innerDiv, "gli-popup-inner");
            body.appendChild(innerDiv);

            if (options.statusBar) {
                // TODO: statusbar
            }

            self.setup();
        }, 0);
    };

    Popup.prototype.getRootElement = function getRootElement() {
        return this.elements.innerDiv;
    };

    Popup.prototype.focus = function focus() {
        this.browserWindow.focus();
    };

    Popup.prototype.close = function close() {
        this.dispose();
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        Popup.allWindows[name] = null;
    };

    Popup.prototype.isOpened = function isOpened() {
        return this.browserWindow && !this.browserWindow.closed;
    };

    Popup.prototype.setup = function setup() {
        // ?
    };

    Popup.prototype.dispose = function dispose() {
        // ?
    };

    Popup.allWindows = {};

    Popup.show = function show(name, options, callback) {
        var existing = Popup.allWindows[name];
        if (existing && existing.isOpened()) {
            existing.focus();
            if (callback) {
                callback(existing);
            }
        } else {
            if (existing) {
                existing.dispose();
            }
            Popup.allWindows[name] = new Popup(name, options);
            if (callback) {
                gli.util.setTimeout(function () {
                    // May have somehow closed in the interim
                    var popup = Popup.allWindows[name];
                    if (popup) {
                        callback(popup);
                    }
                }, 0);
            }
        }
    };

    Popup.closeAll = function closeAll() {
        for (var name in Popup.allWindows) {
            var popup = Popup.allWindows[name];
            if (popup) {
                popup.close();
            }
        }
        Popup.allWindows = {};
    };

    window.addEventListener("beforeunload", function () {
        Popup.closeAll();
    }, false);

    ui.Popup = Popup;

})();
