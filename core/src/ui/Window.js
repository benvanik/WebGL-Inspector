(function () {
    var ui = glinamespace("gli.ui");

    var Window = function Window(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var tabs = [
            {
                name: "trace",
                title: "Trace",
                tip: "View frame call trace",
                type: gli.ui.tabs.trace.TraceTab
            },
            {
                name: "textures",
                title: "Textures",
                tip: "View frame call trace",
                type: gli.ui.tabs.trace.TraceTab
            },
            {
                name: "buffers",
                title: "Buffers",
                tip: "View frame call trace",
                type: gli.ui.tabs.trace.TraceTab
            }
        ];

        this.currentTab = null;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-window");
        parentElement.appendChild(el);

        var topEl = doc.createElement("div");
        gli.ui.addClass(topEl, "gli-window-top");
        el.appendChild(topEl);

        var middleEl = doc.createElement("div");
        gli.ui.addClass(middleEl, "gli-window-middle");
        el.appendChild(middleEl);

        var bottomEl = doc.createElement("div");
        gli.ui.addClass(bottomEl, "gli-window-bottom");
        el.appendChild(bottomEl);

        // Top
        {
            var topBar = this.topBar = doc.createElement("div");
            gli.ui.addClass(topBar, "gli-window-topbar");
            topEl.appendChild(topBar);

            var scrubber = this.scrubber = new gli.ui.Scrubber(topEl);

            var tabBar = this.tabBar = new gli.ui.controls.TabBar(topEl);
            for (var n = 0; n < tabs.length; n++) {
                var tab;
                if (tabs[n].type) {
                    tab = new tabs[n].type(this, middleEl);
                }
                tabBar.addTab(tabs[n].name, tabs[n].title, tabs[n].tip, tab);
            }
            tabBar.tabSelected.addListener(this, function (tabName) {
                var tab = tabBar.getTab(tabName);
                if (this.currentTab === tab) {
                    return;
                }
                if (this.currentTab) {
                    this.currentTab.hide();
                }
                this.currentTab = tab;
                if (tab) {
                    tab.show();
                }
            });
            tabBar.switchTab(tabs[0].name);
        }

        // Middle
        {
        }

        // Bottom
        {
            //var statusBar = this.statusBar = new gli.ui.controls.StatusBar(bottomEl);
        }
    };

    Window.prototype.setup = function setup() {
    };

    Window.prototype.dispose = function dispose() {
    };

    ui.Window = Window;

    ui.createUI = function createUI(context) {
        var host = {
            window: null,
            popup: null
        };

        var spinIntervalId = gli.util.setInterval(function () {
            var ready = false;
            var cssUrl = null;
            if (window.gliloader) {
                cssUrl = gliloader.pathRoot;
            } else {
                cssUrl = window.gliCssUrl;
            }
            ready = cssUrl && cssUrl.length;
            if (ready) {
                // Initialize info and other shared values
                gli.info.initialize();

                // Create popup window
                gli.ui.Popup.show("main", {
                    title: "WebGL Inspector",
                    miniBar: false,
                    statusBar: false
                }, function (popup) {
                    host.popup = popup;
                    host.window = new Window(popup.getRootElement());
                    popup.setup = function () {
                        host.window.setup();
                    };
                    popup.dispose = function () {
                        host.window.dispose();
                    };
                });

                gli.util.clearInterval(spinIntervalId);
            }
        }, 16);

        return host;
    };

})();
