(function () {
    var controls = glinamespace("gli.ui.controls");
    
    var MiniBar = function MiniBar(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-minibar");
        parentElement.appendChild(el);
        
        this.segments = {};
    };
    
    MiniBar.prototype.addSegment = function addSegment(name, align) {
        var segment = new MiniBarSegment(this, name, align);
        this.segments[name] = segment;
        
        // TODO: place properly based on alignment
        switch (align) {
        case "left":
            break;
        case "right":
            break;
        }
        this.el.appendChild(segment.el);
        
        return segment;
    };

    MiniBar.prototype.getSegment = function getSegment(name) {
        return this.segments[name];
    };
    
    var MiniBarSegment = function MiniBarSegment(parentMiniBar, name, align) {
        var self = this;
        var parentElement = parentMiniBar.el;
        var doc = parentElement.ownerDocument;
        
        this.name = name;
        this.align = align;
        this.items = {};
        
        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-minibar-segment");
        gli.ui.addClass(el, "gli-minibar-segment-" + align);
    };
    MiniBarSegment.prototype.addItem = function addItem(item) {
        this.items[item.name] = item;
        this.el.appendChild(item.el);
    };
    MiniBarSegment.prototype.addButton = function addButton(name, tip) {
        var button = new MiniBarButton(this, name, tip);
        this.addItem(button);
        return button;
    };
    MiniBarSegment.prototype.addCheckbox = function addCheckbox(name, tip, defaultValue) {
        var checkbox = new MiniBarCheckbox(this, name, tip, defaultValue);
        this.addItem(checkbox);
        return checkbox;
    };
    MiniBarSegment.prototype.getItem = function getItem(name) {
        return this.items[name];
    };
    
    var MiniBarButton = function MiniBarButton(parentSegment, name, tip) {
        var self = this;
        var parentElement = parentSegment.el;
        var doc = parentElement.ownerDocument;
        
        this.name = name;
        this.tip = tip;
        this.enabled_ = false;
        this.clicked = new gli.util.EventSource("clicked");
        
        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-minibar-button");
        gli.ui.addClass(el, "gli-minibar-button-disabled");
        gli.ui.addClass(el, "gli-minibar-button-command-" + name);
        el.title = tip;
        el.innerHTML = " ";
        
        el.addEventListener("click", function (e) {
            if (self.enabled) {
                self.clicked.fire();
            }
            e.preventDefault();
            e.stopPropagation();
        }, false);
    };
    Object.defineProperty(MiniBarButton.prototype, "enabled", {
        get: function getEnabled() { return this.enabled_; },
        set: function setEnabled(value) {
            if (this.enabled_ !== value) {
                if (value) {
                    gli.ui.changeClass(this.el, "gli-minibar-button-disabled", "gli-minibar-button-enabled");
                } else {
                    gli.ui.changeClass(this.el, "gli-minibar-button-enabled", "gli-minibar-button-disabled");
                }
            }
            this.enabled_ = value;
        }
    });
    
    var MiniBarCheckbox = function MiniBarCheckbox(parentSegment, name, tip, defaultValue) {
        var self = this;
        var parentElement = parentSegment.el;
        var doc = parentElement.ownerDocument;
        
        this.name = name;
        this.tip = tip;
        this.enabled_ = false;
        this.clicked = new gli.util.EventSource("clicked");
        
        var inputEl = this.inputEl = doc.createElement("input");
        inputEl.type = "checkbox";
        inputEl.title = tip;
        inputEl.style.width = "inherit";
        inputEl.style.height = "inherit";
        inputEl.checked = defaultValue;
        
        inputEl.addEventListener("change", function () {
            self.clicked.fire(inputEl.checked);
        }, false);
        
        var textEl = this.textEl = doc.createElement("span");
        textEl.innerHTML = "&nbsp;" + name;
        
        textEl.addEventListener("click", function (e) {
            if (self.enabled) {
                inputEl.checked = !inputEl.checked;
                self.clicked.fire(inputEl.checked);
            }
            e.preventDefault();
            e.stopPropagation();
        }, false);
        
        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-minibar-checkbox");
        gli.ui.addClass(el, "gli-minibar-checkbox-disabled");
        el.appendChild(inputEl);
        el.appendChild(textEl);
    };
    Object.defineProperty(MiniBarCheckbox.prototype, "enabled", {
        get: function getEnabled() { return this.enabled_; },
        set: function setEnabled(value) {
            if (this.enabled_ !== value) {
                if (value) {
                    gli.ui.changeClass(this.el, "gli-minibar-checkbox-disabled", "gli-minibar-checkbox-enabled");
                    this.inputEl.disabled = "";
                } else {
                    gli.ui.changeClass(this.el, "gli-minibar-checkbox-enabled", "gli-minibar-checkbox-disabled");
                    this.inputEl.disabled = "disabled";
                }
            }
            this.enabled_ = value;
        }
    });
    Object.defineProperty(MiniBarCheckbox.prototype, "value", {
        get: function getValue() { return this.inputEl.checked; },
        set: function setValue(value) {
            this.inputEl.checked = value;
        }
    });
    
    controls.MiniBar = MiniBar;
    
})();
