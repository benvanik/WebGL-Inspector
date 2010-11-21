(function () {
    var host = glinamespace("gli.host");

    // TODO: option? setting? etc?
    var usePopup = false;

    function requestCapture(context) {
        context.requestCapture(function (context, frame) {
            for (var n = 0; n < frame.calls.length; n++) {
                var call = frame.calls[n];
                call.info = gli.info.functions[call.name];
            }
            context.frames.push(frame);
            if (context.ui) {
                context.ui.appendFrame(frame);
            }
        });
    };

    var InlineWindow = function (context) {
        var self = this;
        this.context = context;

        var w = this.element = document.createElement("div");
        w.className = "yui3-cssreset inline-window-host";
        w.style.height = "275px";
        document.body.appendChild(w);

        this.splitter = new gli.controls.SplitterBar(w, "horizontal", 112, 42, null, function (newHeight) {
            context.ui.layout();
        });

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, window);
        }

        context.ui = new gli.ui.Window(context, window.document, w);
        
        // Keep the UI at the bottom of the page even if scrolling
        document.addEventListener("scroll", function () {
            w.style.bottom = -window.pageYOffset + "px";
        }, false);

        this.opened = true;
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
    };

    var PopupWindow = function (context) {
        var self = this;
        this.context = context;

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=1000,innerHeight=350");
        w.document.writeln("<html><head><title>WebGL Inspector</title></head><body style='margin: 0px; padding: 0px;'></body></html>");

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

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        }

        setTimeout(function () {
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
    };
    PopupWindow.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    function requestFullUI(context) {
        if (usePopup) {
            if (context.window) {
                if (context.window.isOpened()) {
                    context.window.focus();
                } else {
                    context.window.close();
                }
            }

            if (!context.window) {
                context.window = new PopupWindow(context);
            }
        } else {
            if (!context.window) {
                context.window = new InlineWindow(context);
            } else {
                context.window.toggle();
            }
        }
    };

    function injectUI(ui) {
        var context = ui.context;

        var button1 = document.createElement("div");
        button1.style.zIndex = "99999";
        button1.style.position = "absolute";
        button1.style.right = "38px";
        button1.style.top = "5px";
        button1.style.cursor = "pointer";
        button1.style.backgroundColor = "rgba(50,10,10,0.8)";
        button1.style.color = "red";
        button1.style.fontSize = "8pt";
        button1.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        button1.style.fontWeight = "bold";
        button1.style.padding = "5px";
        button1.style.border = "1px solid red";
        button1.style.webkitUserSelect = "none";
        button1.style.mozUserSelect = "none";
        button1.title = "Capture frame (F12)";
        button1.innerHTML = "Capture";
        document.body.appendChild(button1);

        button1.addEventListener("click", function () {
            requestCapture(context);
        }, false);

        var button2 = document.createElement("div");
        button2.style.zIndex = "99999";
        button2.style.position = "absolute";
        button2.style.right = "5px";
        button2.style.top = "5px";
        button2.style.cursor = "pointer";
        button2.style.backgroundColor = "rgba(10,50,10,0.8)";
        button2.style.color = "rgb(0,255,0)";
        button2.style.fontSize = "8pt";
        button2.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        button2.style.fontWeight = "bold";
        button2.style.padding = "5px";
        button2.style.border = "1px solid rgb(0,255,0)";
        button2.style.webkitUserSelect = "none";
        button2.style.mozUserSelect = "none";
        button2.title = "Show full inspector (F11)";
        button2.innerHTML = "UI";
        document.body.appendChild(button2);

        button2.addEventListener("click", function () {
            requestFullUI(context);
        }, false);
    };

    function injectHandlers(ui) {
        var context = ui.context;

        // Key handler to listen for capture requests
        document.addEventListener("keydown", function (event) {
            var handled = false;
            switch (event.keyCode) {
                case 122: // F11
                    requestFullUI(context);
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
    };

    var HostUI = function (context) {
        this.context = context;

        injectUI(this);
        injectHandlers(this);

        this.context.frames = [];
    };

    host.HostUI = HostUI;
})();
