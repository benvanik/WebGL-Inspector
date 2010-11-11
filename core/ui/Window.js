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

        var buttonHandlers = {};

        function addButton(bar, name, tip, callback) {
            var el = document.createElement("div");
            el.className = "toolbar-button toolbar-button-command-" + name;

            el.title = tip;
            el.innerHTML = tip;

            el.onclick = function () {
                callback.apply(self);
            };
            buttonHandlers[name] = callback;

            bar.appendChild(el);

            self.buttons[name] = el;
        };

        addButton(this.elements.bar, "trace", "Trace", function () {
            console.log("trace");
        });
        addButton(this.elements.bar, "timeline", "Timeline", function () {
            console.log("timeline");
        });
        addButton(this.elements.bar, "state", "State", function () {
            console.log("state");
        });
        addButton(this.elements.bar, "textures", "Textures", function () {
            console.log("textures");
        });
        addButton(this.elements.bar, "buffers", "Buffers", function () {
            console.log("buffers");
        });
        addButton(this.elements.bar, "programs", "Programs", function () {
            console.log("programs");
        });
    };

    function writeDocument(document) {
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

        document.body.appendChild(root);

        root.elements = {
            toolbar: toolbar,
            middle: middle
        };

        return root;
    };

    var Window = function (context, document) {
        this.context = context;
        this.document = document;

        this.root = writeDocument(document);

        this.controller = new gli.replay.Controller();

        this.toolbar = new Toolbar(this);
        this.frameListing = new gli.ui.FrameListing(this);
        this.traceView = new gli.ui.TraceView(this);

        var canvas = document.createElement("canvas");
        canvas.width = context.canvas.width;
        canvas.height = context.canvas.height;
        document.body.appendChild(canvas);
        this.controller.setOutput(canvas);

        for (var n = 0; n < context.frames.length; n++) {
            var frame = context.frames[n];
            this.frameListing.appendFrame(frame);
        }
        if (context.frames.length > 0) {
            this.frameListing.selectFrame(context.frames[context.frames.length - 1]);
        }
    };

    Window.prototype.appendFrame = function (frame) {
        this.frameListing.appendFrame(frame);
        this.frameListing.selectFrame(frame);
    };

    ui.Window = Window;
})();
