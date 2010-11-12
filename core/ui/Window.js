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
        middle.innerHTML = html;

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

    var Tab = function (name) {
        this.name = name;
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

        var canvas = document.createElement("canvas");
        canvas.width = context.canvas.width;
        canvas.height = context.canvas.height;
        //document.body.appendChild(canvas);
        this.controller.setOutput(canvas);

        function addTab(name, tip) {
            var tab = new Tab(name);

            self.toolbar.addSelection(name, tip);

            self.tabs[name] = tab;
        };

        addTab("trace", "Trace");
        addTab("timeline", "Timeline");
        addTab("state", "State");
        addTab("textures", "Textures");
        addTab("buffers", "Buffers");
        addTab("programs", "Programs");

        this.selectTab("trace");

        this.frameListing = new gli.ui.FrameListing(this);
        this.traceView = new gli.ui.TraceView(this);
        for (var n = 0; n < context.frames.length; n++) {
            var frame = context.frames[n];
            this.frameListing.appendFrame(frame);
        }
        if (context.frames.length > 0) {
            this.frameListing.selectFrame(context.frames[context.frames.length - 1]);
        }
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
            //this.currentTab.loseFocus();
        }
        //tab.gainFocus();

        this.currentTab = tab;
        this.toolbar.toggleSelection(name);
    };

    Window.prototype.appendFrame = function (frame) {
        this.frameListing.appendFrame(frame);
        this.frameListing.selectFrame(frame);
    };

    ui.Window = Window;
})();
