(function () {
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

    function generateValueDisplay(call, el, ui, value) {
        var vel = document.createElement("span");

        vel.innerHTML = value;

        el.appendChild(vel);
    }

    function populateCallLine(call, el) {
        var functionSpan = document.createElement("span");
        functionSpan.innerHTML = call.info.name;
        el.appendChild(functionSpan);

        el.appendChild(document.createTextNode("("));

        if (call.info.args.length) {
            for (var n = 0; n < call.info.args.length; n++) {
                var argInfo = call.info.args[n];
                var argValue = call.args[n];
                if (n != 0) {
                    el.appendChild(document.createTextNode(", "));
                }
                generateValueDisplay(call, el, argInfo.ui, argValue);
            }
        } else {
            // Special argument formatter
            generateValueDisplay(call, el, call.info.args, call.args);
        }

        el.appendChild(document.createTextNode(")"));

        // TODO: return type must be set in info.js
        //if (call.info.returnType) {
        if (call.result) {
            el.appendChild(document.createTextNode(" = "));
            //generateValueDisplay(call, el, call.info.returnType, call.result);
            el.appendChild(document.createTextNode(call.result)); // TODO: pretty
        }
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
        populateCallLine(call, line);
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

    gli.ui = gli.ui || {};
    gli.ui.TraceListing = TraceListing;

})();
