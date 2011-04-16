(function () {
    var controls = glinamespace("gli.ui.controls");

    var TabBar = function TabBar(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        this.items = {};
        this.currentItem = null;
        this.history = [];
        this.historyIndex = -1;

        this.navigated = new gli.util.EventSource("navigated");
        this.tabSelected = new gli.util.EventSource("tabSelected");

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-tabbar");
        parentElement.appendChild(el);

        var backButton = this.backButton = new TabBarButton(this, "back", "<", "Navigate back", null);
        this.el.appendChild(backButton.el);
        backButton.clicked.addListener(this, function () {
            this.navigate(-1);
        });
        var forwardButton = this.forwardButton = new TabBarButton(this, "forward", ">", "Navigate forward", null);
        this.el.appendChild(forwardButton.el);
        forwardButton.clicked.addListener(this, function () {
            this.navigate(1);
        });

        this.switchTab(null);
    };

    TabBar.prototype.navigate = function navigate(direction) {
        var index = this.historyIndex + direction;
        if ((index < 0) || (index >= this.history.length)) {
            return;
        }
        this.historyIndex = index;
        this.switchTab(this.history[index], true);
    };

    TabBar.prototype.addTab = function addTab(name, title, tip, value) {
        var button = new TabBarButton(this, name, title, tip, value);
        this.items[name] = button;
        this.el.appendChild(button.el);

        button.clicked.addListener(this, function () {
            this.switchTab(name);
        });

        return button;
    };

    TabBar.prototype.getTab = function getTab(name) {
        return this.items[name].value;
    };

    TabBar.prototype.clearHistory = function clearHistory() {
        this.history.length = 0;
        if (this.currentItem) {
            this.history.push(this.currentItem.name);
            this.historyIndex = 0;
        } else {
            this.historyIndex = -1;
        }
    };

    TabBar.prototype.switchTab = function switchTab(name, ignoreHistory) {
        var item = this.items[name];
        if (this.currentItem === item) {
            return;
        }

        if (this.currentItem) {
            this.currentItem.selected = false;
            this.currentItem = null;
        }

        if (item) {
            this.currentItem = item;
            this.currentItem.selected = true;
            if (!ignoreHistory) {
                if (this.historyIndex != this.history.length - 1) {
                    this.history.splice(this.historyIndex + 1);
                }
                this.history.push(name);
                this.historyIndex = this.history.length - 1;
            }
        }

        this.forwardButton.enabled = this.history.length && (this.historyIndex + 1 < this.history.length);
        this.backButton.enabled = this.history.length && (this.historyIndex > 0);

        this.tabSelected.fire(name);
    };

    var TabBarButton = function TabButton(parentBar, name, title, tip, value) {
        var self = this;
        var parentElement = parentBar.el;
        var doc = parentElement.ownerDocument;

        this.name = name;
        this.title = title;
        this.tip = tip;
        this.value = value;
        this.enabled_ = true;
        this.selected_ = false;
        this.clicked = new gli.util.EventSource("clicked");

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-tabbar-button");
        gli.ui.addClass(el, "gli-tabbar-button-enabled");
        gli.ui.addClass(el, "gli-tabbar-button-deselected");
        gli.ui.addClass(el, "gli-tabbar-command-" + name);
        el.title = tip;
        el.innerHTML = title;

        var leftEl = doc.createElement("div");
        gli.ui.addClass(leftEl, "gli-tabbar-button-left");
        leftEl.innerHTML = " ";
        el.appendChild(leftEl);

        el.addEventListener("mousedown", function (e) {
            if (!self.enabled) {
                return;
            }
            gli.ui.changeClass(el, "gli-tabbar-button-deselected", "gli-tabbar-button-selected");
        }, false);
        el.addEventListener("mouseup", function (e) {
            if (!self.enabled) {
                return;
            }
            if (!self.selected) {
                gli.ui.changeClass(el, "gli-tabbar-button-selected", "gli-tabbar-button-deselected");
            }
        }, false);
        el.addEventListener("mouseout", function (e) {
            if (!self.enabled) {
                return;
            }
            if (!self.selected) {
                gli.ui.changeClass(el, "gli-tabbar-button-selected", "gli-tabbar-button-deselected");
            }
        }, false);

        el.addEventListener("click", function (e) {
            if (self.enabled) {
                self.clicked.fire();
            }
            e.preventDefault();
            e.stopPropagation();
        }, false);
    };
    Object.defineProperty(TabBarButton.prototype, "enabled", {
        get: function getEnabled() { return this.enabled_; },
        set: function setEnabled(value) {
            if (this.enabled_ !== value) {
                if (value) {
                    gli.ui.changeClass(this.el, "gli-tabbar-button-disabled", "gli-tabbar-button-enabled");
                } else {
                    gli.ui.changeClass(this.el, "gli-tabbar-button-enabled", "gli-tabbar-button-disabled");
                }
            }
            this.enabled_ = value;
        }
    });
    Object.defineProperty(TabBarButton.prototype, "selected", {
        get: function getSelected() { return this.selected_; },
        set: function setSelected(value) {
            if (this.selected_ !== value) {
                if (value) {
                    gli.ui.changeClass(this.el, "gli-tabbar-button-deselected", "gli-tabbar-button-selected");
                } else {
                    gli.ui.changeClass(this.el, "gli-tabbar-button-selected", "gli-tabbar-button-deselected");
                }
            }
            this.selected_ = value;
        }
    });

    controls.TabBar = TabBar;

})();
