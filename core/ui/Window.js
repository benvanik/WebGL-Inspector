(function () {
    var ui = glinamespace("gli.ui");
    var host = glinamespace("gli.host");

    var Toolbar = function (w) {
        var self = this;
        var document = w.document;

        this.window = w;
        this.elements = {
            bar: w.root.getElementsByClassName("window-toolbar")[0]
        };
        this.buttons = {};

        function appendRightRegion(title, buttons) {
            var regionDiv = document.createElement("div");
            regionDiv.className = "toolbar-right-region";

            var titleDiv = document.createElement("div");
            titleDiv.className = "toolbar-right-region-title";
            titleDiv.innerHTML = title;
            regionDiv.appendChild(titleDiv);

            var activeIndex = 0;
            var previousSelection = null;

            for (var n = 0; n < buttons.length; n++) {
                var button = buttons[n];

                var buttonSpan = document.createElement("span");
                if (button.name) {
                    buttonSpan.innerHTML = button.name;
                }
                if (button.className) {
                    buttonSpan.className = button.className;
                }
                buttonSpan.title = button.title ? button.title : button.name;
                regionDiv.appendChild(buttonSpan);
                button.el = buttonSpan;

                (function (n, button) {
                    buttonSpan.onclick = function () {
                        if (previousSelection) {
                            previousSelection.el.className = previousSelection.el.className.replace(" toolbar-right-region-active", "");
                        }
                        previousSelection = button;
                        button.el.className += " toolbar-right-region-active";

                        button.onclick.apply(self);
                    };
                })(n, button);

                if (n < buttons.length - 1) {
                    var sep = document.createElement("div");
                    sep.className = "toolbar-right-region-sep";
                    sep.innerHTML = " | ";
                    regionDiv.appendChild(sep);
                }
            }

            // Select first
            buttons[0].el.onclick();

            self.elements.bar.appendChild(regionDiv);
        };
        function appendRightButtons(buttons) {
            var regionDiv = document.createElement("div");
            regionDiv.className = "toolbar-right-buttons";

            for (var n = 0; n < buttons.length; n++) {
                var button = buttons[n];

                var buttonDiv = document.createElement("div");
                if (button.name) {
                    buttonDiv.innerHTML = button.name;
                }
                buttonDiv.className = "toolbar-right-button";
                if (button.className) {
                    buttonDiv.className += " " + button.className;
                }
                buttonDiv.title = button.title ? button.title : button.name;
                regionDiv.appendChild(buttonDiv);
                button.el = buttonDiv;

                (function (button) {
                    buttonDiv.onclick = function () {
                        button.onclick.apply(self);
                    };
                })(button);

                if (n < buttons.length - 1) {
                    var sep = document.createElement("div");
                    sep.className = "toolbar-right-buttons-sep";
                    sep.innerHTML = "&nbsp;";
                    regionDiv.appendChild(sep);
                }
            }

            self.elements.bar.appendChild(regionDiv);
        };

        appendRightButtons([
            /*{
                title: "Options",
                className: "toolbar-right-button-options",
                onclick: function () {
                    alert("options");
                }
            },*/
            {
                title: "Hide inspector (F11)",
                className: "toolbar-right-button-close",
                onclick: function () {
                    gli.host.requestFullUI(w.context);
                }
            }
        ]);
		/*
        appendRightRegion("Version: ", [
            {
                name: "Live",
                onclick: function () {
                    w.setActiveVersion(null);
                }
            },
            {
                name: "Current",
                onclick: function () {
                    w.setActiveVersion("current");
                }
            }
        ]);
        */
        appendRightRegion("Frame Control: ", [
            {
                name: "Normal",
                onclick: function () {
                    host.setFrameControl(0);
                }
            },
            {
                name: "Slowed",
                onclick: function () {
                    host.setFrameControl(250);
                }
            },
            {
                name: "Paused",
                onclick: function () {
                    host.setFrameControl(Infinity);
                }
            }
        ]);
    };
    Toolbar.prototype.addSelection = function (name, tip) {
        var self = this;

        var el = document.createElement("div");
        el.className = "toolbar-button toolbar-button-enabled toolbar-button-command-" + name;

        el.title = tip;
        el.innerHTML = tip;

        el.onclick = function () {
            self.window.selectTab(name);
        };

        this.elements.bar.appendChild(el);

        this.buttons[name] = el;
    };
    Toolbar.prototype.toggleSelection = function (name) {
        for (var n in this.buttons) {
            var el = this.buttons[n];
            el.className = el.className.replace("toolbar-button-selected", "toolbar-button-enabled");
        }
        var el = this.buttons[name];
        if (el) {
            el.className = el.className.replace("toolbar-button-disabled", "toolbar-button-selected");
            el.className = el.className.replace("toolbar-button-enabled", "toolbar-button-selected");
        }
    };

    function writeDocument(document, elementHost) {
        var root = document.createElement("div");
        root.className = "window";

        // Toolbar
        // <div class="window-toolbar">
        // ...
        var toolbar = document.createElement("div");
        toolbar.className = "window-toolbar";
        root.appendChild(toolbar);

        // Middle
        // <div class="window-middle">
        // ...
        var middle = document.createElement("div");
        middle.className = "window-middle";
        root.appendChild(middle);

        if (elementHost) {
            elementHost.appendChild(root);
        } else {
            document.body.appendChild(root);
        }

        root.elements = {
            toolbar: toolbar,
            middle: middle
        };

        return root;
    };

    // TODO: move to helper place
    function appendbr(el) {
        var br = document.createElement("br");
        el.appendChild(br);
    };
    function appendClear(el) {
        var clearDiv = document.createElement("div");
        clearDiv.style.clear = "both";
        el.appendChild(clearDiv);
    };
    function appendSeparator(el) {
        var div = document.createElement("div");
        div.className = "info-separator";
        el.appendChild(div);
        appendbr(el);
    };
    function appendParameters(gl, el, obj, parameters, parameterEnumValues) {
        var table = document.createElement("table");
        table.className = "info-parameters";

        for (var n = 0; n < parameters.length; n++) {
            var enumName = parameters[n];
            var value = obj.parameters[gl[enumName]];

            var tr = document.createElement("tr");
            tr.className = "info-parameter-row";

            var tdkey = document.createElement("td");
            tdkey.className = "info-parameter-key";
            tdkey.innerHTML = enumName;
            tr.appendChild(tdkey);

            var tdvalue = document.createElement("td");
            tdvalue.className = "info-parameter-value";
            if (parameterEnumValues && parameterEnumValues[n]) {
                var valueFound = false;
                for (var m = 0; m < parameterEnumValues[n].length; m++) {
                    if (value == gl[parameterEnumValues[n][m]]) {
                        tdvalue.innerHTML = parameterEnumValues[n][m];
                        valueFound = true;
                        break;
                    }
                }
                if (!valueFound) {
                    tdvalue.innerHTML = value + " (unknown)";
                }
            } else {
                tdvalue.innerHTML = value; // TODO: convert to something meaningful?
            }
            tr.appendChild(tdvalue);

            table.appendChild(tr);
        }

        el.appendChild(table);
    };
    function appendStateParameterRow(w, gl, table, state, param) {
        var tr = document.createElement("tr");
        tr.className = "info-parameter-row";

        var tdkey = document.createElement("td");
        tdkey.className = "info-parameter-key";
        tdkey.innerHTML = param.name;
        tr.appendChild(tdkey);

        var value;
        if (param.value) {
            value = state[param.value];
        } else {
            value = state[param.name];
        }

        // Grab tracked objects
        if (value && value.trackedObject) {
            value = value.trackedObject;
        }

        var tdvalue = document.createElement("td");
        tdvalue.className = "info-parameter-value";

        var text = "";
        var clickhandler = null;

        var UIType = gli.UIType;
        var ui = param.ui;
        switch (ui.type) {
            case UIType.ENUM:
                var anyMatches = false;
                for (var i = 0; i < ui.values.length; i++) {
                    var enumName = ui.values[i];
                    if (value == gl[enumName]) {
                        anyMatches = true;
                        text = enumName;
                    }
                }
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
                }
                break;
            case UIType.ARRAY:
                text = "[" + value + "]";
                break;
            case UIType.BOOL:
                text = value ? "true" : "false";
                break;
            case UIType.LONG:
                text = value;
                break;
            case UIType.ULONG:
                text = value;
                break;
            case UIType.COLORMASK:
                text = value;
                break;
            case UIType.OBJECT:
                // TODO: custom object output based on type
                text = value ? value : "null";
                if (value && value.target && gli.util.isWebGLResource(value.target)) {
                    var typename = glitypename(value.target);
                    switch (typename) {
                        case "WebGLBuffer":
                            clickhandler = function () {
                                w.showBuffer(value, true);
                            };
                            break;
                        case "WebGLFramebuffer":
                            break;
                        case "WebGLProgram":
                            clickhandler = function () {
                                w.showProgram(value, true);
                            };
                            break;
                        case "WebGLRenderbuffer":
                            break;
                        case "WebGLShader":
                            break;
                        case "WebGLTexture":
                            clickhandler = function () {
                                w.showTexture(value, true);
                            };
                            break;
                    }
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value) {
                    var typename = glitypename(value);
                    switch (typename) {
                        case "WebGLUniformLocation":
                            text = '"' + value.sourceUniformName + '"';
                            break;
                    }
                }
                break;
            case UIType.WH:
                text = value[0] + " x " + value[1];
                break;
            case UIType.RECT:
                if (value) {
                    text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
                } else {
                    text = "null";
                }
                break;
            case UIType.STRING:
                text = '"' + value + '"';
                break;
            case UIType.COLOR:
                text = "<div class='info-parameter-color' style='background-color: rgba(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + "," + value[3] + ") !important;'></div> rgba(" + value[0] + ", " + value[1] + ", " + value[2] + ", " + value[3] + ")";
                // TODO: color tip
                break;
            case UIType.FLOAT:
                text = value;
                break;
            case UIType.BITMASK:
                text = "0x" + value.toString(16);
                // TODO: bitmask tip
                break;
            case UIType.RANGE:
                text = value[0] + " - " + value[1];
                break;
            case UIType.MATRIX:
                switch (value.length) {
                    default: // ?
                        text = "[matrix]";
                        break;
                    case 4: // 2x2
                        text = "[matrix 2x2]";
                        break;
                    case 9: // 3x3
                        text = "[matrix 3x3]";
                        break;
                    case 16: // 4x4
                        text = "[matrix 4x4]";
                        break;
                }
                // TODO: matrix tip
                text = "[" + value + "]";
                break;
        }

        tdvalue.innerHTML = text;
        if (clickhandler) {
            tdvalue.className += " trace-call-clickable";
            tdvalue.onclick = function (e) {
                clickhandler();
                e.preventDefault();
                e.stopPropagation();
            };
        }

        tr.appendChild(tdvalue);

        table.appendChild(tr);
    };
    function appendMatrices(gl, el, type, size, value) {
        switch (type) {
            case gl.FLOAT_MAT2:
                for (var n = 0; n < size; n++) {
                    var offset = n * 4;
                    ui.appendMatrix(el, value, offset, 2);
                }
                break;
            case gl.FLOAT_MAT3:
                for (var n = 0; n < size; n++) {
                    var offset = n * 9;
                    ui.appendMatrix(el, value, offset, 3);
                }
                break;
            case gl.FLOAT_MAT4:
                for (var n = 0; n < size; n++) {
                    var offset = n * 16;
                    ui.appendMatrix(el, value, offset, 4);
                }
                break;
        }
    };
    function appendMatrix(el, value, offset, size) {
        var div = document.createElement("div");

        var openSpan = document.createElement("span");
        openSpan.innerHTML = "[";
        div.appendChild(openSpan);

        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var v = value[offset + i * size + j];
                div.appendChild(document.createTextNode(ui.padFloat(v)));
                if (!((i == size - 1) && (j == size - 1))) {
                    var comma = document.createElement("span");
                    comma.innerHTML = ",&nbsp;";
                    div.appendChild(comma);
                }
            }
            if (i < size - 1) {
                appendbr(div);
                var prefix = document.createElement("span");
                prefix.innerHTML = "&nbsp;";
                div.appendChild(prefix);
            }
        }

        var closeSpan = document.createElement("span");
        closeSpan.innerHTML = "&nbsp;]";
        div.appendChild(closeSpan);

        el.appendChild(div);
    };
    function appendArray(el, value) {
        var div = document.createElement("div");

        var openSpan = document.createElement("span");
        openSpan.innerHTML = "[";
        div.appendChild(openSpan);

        var s = "";
        var maxIndex = Math.min(64, value.length);
        var isFloat = glitypename(value).indexOf("Float") >= 0;
        for (var n = 0; n < maxIndex; n++) {
            if (isFloat) {
                s += ui.padFloat(value[n]);
            } else {
                s += "&nbsp;" + ui.padInt(value[n]);
            }
            if (n < value.length - 1) {
                s += ",&nbsp;";
            }
        }
        if (maxIndex < value.length) {
            s += ",... (" + (value.length) + " total)";
        }
        var strSpan = document.createElement("span");
        strSpan.innerHTML = s;
        div.appendChild(strSpan);

        var closeSpan = document.createElement("span");
        closeSpan.innerHTML = "&nbsp;]";
        div.appendChild(closeSpan);

        el.appendChild(div);
    };
    ui.padInt = function (v) {
        var s = String(v);
        if (s >= 0) {
            s = " " + s;
        }
        s = s.substr(0, 11);
        while (s.length < 11) {
            s = " " + s;
        }
        return s.replace(/ /g, "&nbsp;");
    };
    ui.padFloat = function (v) {
        var s = String(v);
        if (s >= 0.0) {
            s = " " + s;
        }
        if (s.indexOf(".") == -1) {
            s += ".";
        }
        s = s.substr(0, 12);
        while (s.length < 12) {
            s += "0";
        }
        return s;
    };
    ui.appendbr = appendbr;
    ui.appendClear = appendClear;
    ui.appendSeparator = appendSeparator;
    ui.appendParameters = appendParameters;
    ui.appendStateParameterRow = appendStateParameterRow;
    ui.appendMatrices = appendMatrices;
    ui.appendMatrix = appendMatrix;
    ui.appendArray = appendArray;

    var Window = function (context, document, elementHost) {
        var self = this;
        this.context = context;
        this.document = document;
        this.browserWindow = window;

        this.root = writeDocument(document, elementHost);

        this.controller = new gli.replay.Controller();

        this.toolbar = new Toolbar(this);
        this.tabs = {};
        this.currentTab = null;
        this.windows = {};

        this.activeVersion = "current"; // or null for live
        this.activeFilter = null;

        var middle = this.root.elements.middle;
        function addTab(name, tip, implType) {
            var tab = new ui.Tab(self, middle, name);

            if (implType) {
                implType.apply(tab, [self]);
            }

            self.toolbar.addSelection(name, tip);

            self.tabs[name] = tab;
        };

        addTab("trace", "Trace", ui.TraceTab);
        addTab("timeline", "Timeline", ui.TimelineTab);
        addTab("state", "State", ui.StateTab);
        addTab("textures", "Textures", ui.TexturesTab);
        addTab("buffers", "Buffers", ui.BuffersTab);
        addTab("programs", "Programs", ui.ProgramsTab);
        //addTab("performance", "Performance", ui.PerformanceTab);

        this.selectTab("trace");

        window.addEventListener("beforeunload", function () {
            for (var n in self.windows) {
                var w = self.windows[n];
                if (w) {
                    w.close();
                }
            }
        }, false);

        gli.host.setTimeout(function () {
            self.selectTab("trace", true);
        }, 0);
    };

    Window.prototype.layout = function () {
        for (var n in this.tabs) {
            var tab = this.tabs[n];
            if (tab.layout) {
                tab.layout();
            }
        }
    };

    Window.prototype.selectTab = function (name, force) {
        if (name.name) {
            name = name.name;
        }
        if (this.currentTab && this.currentTab.name == name && !force) {
            return;
        }
        var tab = this.tabs[name];
        if (!tab) {
            return;
        }

        if (this.currentTab) {
            this.currentTab.loseFocus();
            this.currentTab = null;
        }

        this.currentTab = tab;
        this.currentTab.gainFocus();
        this.toolbar.toggleSelection(name);

        if (tab.layout) {
            tab.layout();
        }
        if (tab.refresh) {
            tab.refresh();
        }
    };

    Window.prototype.setActiveVersion = function (version) {
        if (this.activeVersion == version) {
            return;
        }
        this.activeVersion = version;
        if (this.currentTab.refresh) {
            this.currentTab.refresh();
        }
    };

    Window.prototype.setActiveFilter = function (filter) {
        if (this.activeFilter == filter) {
            return;
        }
        this.activeFilter = filter;
        console.log("would set active filter: " + filter);
    };

    Window.prototype.appendFrame = function (frame) {
        var tab = this.tabs["trace"];
        this.selectTab(tab);
        tab.listing.appendValue(frame);
        tab.listing.selectValue(frame);
    };

    Window.prototype.showTrace = function (frame, callOrdinal) {
        var tab = this.tabs["trace"];
        this.selectTab(tab);
        if (this.controller.currentFrame != frame) {
            tab.listing.selectValue(frame);
        }
        tab.traceView.stepUntil(callOrdinal);
    };

    Window.prototype.showResource = function (resourceTab, resource, switchToCurrent) {
        if (switchToCurrent) {
            // TODO: need to update UI to be able to do this
            //this.setActiveVersion("current");
        }
        var tab = this.tabs[resourceTab];
        this.selectTab(tab);
        tab.listing.selectValue(resource);
        this.browserWindow.focus();
    };

    Window.prototype.showTexture = function (texture, switchToCurrent) {
        this.showResource("textures", texture, switchToCurrent);
    };

    Window.prototype.showBuffer = function (buffer, switchToCurrent) {
        this.showResource("buffers", buffer, switchToCurrent);
    };

    Window.prototype.showProgram = function (program, switchToCurrent) {
        this.showResource("programs", program, switchToCurrent);
    };

    ui.Window = Window;
})();
