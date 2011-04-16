(function () {
    var controls = glinamespace("gli.ui.controls");
    
    var Splitter = function Splitter(parentElement, direction, minValue, maxValue, customStyle, changeCallback) {
        var self = this;
        var doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-splitter");
        gli.ui.addClass(el, "gli-splitter-" + direction);
        if (customStyle) {
            gli.ui.addClass(el, customStyle);
        }
        parentElement.appendChild(el);

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
            doc.addEventListener("mousemove", mouseMove, true);
            doc.addEventListener("mouseup", mouseUp, true);
            if (direction == "horizontal") {
                doc.body.style.cursor = "n-resize !important";
            } else {
                doc.body.style.cursor = "e-resize !important";
            }
        };

        function endResize() {
            doc.removeEventListener("mousemove", mouseMove, true);
            doc.removeEventListener("mouseup", mouseUp, true);
            doc.body.style.cursor = "";
        };

        el.addEventListener("mousedown", function (e) {
            beginResize();
            if (direction == "horizontal") {
                lastValue = e.screenY;
            } else {
                lastValue = e.screenX;
            }
            e.preventDefault();
            e.stopPropagation();
        }, false);
    };
    
    controls.Splitter = Splitter;
})();
