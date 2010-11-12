(function () {
    var controls = glinamespace("gli.controls");

    var SplitterBar = function (parentElement, direction, minValue, maxValue, customStyle, changeCallback) {
        var self = this;

        var el = this.el = document.createElement("div");
        parentElement.appendChild(el);

        el.className = customStyle || ("splitter-" + direction);

        var lastValue = 0;

        function mouseMove(e) {
            var newValue;

            if (direction == "horizontal") {
                var dy = e.screenY - lastValue;
                lastValue = e.screenY;

                var height = parseInt(parentElement.style.height);
                height -= dy;
                height = Math.max(minValue, height);
                height = Math.min(window.innerHeight - maxValue, height);
                parentElement.style.height = height + "px";
                newValue = height;
            } else {
                var dx = e.screenX - lastValue;
                lastValue = e.screenX;

                var width = parseInt(parentElement.style.width);
                width -= dx;
                width = Math.max(minValue, width);
                width = Math.min(window.innerWidth - maxValue, width);
                parentElement.style.width = width + "px";
                newValue = width;
            }

            if (changeCallback) {
                changeCallback(newValue);
            }

            e.preventDefault();
            e.stopPropagation();
        };

        function mouseUp(e) {
            endResize();
            e.preventDefault();
            e.stopPropagation();
        };

        function beginResize() {
            document.addEventListener("mousemove", mouseMove, true);
            document.addEventListener("mouseup", mouseUp, true);
            if (direction == "horizontal") {
                document.body.style.cursor = "n-resize";
            } else {
                document.body.style.cursor = "e-resize";
            }
        };

        function endResize() {
            document.removeEventListener("mousemove", mouseMove, true);
            document.removeEventListener("mouseup", mouseUp, true);
            document.body.style.cursor = "";
        };

        el.onmousedown = function (e) {
            beginResize();
            if (direction == "horizontal") {
                lastValue = e.screenY;
            } else {
                lastValue = e.screenX;
            }
            e.preventDefault();
            e.stopPropagation();
        };

        // TODO: save splitter value somewhere across sessions?
    };

    controls.SplitterBar = SplitterBar;
})();
