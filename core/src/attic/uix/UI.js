(function () {
    var ui = glinamespace("gli.ui");
    
    var InlineWindow = function (context) {
        var self = this;
        this.context = context;

        var w = this.element = document.createElement("div");
        w.className = "yui3-cssreset inline-window-host";

        // TODO: validate height better?
        var hudHeight = gli.settings.session.hudHeight;
        hudHeight = Math.max(112, Math.min(hudHeight, window.innerHeight - 42));
        w.style.height = hudHeight + "px";

        document.body.appendChild(w);

        this.splitter = new gli.controls.SplitterBar(w, "horizontal", 112, 42, null, function (newHeight) {
            context.ui.layout();
            gli.settings.session.hudHeight = newHeight;
            gli.settings.save();
        });

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, window);
        }

        context.ui = new gli.ui.Window(context, window.document, w);
        
        this.opened = true;
        gli.settings.session.hudVisible = true;
        gli.settings.save();
    };
    InlineWindow.prototype.focus = function () {
    };
    InlineWindow.prototype.close = function () {
        if (this.element) {
            document.body.removeChild(this.element);

            this.context.ui = null;
            this.context.window = null;

            this.element = null;
            this.context = null;
            this.splitter = null;
            this.opened = false;
            gli.settings.session.hudVisible = false;
            gli.settings.save();
        }
    };
    InlineWindow.prototype.isOpened = function () {
        return this.opened;
    };
    InlineWindow.prototype.toggle = function () {
        if (this.opened) {
            this.element.style.display = "none";
        } else {
            this.element.style.display = "";
        }
        this.opened = !this.opened;
        gli.settings.session.hudVisible = this.opened;
        gli.settings.save();
        
        var self = this;
        gli.util.setTimeout(function () {
            self.context.ui.layout();
        }, 0);
    };

    var PopupWindow = function (context) {
        var self = this;
        this.context = context;

        gli.settings.session.hudVisible = true;
        gli.settings.save();

        var startupWidth = gli.settings.session.hudPopupWidth ? gli.settings.session.hudPopupWidth : 1000;
        var startupHeight = gli.settings.session.hudPopupHeight ? gli.settings.session.hudPopupHeight : 500;
        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + startupWidth + ",innerHeight=" + startupHeight);
        w.document.writeln("<html><head><title>WebGL Inspector</title></head><body class='yui3-cssreset' style='margin: 0px; padding: 0px;'></body></html>");

        window.addEventListener("beforeunload", function () {
            w.close();
        }, false);

        w.addEventListener("unload", function () {
            context.window.browserWindow.opener.focus();
            context.window = null;
        }, false);

        // Key handler to listen for state changes
        w.document.addEventListener("keydown", function (event) {
            var handled = false;
            switch (event.keyCode) {
                case 122: // F11
                    w.opener.focus();
                    handled = true;
                    break;
                case 123: // F12
                    requestCapture(context);
                    handled = true;
                    break;
            };

            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
        
        w.addEventListener("resize", function () {
            context.ui.layout();
            gli.settings.session.hudPopupWidth = w.innerWidth;
            gli.settings.session.hudPopupHeight = w.innerHeight;
            gli.settings.save()
        }, false);

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        }

        gli.util.setTimeout(function () {
            context.ui = new w.gli.ui.Window(context, w.document);
        }, 0);
    };
    PopupWindow.prototype.focus = function () {
        this.browserWindow.focus();
    };
    PopupWindow.prototype.close = function () {
        this.browserWindow.close();
        this.browserWindow = null;
        this.context.window = null;
        gli.settings.session.hudVisible = false;
        gli.settings.save();
    };
    PopupWindow.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    function requestFullUI(context, hiddenByDefault) {
        if (gli.settings.global.popupHud) {
            if (context.window) {
                if (context.window.isOpened()) {
                    context.window.focus();
                } else {
                    context.window.close();
                }
            }

            if (!context.window) {
                if (!hiddenByDefault) {
                    context.window = new PopupWindow(context);
                }
            }
        } else {
            if (!context.window) {
                context.window = new InlineWindow(context);
                if (hiddenByDefault) {
                    context.window.toggle();
                }
            } else {
                context.window.toggle();
            }
        }
    };
    
    var HostUI = function HostUI(context) {
        this.context = context;

        var spinIntervalId;
        spinIntervalId = gli.util.setInterval(function () {
            var ready = false;
            var cssUrl = null;
            if (window["gliloader"]) {
                cssUrl = gliloader.pathRoot;
            } else {
                cssUrl = window.gliCssUrl;
            }
            ready = cssUrl && cssUrl.length;
            if (ready) {
                // Initialize info and other shared values
                gli.info.initialize();
                
                var hudVisible = true;//gli.settings.session.hudVisible || gli.settings.global.showHud;
                requestFullUI(context, !hudVisible);
                gli.util.clearInterval(spinIntervalId);
            }
        }, 16);
    };

    ui.requestFullUI = requestFullUI;
    ui.HostUI = HostUI;
    
})();
