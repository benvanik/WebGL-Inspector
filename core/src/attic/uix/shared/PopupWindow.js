(function () {
    var ui = glinamespace("gli.ui");

    var PopupWindow = function (w, name, title, defaultWidth, defaultHeight) {
        var self = this;
        this.w = w;

        var child = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + defaultWidth + ",innerHeight=" + defaultHeight + "");
        child.document.writeln("<html><head><title>" + title + "</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
        child.focus();

        child.addEventListener("unload", function () {
            self.dispose();
            if (self.browserWindow) {
                self.browserWindow.closed = true;
                self.browserWindow = null;
            }
            w.windows[name] = null;
        }, false);

        child.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, child);
        } else {
            var targets = [child.document.body, child.document.head, child.document.documentElement];
            for (var n = 0; n < targets.length; n++) {
                var target = targets[n];
                if (target) {
                    var link = child.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = window["gliCssUrl"];
                    target.appendChild(link);
                    break;
                }
            }
        }

        this.elements = {};

        gli.util.setTimeout(function () {
            var doc = self.browserWindow.document;
            var body = doc.body;

            var toolbarDiv = self.elements.toolbarDiv = doc.createElement("div");
            toolbarDiv.className = "popup-toolbar";
            body.appendChild(toolbarDiv);

            var innerDiv = self.elements.innerDiv = doc.createElement("div");
            innerDiv.className = "popup-inner";
            body.appendChild(innerDiv);

            self.setup();
        }, 0);
    };

    PopupWindow.prototype.addToolbarToggle = function (name, tip, defaultValue, callback) {
        var self = this;
        var doc = this.browserWindow.document;
        var toolbarDiv = this.elements.toolbarDiv;

        var input = doc.createElement("input");
        input.style.width = "inherit";
        input.style.height = "inherit";

        input.type = "checkbox";
        input.title = tip;
        input.checked = defaultValue;

        input.onchange = function () {
            callback.apply(self, [input.checked]);
        };

        var span = doc.createElement("span");
        span.innerHTML = "&nbsp;" + name;

        span.onclick = function () {
            input.checked = !input.checked;
            callback.apply(self, [input.checked]);
        };

        var el = doc.createElement("div");
        el.className = "popup-toolbar-toggle";
        el.appendChild(input);
        el.appendChild(span);

        toolbarDiv.appendChild(el);

        callback.apply(this, [defaultValue]);
    };

    PopupWindow.prototype.buildPanel = function () {
        var doc = this.browserWindow.document;

        var panelOuter = doc.createElement("div");
        panelOuter.className = "popup-panel-outer";

        var panel = doc.createElement("div");
        panel.className = "popup-panel";

        panelOuter.appendChild(panel);
        this.elements.innerDiv.appendChild(panelOuter);
        return panel;
    };

    PopupWindow.prototype.setup = function () {
    };

    PopupWindow.prototype.dispose = function () {
    };

    PopupWindow.prototype.focus = function () {
        this.browserWindow.focus();
    };

    PopupWindow.prototype.close = function () {
        this.dispose();
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        this.w.windows[name] = null;
    };

    PopupWindow.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    PopupWindow.show = function (w, type, name, callback) {
        var existing = w.windows[name];
        if (existing && existing.isOpened()) {
            existing.focus();
            if (callback) {
                callback(existing);
            }
        } else {
            if (existing) {
                existing.dispose();
            }
            w.windows[name] = new type(w, name);
            if (callback) {
                gli.util.setTimeout(function () {
                    // May have somehow closed in the interim
                    var popup = w.windows[name];
                    if (popup) {
                        callback(popup);
                    }
                }, 0);
            }
        }
    };

    ui.PopupWindow = PopupWindow;
})();
