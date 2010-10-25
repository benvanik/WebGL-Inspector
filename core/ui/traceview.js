(function () {

    var TraceMinibar = function (view, w) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {};
    };
    TraceMinibar.prototype.reset = function () {
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
        this.minibar.reset();
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
