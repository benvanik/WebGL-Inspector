(function () {
    var controls = glinamespace("gli.ui.controls");

    var Splitter = function Splitter(parentElement, orientation, minValue, maxValue, customStyle, changeCallback) {
        var self = this;
        var doc = parentElement.ownerDocument;
        var wnd = doc.defaultView;

        this.changeCallback = changeCallback;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-splitter");
        gli.ui.addClass(el, "gli-splitter-" + orientation);
        if (customStyle) {
            gli.ui.addClass(el, customStyle);
        }

        this.currentValue = 100;
        var lastValue = 0;

        function mouseMove(e) {
            var newValue;

            if (self.orientation == "horizontal") {
                var dy = e.screenY - lastValue;
                lastValue = e.screenY;

                var height = self.currentValue;
                height += dy;
                height = Math.max(minValue, height);
                height = Math.min(Math.max(maxValue, parentElement.offsetHeight - maxValue), height);
                newValue = height;
            } else {
                var dx = e.screenX - lastValue;
                lastValue = e.screenX;

                var width = self.currentValue;
                width += dx;
                width = Math.max(minValue, width);
                width = Math.min(Math.max(maxValue, parentElement.offsetWidth - maxValue), width);
                newValue = width;
            }

            self.currentValue = newValue;
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
            if (self.orientation == "horizontal") {
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
            if (self.orientation == "horizontal") {
                lastValue = e.screenY;
            } else {
                lastValue = e.screenX;
            }
            e.preventDefault();
            e.stopPropagation();
        }, false);
    };

    Splitter.prototype.setValue = function setValue(value) {
        this.currentValue = value;
        if (this.changeCallback) {
            this.changeCallback(value);
        }
    };

    Splitter.prototype.setOrientation = function setOrientation(value) {
        this.orientation = value;

        if (value == "horizontal") {
            gli.ui.changeClass(this.el, "gli-splitter-vertical", "gli-splitter-horizontal");
        } else {
            gli.ui.changeClass(this.el, "gli-splitter-horizontal", "gli-splitter-vertical");
        }
    };

    controls.Splitter = Splitter;
})();
