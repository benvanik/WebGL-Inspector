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

    var TraceView = function (w) {
        var self = this;
        this.window = w;
        this.elements = {};

        this.minibar = new TraceMinibar(this, w);
        this.traceListing = new gli.ui.TraceListing(this, w);
        this.inspector = new gli.ui.TraceInspector(this, w);

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

        this.traceListing.setFrame(frame);
    };

    gli.ui = gli.ui || {};
    gli.ui.TraceView = TraceView;

})();
