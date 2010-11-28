(function () {
    var ui = glinamespace("gli.ui");

    var TraceListing = function (view, w, elementRoot) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            list: elementRoot.getElementsByClassName("trace-listing")[0]
        };

        this.calls = [];

        this.activeCall = null;
    };

    TraceListing.prototype.reset = function () {
        this.activeCall = null;
        this.calls.length = 0;
        this.elements.list.innerHTML = "";
    };

    function addCall(listing, frame, call) {
        var document = listing.window.document;

        // <div class="trace-call">
        //     <div class="trace-call-icon">
        //         &nbsp;
        //     </div>
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        //     <div class="trace-call-actions">
        //         ??
        //     </div>
        // </div>

        var el = document.createElement("div");
        el.className = "trace-call";

        var icon = document.createElement("div");
        icon.className = "trace-call-icon";
        el.appendChild(icon);

        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(listing.window, call, line);
        el.appendChild(line);

        var info = gli.info.functions[call.name];
        if (info.type == gli.FunctionType.DRAW) {
            var actions = document.createElement("div");
            actions.className = "trace-call-actions";

            var isolateAction = document.createElement("div");
            isolateAction.className = "trace-call-action trace-call-action-isolate";
            isolateAction.title = "Run draw call isolated";
            actions.appendChild(isolateAction);
            isolateAction.onclick = function (e) {
                listing.window.controller.runIsolatedDraw(frame, call);
                listing.view.minibar.refreshState(true);
                e.preventDefault();
                e.stopPropagation();
            };

            el.appendChild(actions);
        }

        listing.elements.list.appendChild(el);

        var index = listing.calls.length;
        el.onclick = function () {
            listing.view.minibar.stepUntil(index);
        };

        listing.calls.push({
            call: call,
            element: el,
            icon: icon
        });
    };

    TraceListing.prototype.setFrame = function (frame) {
        this.reset();

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            addCall(this, frame, call);
        }

        this.elements.list.scrollTop = 0;
    };

    TraceListing.prototype.setActiveCall = function (callIndex, ignoreScroll) {
        if (this.activeCall == callIndex) {
            return;
        }

        if (this.activeCall != null) {
            // Clean up previous changes
            var oldel = this.calls[this.activeCall].element;
            oldel.className = oldel.className.replace("trace-call-highlighted", "");
            var oldicon = this.calls[this.activeCall].icon;
            oldicon.className = oldicon.className.replace("trace-call-icon-active", "");
        }

        this.activeCall = callIndex;

        if (callIndex === null) {
            if (!ignoreScroll) {
                this.scrollToCall(0);
            }
        } else {
            var el = this.calls[callIndex].element;
            el.className += " trace-call-highlighted";
            var icon = this.calls[callIndex].icon;
            icon.className += " trace-call-icon-active";

            if (!ignoreScroll) {
                this.scrollToCall(callIndex);
            }
        }
    };

    TraceListing.prototype.scrollToCall = function (callIndex) {
        var el = this.calls[callIndex].icon;
        scrollIntoViewIfNeeded(el);
    };

    TraceListing.prototype.getScrollState = function () {
        return {
            list: this.elements.list.scrollTop
        };
    };

    TraceListing.prototype.setScrollState = function (state) {
        this.elements.list.scrollTop = state.list;
    };

    ui.TraceListing = TraceListing;

})();
