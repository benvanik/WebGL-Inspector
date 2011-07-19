(function () {
    var ui = glinamespace("gli.ui");

    var BuffersTab = function (w) {
        this.el.innerHTML =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-inspector window-buffer-inspector">' +
        '            <div class="surface-inspector-toolbar">' +
        '                <!-- toolbar -->' +
        '            </div>' +
        '            <div class="surface-inspector-inner">' +
        '                <!-- inspector -->' +
        '            </div>' +
        '            <div class="surface-inspector-statusbar">' +
        '            </div>' +
        '        </div>' +
        '        <div class="window-buffer-outer">' +
        '            <div class="buffer-listing">' +
        '                <!-- scrolling contents -->' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- buttons --></div>' +
        '    </div>' +
        '</div>';

        this.listing = new gli.ui.LeftListing(w, this.el, "buffer", function (el, buffer) {
            var gl = w.context;

            if (buffer.status == gli.host.Resource.DEAD) {
                el.className += " buffer-item-deleted";
            }

            switch (buffer.type) {
                case gl.ARRAY_BUFFER:
                    el.className += " buffer-item-array";
                    break;
                case gl.ELEMENT_ARRAY_BUFFER:
                    el.className += " buffer-item-element-array";
                    break;
            }

            var number = document.createElement("div");
            number.className = "buffer-item-number";
            number.innerHTML = buffer.getName();
            el.appendChild(number);

            buffer.modified.addListener(this, function (buffer) {
                // TODO: refresh view if selected
                //console.log("refresh buffer row");

                // Type may have changed - update it
                el.className = el.className.replace(" buffer-item-array", "").replace(" buffer-item-element-array", "");
                switch (buffer.type) {
                    case gl.ARRAY_BUFFER:
                        el.className += " buffer-item-array";
                        break;
                    case gl.ELEMENT_ARRAY_BUFFER:
                        el.className += " buffer-item-element-array";
                        break;
                }
            });
            buffer.deleted.addListener(this, function (buffer) {
                el.className += " buffer-item-deleted";
            });
        });
        this.bufferView = new gli.ui.BufferView(w, this.el);

        this.listing.valueSelected.addListener(this, function (buffer) {
            this.bufferView.setBuffer(buffer);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });

        // Append buffers already present
        var context = w.context;
        var buffers = context.resources.getBuffers();
        for (var n = 0; n < buffers.length; n++) {
            var buffer = buffers[n];
            this.listing.appendValue(buffer);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLBuffer") {
                this.listing.appendValue(resource);
            }
        });

        // When we lose focus, reselect the buffer - shouldn't mess with things too much, and also keeps the DOM small if the user had expanded things
        this.lostFocus.addListener(this, function () {
            if (this.listing.previousSelection) {
                this.listing.selectValue(this.listing.previousSelection.value);
            }
        });

        this.layout = function () {
            this.bufferView.layout();
        };

        this.refresh = function () {
            this.bufferView.setBuffer(this.bufferView.currentBuffer);
        };
    };

    ui.BuffersTab = BuffersTab;
})();
