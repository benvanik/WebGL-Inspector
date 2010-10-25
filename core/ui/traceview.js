(function () {

    var TraceMinibar = function (view, w) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            bar: w.root.getElementsByClassName("trace-minibar")[0]
        };
        this.buttons = {};

        function addButton(bar, name, callback) {
            var el = document.createElement("div");
            el.className = "trace-minibar-button trace-minibar-button-disabled";

            // TODO: style
            el.innerHTML = name;

            el.onclick = function () {
                callback.apply(self);
            };

            bar.appendChild(el);

            self.buttons[name] = el;
        };

        addButton(this.elements.bar, "run", function () {
            alert("run");
        });
        addButton(this.elements.bar, "step-forward", function () {
            alert("step-forward");
        });
        addButton(this.elements.bar, "step-back", function () {
            alert("step-back");
        });
        addButton(this.elements.bar, "step-until-error", function () {
            alert("step-until-error");
        });
        addButton(this.elements.bar, "step-until-draw", function () {
            alert("step-until-draw");
        });
        addButton(this.elements.bar, "restart", function () {
            alert("restart");
        });

        this.update();
    };
    TraceMinibar.prototype.update = function () {
        var self = this;

        function toggleButton(name, enabled) {
            var el = self.buttons[name];
            if (enabled) {
                el.className = el.className.replace("trace-minibar-button-disabled", "trace-minibar-button-enabled");
            } else {
                el.className = el.className.replace("trace-minibar-button-enabled", "trace-minibar-button-disabled");
            }
        };

        for (var n in this.buttons) {
            toggleButton(n, false);
        }

        toggleButton("run", true);
        //toggleButton("step-forward", true);
        //toggleButton("step-back", true);
        //toggleButton("step-until-error", true);
        //toggleButton("step-until-draw", true);
        //toggleButton("restart", true);
    };

    var TraceListing = function (view, w) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            list: w.root.getElementsByClassName("trace-listing")[0]
        };

        this.calls = [];
    };
    TraceListing.prototype.reset = function () {
        this.calls.length = 0;
        this.elements.list.innerHTML = "";
    };
    TraceListing.prototype.addCall = function (call) {
        var self = this;

        // <div class="trace-call">
        //     <div class="trace-call-icon">
        //         &nbsp;
        //     </div>
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        //     <div class="trace-call-timing">
        //         32ms
        //     </div>
        // </div>

        var el = document.createElement("div");
        el.className = "trace-call";

        var icon = document.createElement("div");
        icon.className = "trace-call-icon";
        el.appendChild(icon);

        var line = document.createElement("div");
        line.className = "trace-call-line";
        line.innerHTML = call.info.name;
        el.appendChild(line);

        var timing = document.createElement("div");
        timing.className = "trace-call-timing";
        timing.innerHTML = call.duration + "ms";
        el.appendChild(timing);

        this.elements.list.appendChild(el);

        this.calls.push({
            call: call,
            element: el
        });
    };

    var Inspector = function (view, w) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {};
    };
    Inspector.prototype.reset = function () {
    };

    var TraceView = function (w) {
        var self = this;
        this.window = w;
        this.elements = {};

        this.minibar = new TraceMinibar(this, w);
        this.traceListing = new TraceListing(this, w);
        this.inspector = new Inspector(this, w);

        this.frame = null;
    };
    TraceView.prototype.reset = function () {
        this.minibar.update();
        this.traceListing.reset();
        this.inspector.reset();

        this.frame = null;
    };
    TraceView.prototype.setFrame = function (frame) {
        this.reset();
        this.frame = frame;

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            this.traceListing.addCall(call);
        }
    };

    gli.ui = gli.ui || {};
    gli.ui.TraceView = TraceView;

})();
