(function () {
    var ui = glinamespace("gli.ui");

    var TraceTab = function (w) {
        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-inspector window-trace-inspector">' +
        '            <div class="surface-inspector-toolbar">' +
        '                <!-- toolbar -->' +
        '            </div>' +
        '            <div class="surface-inspector-inner">' +
        '                <!-- inspector -->' +
        '            </div>' +
        '            <div class="surface-inspector-statusbar">' +
        '                <canvas class="gli-reset surface-inspector-pixel" width="1" height="1"></canvas>' +
        '                <span class="surface-inspector-location"></span>' +
        '            </div>' +
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
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- toolbar --></div>' +
        '    </div>' +
        '</div>';
        this.el.innerHTML = html;

        this.listing = new gli.ui.LeftListing(w, this.el, "frame", function (el, frame) {
            var canvas = document.createElement("canvas");
            canvas.className = "gli-reset frame-item-preview";
            canvas.style.cursor = "pointer";
            canvas.width = 80;
            canvas.height = frame.screenshot.height / frame.screenshot.width * 80;

            // Draw the data - hacky, but easiest?
            var ctx2d = canvas.getContext("2d");
            ctx2d.drawImage(frame.screenshot, 0, 0, canvas.width, canvas.height);

            el.appendChild(canvas);

            var number = document.createElement("div");
            number.className = "frame-item-number";
            number.innerHTML = frame.frameNumber;
            el.appendChild(number);
        });
        this.traceView = new gli.ui.TraceView(w, this.el);

        this.listing.valueSelected.addListener(this, function (frame) {
            this.traceView.setFrame(frame);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
            scrollStates.traceView = this.traceView.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
            this.traceView.setScrollState(scrollStates.traceView);
        });

        var context = w.context;
        for (var n = 0; n < context.frames.length; n++) {
            var frame = context.frames[n];
            this.listing.appendValue(frame);
        }
        if (context.frames.length > 0) {
            this.listing.selectValue(context.frames[context.frames.length - 1]);
        }

        this.layout = function () {
            this.traceView.layout();
        };
    };

    ui.TraceTab = TraceTab;
})();
