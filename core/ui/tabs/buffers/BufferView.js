(function () {
    var ui = glinamespace("gli.ui");

    function shouldShowPreview(gl, buffer, version) {
        return !!buffer && (buffer.type == gl.ARRAY_BUFFER) && !!version.structure && !!version.lastDrawState;
    }

    var BufferView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("buffer-listing")[0]
        };

        this.inspector = new ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'bufferSplitter',
            title: 'Buffer Preview',
            selectionName: null,
            selectionValues: null,
            disableSizing: true
        });
        this.inspector.currentBuffer = null;
        this.inspector.currentVersion = null;
        this.inspector.querySize = function () {
            var gl = this.gl;
            if (!this.currentBuffer || !this.currentVersion) {
                return null;
            }
            return [256, 256]; // ?
        };
        this.inspector.setupPreview = function () {
            if (this.previewer) {
                return;
            }

            this.previewer = new ui.BufferPreview(this.canvas);
            this.gl = this.previewer.gl;

            this.canvas.width = 256;
            this.canvas.height = 256;
        }
        this.inspector.updatePreview = function () {
            var gl = this.gl;

            this.previewer.setBuffer(this.drawState);
        };
        this.inspector.setBuffer = function (buffer, version) {
            var gl = this.gl;

            var showPreview = shouldShowPreview(gl, buffer, version);
            if (showPreview) {
                // Setup UI
                this.canvas.width = 256;
                this.canvas.height = 256;
                this.canvas.style.display = "";
                this.updatePreview();
            } else {
                // Clear everything
                this.canvas.width = 1;
                this.canvas.height = 1;
                this.canvas.style.display = "none";
            }

            if (showPreview) {
                var lastDrawState = version.lastDrawState;

                var elementArrayBufferArray = null;
                if (lastDrawState.elementArrayBuffer) {
                    elementArrayBufferArray = [lastDrawState.elementArrayBuffer, null];
                    // TODO: pick the right version of the ELEMENT_ARRAY_BUFFER
                    elementArrayBufferArray[1] = elementArrayBufferArray[0].currentVersion;
                }

                // TODO: pick the right position attribute
                var positionAttr = version.structure[0];

                var drawState = {
                    mode: lastDrawState.mode,
                    arrayBuffer: [buffer, version],
                    position: positionAttr,
                    elementArrayBuffer: elementArrayBufferArray,
                    elementArrayType: lastDrawState.elementArrayBufferType,
                    first: lastDrawState.first,
                    offset: lastDrawState.offset,
                    count: lastDrawState.count
                };
                this.previewer.setBuffer(drawState);
            }

            if (showPreview) {
                this.options.title = "Buffer Preview: " + buffer.getName();
            } else {
                this.options.title = "Buffer Preview: (none)";
            }

            this.currentBuffer = buffer;
            this.currentVersion = version;
            this.activeOption = 0;
            this.optionsList.selectedIndex = 0;

            this.reset();
            this.layout();
        };

        this.currentBuffer = null;
    };

    BufferView.prototype.setInspectorWidth = function (newWidth) {
        var document = this.window.document;

        //.window-buffer-outer margin-left: -800px !important; /* -2 * window-buffer-inspector.width */
        //.window-buffer margin-left: 400px !important; /* window-buffer-inspector.width */
        //.buffer-listing right: 400px; /* window-buffer-inspector */
        document.getElementsByClassName("window-buffer-outer")[0].style.marginLeft = (-2 * newWidth) + "px !important";
        document.getElementsByClassName("window-buffer-inspector")[0].style.width = newWidth + "px";
        document.getElementsByClassName("buffer-listing")[0].style.right = newWidth + "px !important";
    };

    BufferView.prototype.layout = function () {
        this.inspector.layout();
    };

    function appendHistoryLine(gl, el, buffer, call) {
        gli.ui.appendHistoryLine(gl, el, call);

        // TODO: other custom stuff?
    }

    function generateBufferHistory(gl, el, buffer, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "History";
        el.appendChild(titleDiv);

        var rootEl = document.createElement("div");
        rootEl.className = "buffer-history";
        el.appendChild(rootEl);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];
            appendHistoryLine(gl, rootEl, buffer, call);
        }
    };

    function generateGenericArrayBufferContents(gl, el, buffer, version) {
        var data = buffer.constructVersion(gl, version);

        var table = document.createElement("table");
        table.className = "buffer-data";
        for (var n = 0; n < data.length; n++) {
            var tr = document.createElement("tr");
            var tdkey = document.createElement("td");
            tdkey.className = "buffer-data-key";
            tdkey.innerHTML = n;
            tr.appendChild(tdkey);
            var tdvalue = document.createElement("td");
            tdvalue.className = "buffer-data-value";
            tdvalue.innerHTML = data[n];
            tr.appendChild(tdvalue);
            table.appendChild(tr);
        }
        el.appendChild(table);
    };

    function generateArrayBufferContents(gl, el, buffer, version) {
        if (!version.structure) {
            generateGenericArrayBufferContents(gl, el, buffer, version);
            return;
        }

        var data = buffer.constructVersion(gl, version);
        var datas = version.structure;
        var stride = datas[0].stride;
        if (stride == 0) {
            // Calculate stride from last byte
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                switch (datas[m].type) {
                    case gl.BYTE:
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        break;
                    case gl.SHORT:
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        break;
                }
                stride = Math.max(stride, datas[m].offset + byteAdvance);
            }
        }

        var table = document.createElement("table");
        table.className = "buffer-data";
        var byteOffset = 0;
        var itemOffset = 0;
        while (byteOffset < data.byteLength) {
            var tr = document.createElement("tr");

            var tdkey = document.createElement("td");
            tdkey.className = "buffer-data-key";
            tdkey.innerHTML = itemOffset;
            tr.appendChild(tdkey);

            var innerOffset = byteOffset;
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                var readView = null;
                switch (datas[m].type) {
                    case gl.BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Int8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Uint8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Int16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Uint16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        readView = new Float32Array(data.buffer, innerOffset, datas[m].size);
                        break;
                }
                innerOffset += byteAdvance;

                for (var i = 0; i < datas[m].size; i++) {
                    var td = document.createElement("td");
                    td.className = "buffer-data-value";
                    if ((m != datas.length - 1) && (i == datas[m].size - 1)) {
                        td.className += " buffer-data-value-end";
                    }
                    td.innerHTML = readView[i];
                    tr.appendChild(td);
                }
            }

            byteOffset += stride;
            itemOffset++;
            table.appendChild(tr);
        }
        el.appendChild(table);
    };

    function generateBufferDisplay(gl, el, buffer, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = buffer.getName();
        switch (buffer.type) {
            case gl.ARRAY_BUFFER:
                titleDiv.innerHTML += " / ARRAY_BUFFER";
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                titleDiv.innerHTML += " / ELEMENT_ARRAY_BUFFER";
                break;
        }
        el.appendChild(titleDiv);

        gli.ui.appendParameters(gl, el, buffer, ["BUFFER_SIZE", "BUFFER_USAGE"], [null, ["STREAM_DRAW", "STATIC_DRAW", "DYNAMIC_DRAW"]]);
        gli.ui.appendbr(el);

        var showPreview = shouldShowPreview(gl, buffer, version);
        if (showPreview) {
            gli.ui.appendSeparator(el);

            var previewDiv = document.createElement("div");
            previewDiv.className = "info-title-secondary";
            previewDiv.innerHTML = "Preview";
            el.appendChild(previewDiv);

            var previewContainer = document.createElement("div");
            previewContainer.className = "buffer-preview-container";

            // TODO: tools for choosing preview options
            var previewOptions = document.createElement("div");
            // things that modify drawState and call previewWidget.draw()
            previewContainer.appendChild(previewOptions);

            el.appendChild(previewContainer);
            gli.ui.appendbr(el);

            gli.ui.appendSeparator(el);
        }

        if (version.structure) {
            // TODO: some kind of fancy structure editor/overload?
            var datas = version.structure;

            var structDiv = document.createElement("div");
            structDiv.className = "info-title-secondary";
            structDiv.innerHTML = "Structure (from last draw)";
            el.appendChild(structDiv);

            var table = document.createElement("table");
            table.className = "buffer-struct";

            var tr = document.createElement("tr");
            var td = document.createElement("th");
            td.innerHTML = "offset";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "size";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "type";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "stride";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "normalized";
            tr.appendChild(td);
            table.appendChild(tr);

            for (var n = 0; n < datas.length; n++) {
                var data = datas[n];

                var tr = document.createElement("tr");

                td = document.createElement("td");
                td.innerHTML = data.offset;
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = data.size;
                tr.appendChild(td);
                td = document.createElement("td");
                switch (data.type) {
                    case gl.BYTE:
                        td.innerHTML = "BYTE";
                        break;
                    case gl.UNSIGNED_BYTE:
                        td.innerHTML = "UNSIGNED_BYTE";
                        break;
                    case gl.SHORT:
                        td.innerHTML = "SHORT";
                        break;
                    case gl.UNSIGNED_SHORT:
                        td.innerHTML = "UNSIGNED_SHORT";
                        break;
                    default:
                    case gl.FLOAT:
                        td.innerHTML = "FLOAT";
                        break;
                }
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = data.stride;
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = data.normalized;
                tr.appendChild(td);

                table.appendChild(tr);
            }

            el.appendChild(table);
            gli.ui.appendbr(el);
        }

        gli.ui.appendSeparator(el);

        generateBufferHistory(gl, el, buffer, version);
        gli.ui.appendbr(el);

        var frame = gl.ui.controller.currentFrame;
        if (frame) {
            gli.ui.appendSeparator(el);
            gli.ui.generateUsageList(gl, el, frame, buffer);
            gli.ui.appendbr(el);
        }

        gli.ui.appendSeparator(el);

        var contentsDiv = document.createElement("div");
        contentsDiv.className = "info-title-secondary";
        contentsDiv.innerHTML = "Contents";
        el.appendChild(contentsDiv);

        var contentsContainer = document.createElement("div");

        function populateContents() {
            contentsContainer.innerHTML = "";
            var frag = document.createDocumentFragment();
            switch (buffer.type) {
                case gl.ARRAY_BUFFER:
                    generateArrayBufferContents(gl, frag, buffer, version);
                    break;
                case gl.ELEMENT_ARRAY_BUFFER:
                    generateGenericArrayBufferContents(gl, frag, buffer, version);
                    break;
            }
            contentsContainer.appendChild(frag);
        };

        if (buffer.parameters[gl.BUFFER_SIZE] > 40000) {
            // Buffer is really big - delay populating
            var expandLink = document.createElement("a");
            expandLink.className = "buffer-data-collapsed";
            expandLink.innerHTML = "Show buffer contents";
            expandLink.onclick = function () {
                populateContents();
            };
            contentsContainer.appendChild(expandLink);
        } else {
            // Auto-expand
            populateContents();
        }

        el.appendChild(contentsContainer);

        gli.ui.appendbr(el);
    }

    BufferView.prototype.setBuffer = function (buffer) {
        this.currentBuffer = buffer;

        this.elements.listing.innerHTML = "";
        if (buffer) {
            var version;
            switch (this.window.activeVersion) {
                case null:
                    version = buffer.currentVersion;
                    break;
                case "current":
                    var frame = this.window.controller.currentFrame;
                    if (frame) {
                        version = frame.findResourceVersion(buffer);
                    }
                    version = version || buffer.currentVersion; // Fallback to live
                    break;
            }

            this.inspector.setBuffer(buffer, version);

            generateBufferDisplay(this.window.context, this.elements.listing, buffer, version);
        } else {
            this.inspector.setBuffer(null, null);
        }

        this.elements.listing.scrollTop = 0;
    };

    ui.BufferView = BufferView;
})();
