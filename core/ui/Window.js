(function () {
    var ui = glinamespace("gli.ui");

    var Toolbar = function (w) {
        var self = this;
        var document = w.document;

        this.window = w;
        this.elements = {
            bar: w.root.getElementsByClassName("window-toolbar")[0]
        };
        this.buttons = {};
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

    var Tab = function (w, container, name) {
        this.name = name;
        this.hasFocus = false;

        var el = this.el = document.createElement("div");
        el.className = "window-tab-root";
        container.appendChild(el);
    };
    Tab.prototype.gainFocus = function () {
        this.hasFocus = true;
        this.el.className += " window-tab-selected";
    };
    Tab.prototype.loseFocus = function () {
        this.hasFocus = false;
        this.el.className = this.el.className.replace(" window-tab-selected", "");
    };

    // TODO: move these someplace else
    var TraceTab = function (w) {
        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-trace-inspector">' +
        '            <!-- inspector -->' +
        '        </div>' +
        '        <div class="window-trace-outer">' +
        '            <div class="window-trace">' +
        '                <div class="trace-minibar">' +
        '                    <!-- minibar -->' +
        '                </div>' +
        '                <div class="trace-listing">' +
        '                    <!-- call trace -->' +
        '                </div>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-frames">' +
        '        <div class="frames-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="frames-toolbar">' +
        '            capture, delete</div>' +
        '    </div>' +
        '</div>';
        this.el.innerHTML = html;

        this.frameListing = new gli.ui.FrameListing(w, this.el);
        this.traceView = new gli.ui.TraceView(w, this.el);

        this.frameListing.frameSelected.addListener(this, function (frame) {
            this.traceView.setFrame(frame);
        });

        var context = w.context;
        for (var n = 0; n < context.frames.length; n++) {
            var frame = context.frames[n];
            this.frameListing.appendFrame(frame);
        }
        if (context.frames.length > 0) {
            this.frameListing.selectFrame(context.frames[context.frames.length - 1]);
        }
    };

    var Window = function (context, document, elementHost) {
        var self = this;
        this.context = context;
        this.document = document;

        this.root = writeDocument(document, elementHost);

        this.controller = new gli.replay.Controller();

        this.toolbar = new Toolbar(this);
        this.tabs = {};
        this.currentTab = null;

        var middle = this.root.elements.middle;
        function addTab(name, tip, implType) {
            var tab = new Tab(self, middle, name);

            if (implType) {
                implType.apply(tab, [self]);
            }

            self.toolbar.addSelection(name, tip);

            self.tabs[name] = tab;
        };

        addTab("trace", "Trace", TraceTab);
        addTab("timeline", "Timeline");
        addTab("state", "State");
        addTab("textures", "Textures");
        addTab("buffers", "Buffers");
        addTab("programs", "Programs");

        this.selectTab("trace");
    };

    Window.prototype.selectTab = function (name) {
        if (this.currentTab && this.currentTab.name == name) {
            return;
        }
        console.log("switching to tab " + name);
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
    };

    Window.prototype.appendFrame = function (frame) {
        var tab = this.tabs["trace"];
        var frameListing = tab.frameListing;
        frameListing.appendFrame(frame);
        frameListing.selectFrame(frame);
    };

    ui.Window = Window;
})();
