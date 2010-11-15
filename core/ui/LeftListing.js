(function () {
    var ui = glinamespace("gli.ui");

    var LeftListing = function (w, elementRoot, cssBase, itemGenerator) {
        var self = this;
        this.window = w;
        this.elements = {
            list: elementRoot.getElementsByClassName("window-left-listing")[0]
        };

        this.cssBase = cssBase;
        this.itemGenerator = itemGenerator;

        this.valueEntries = [];

        this.previousSelection = null;

        this.valueSelected = new gli.EventSource("valueSelected");
    };

    LeftListing.prototype.appendValue = function (value) {
        var self = this;
        var document = this.window.document;

        // <div class="XXXX-item">
        //     ??
        // </div>

        var el = document.createElement("div");
        el.className = this.cssBase + "-item listing-item";

        this.itemGenerator(el, value);

        this.elements.list.appendChild(el);

        el.onclick = function () {
            self.selectValue(value);
        };

        this.valueEntries.push({
            value: value,
            element: el
        });
        value.uielement = el;
    };

    LeftListing.prototype.resort = function () {
        // TODO: restort
    };

    LeftListing.prototype.removeValue = function (value) {
    };

    LeftListing.prototype.selectValue = function (value) {
        if (this.previousSelection) {
            var el = this.previousSelection.element;
            el.className = el.className.replace(" " + this.cssBase + "-item-selected listing-item-selected", "");
            this.previousSelection = null;
        }

        var valueObj = null;
        for (var n = 0; n < this.valueEntries.length; n++) {
            if (this.valueEntries[n].value == value) {
                valueObj = this.valueEntries[n];
                break;
            }
        }
        this.previousSelection = valueObj;
        if (valueObj) {
            valueObj.element.className += " " + this.cssBase + "-item-selected listing-item-selected";
        }

        if (value) {
            scrollIntoViewIfNeeded(value.uielement);
        }

        this.valueSelected.fire(value);
    };
    
    LeftListing.prototype.getScrollState = function () {
        return {
            list: this.elements.list.scrollTop
        };
    };
    
    LeftListing.prototype.setScrollState = function (state) {
        if (!state) {
            return;
        }
        this.elements.list.scrollTop = state.list;
    };

    ui.LeftListing = LeftListing;
})();
