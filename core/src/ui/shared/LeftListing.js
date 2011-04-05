(function () {
    var ui = glinamespace("gli.ui");
    
    var LeftListing = function LeftListing(w, elementRoot, cssBase, options, target, itemGenerator, itemUpdater) {
        var self = this;
        this.window = w;
        this.elements = {
            root: elementRoot.getElementsByClassName("window-left")[0],
            filterBar: null,
            list: null,
            buttonBar: null
        };
        this.options = {
            filterBar: options.filterBar || null,
            buttonBar: options.buttonBar || false
        };
        
        var html =
        '<div class="window-left-filterbar">' +
        '   <!-- filter controls --></div>' +
        '<div class="window-left-listing">' +
        '   <!-- item list -->' +
        '</div>' +
        '<div class="window-left-buttonBar">' +
        '   <!-- buttons --></div>';
        this.elements.root.innerHTML = html;
        this.elements.filterBar = elementRoot.getElementsByClassName("window-left-filterbar")[0];
        this.elements.list = elementRoot.getElementsByClassName("window-left-listing")[0];
        this.elements.buttonBar = elementRoot.getElementsByClassName("window-left-buttonbar")[0];
        
        this.buttonBarHeight = this.elements.buttonBar.style.height;
        if (this.options.buttonBar) {
            this.elements.buttonBar.style.display = "";
            this.elements.buttonBar.style.height = this.buttonBarHeight;
            this.elements.list.style.bottom = this.buttonBarHeight;
        } else {
            this.elements.buttonBar.style.display = "none";
            this.elements.buttonBar.style.height = "0px";
            this.elements.list.style.bottom = "0px";
        }

        this.cssBase = cssBase;
        this.target = target;
        this.itemGenerator = itemGenerator;
        this.itemUpdater = itemUpdater;
        
        this.boundResource = null;

        this.items = [];

        this.previousSelection = null;

        this.valueSelected = new gli.util.EventSource("valueSelected");
    };
    
    LeftListing.prototype.addButton = function addButton(name) {
        var event = new gli.util.EventSource("buttonClicked");
        
        var buttonEl = document.createElement("div");
        buttonEl.className = "mini-button";
        
        var leftEl = document.createElement("div");
        leftEl.className = "mini-button-left";
        buttonEl.appendChild(leftEl);
        
        var spanEl = document.createElement("div");
        spanEl.className = "mini-button-span";
        spanEl.innerHTML = name;
        buttonEl.appendChild(spanEl);
        
        var rightEl = document.createElement("div");
        rightEl.className = "mini-button-right";
        buttonEl.appendChild(rightEl);
        
        this.elements.buttonBar.appendChild(buttonEl);
        
        buttonEl.onclick = function (e) {
            event.fire();
            e.preventDefault();
            e.stopPropagation();
        };
        
        return event;
    };
    
    LeftListing.prototype.bindToResource = function bindToResource(type) {
        var store = this.window.session.resourceStore;
        
        // Append resources already present
        var values = store.getResourcesByType(type);
        for (var n = 0; n < values.length; n++) {
            this.appendValue(values[n]);
        }
        
        // Listen for changes
        store.resourceAdded.addListener(this, function (resource) {
            if (resource.type === type) {
                this.appendValue(resource);
            }
        });
        store.resourceChanged.addListener(this, function (resource) {
            if (resource.type === type) {
                this.updateValue(resource);
            }
        });
    };

    LeftListing.prototype.appendValue = function appendValue(value) {
        var self = this;
        var document = this.window.document;

        // <div class="XXXX-item">
        //     ??
        // </div>
        
        var el = document.createElement("div");
        el.className = this.cssBase + "-item listing-item";
        
        var item = {
            el: el,
            value: value
        };

        this.itemGenerator.call(this.target, item, value);
        if (this.itemUpdater) {
            this.itemUpdater.call(this.target, item, value);
        }

        this.elements.list.appendChild(el);

        el.onclick = function () {
            self.selectValue(value);
        };

        this.items.push(item);
        
        var ui = value.ui;
        if (!ui) {
            ui = value.ui = {};
        }
        ui.listItem = item;
    };
    
    LeftListing.prototype.updateValue = function updateValue(value) {
        var item = value.ui.listItem;
        
        if (this.itemUpdater) {
            this.itemUpdater.call(this.target, item, value);
        }
    };

    LeftListing.prototype.removeValue = function removeValue(value) {
    };
    
    LeftListing.prototype.resort = function resort() {
        // TODO: restort
    };

    LeftListing.prototype.selectValue = function selectValue(value) {
        if (this.previousSelection) {
            var el = this.previousSelection.el;
            el.className = el.className.replace(" " + this.cssBase + "-item-selected listing-item-selected", "");
            this.previousSelection = null;
        }
        if (!value) {
            return;
        }
        
        var item = value.ui.listItem;
        this.previousSelection = item;
        item.el.className += " " + this.cssBase + "-item-selected listing-item-selected";

        gli.util.scrollIntoViewIfNeeded(item.el);

        this.valueSelected.fire(value);
    };
    
    LeftListing.prototype.getScrollState = function getScrollState() {
        return {
            list: this.elements.list.scrollTop
        };
    };
    
    LeftListing.prototype.setScrollState = function setScrollState(state) {
        if (!state) {
            return;
        }
        this.elements.list.scrollTop = state.list;
    };

    ui.LeftListing = LeftListing;
})();
