(function () {
    var ui = glinamespace("gli.ui");

    var BufferView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };

        this.currentBuffer = null;
    };

    function generateArrayBufferContents(gl, el, buffer) {
        var data = buffer.constructVersion(gl, buffer.currentVersion);

        // TODO: determine structure somehow?

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

    function generateElementArrayBufferContents(gl, el, buffer) {
        var data = buffer.constructVersion(gl, buffer.currentVersion);

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

    function generateBufferDisplay(gl, el, buffer) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = "Buffer " + buffer.id + ((buffer.type == gl.ELEMENT_ARRAY_BUFFER) ? " / ELEMENT_ARRAY_BUFFER" : " / ARRAY_BUFFER");
        el.appendChild(titleDiv);

        gli.ui.appendParameters(gl, el, buffer, ["BUFFER_SIZE", "BUFFER_USAGE"]);
        gli.ui.appendbr(el);

        gli.ui.appendSeparator(el);

        switch (buffer.type) {
            case gl.ARRAY_BUFFER:
                generateArrayBufferContents(gl, el, buffer);
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                generateElementArrayBufferContents(gl, el, buffer);
                break;
        }

        gli.ui.appendbr(el);
    }

    BufferView.prototype.setBuffer = function (buffer) {
        this.elements.view.innerHTML = "";
        if (buffer) {
            generateBufferDisplay(this.window.context, this.elements.view, buffer);
        }

        this.elements.view.scrollTop = 0;
    };

    ui.BufferView = BufferView;
})();
