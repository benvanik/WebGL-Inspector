(function () {
    var ui = glinamespace("gli.ui");

    var Window = function Window(parentElement, context) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        this.context = context;
        this.host = new gli.playback.PlaybackHost(doc);
        this.transport = new gli.playback.transports.LocalTransport(context.impl.session.transport);
        var session = this.session = this.host.openSession(this.transport);

        this.session.addTool(new gli.playback.tools.RedundancyChecker(this.session));

        var controller = this.controller = new gli.ui.ContextController(this, session);

        this.currentFrame = null;

        var tabs = this.tabs = [
            {
                name: "trace",
                title: "Trace",
                tip: "View frame call trace",
                type: gli.ui.tabs.trace.TraceTab
            },
            {
                name: "info",
                title: "Info",
                tip: "View frame overview",
                type: null
            },
            {
                name: "textures",
                title: "Textures",
                tip: "View texture resources",
                type: null
            },
            {
                name: "buffers",
                title: "Buffers",
                tip: "View buffer resources",
                type: null
            },
            {
                name: "programs",
                title: "Programs",
                tip: "View program and shader resources",
                type: null
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
            {
                var label = doc.createElement("span");
                label.innerHTML = "Frame: ";
                topBar.appendChild(label);

                var dropdown = this.frameDropdown = doc.createElement("select");
                topBar.appendChild(dropdown);
                dropdown.addEventListener("change", function () {
                    var frameNumber = parseInt(dropdown.options[dropdown.selectedIndex].value);
                    var captureFrames = session.storage.captureFrames;
                    for (var n = 0; n < captureFrames.length; n++) {
                        var frame = captureFrames[n];
                        if (frame.frameNumber === frameNumber) {
                            self.setFrame(frame);
                            break;
                        }
                    }
                }, false);
            }

            var scrubber = this.scrubber = new gli.ui.Scrubber(topEl, controller);

            var tabBar = this.tabBar = new gli.ui.controls.TabBar(topEl);
            for (var n = 0; n < tabs.length; n++) {
                var tab = null;
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

        session.captureFrameAdded.addListener(this, this.addFrame);
        var captureFrames = session.storage.captureFrames;
        for (var n = 0; n < captureFrames.length; n++) {
            var frame = captureFrames[n];
            this.addFrame(frame, true);
        }
        if (captureFrames.length) {
            this.setFrame(captureFrames[captureFrames.length - 1]);
        }
    };

    Window.prototype.setup = function setup() {
    };

    Window.prototype.dispose = function dispose() {
        this.setFrame(null);
    };

    Window.prototype.addFrame = function addFrame(frame, dontSwitch) {
        var self = this;
        var doc = this.doc;

        // Prepare frame
        // TODO: more?
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var info = gli.info.functions[call.name];
            call.info = info;
        }

        var option = doc.createElement("option");
        gli.ui.addClass(option, "gli-topbar-frame");
        option.value = frame.frameNumber;
        option.innerHTML = "Frame " + frame.frameNumber;

        // TODO: make this pretty - need to use a custom dropdown
        /*
        var previewEl = doc.createElement("canvas");
        previewEl.width = "64";
        previewEl.height = "64";
        var ctx = previewEl.getContext("2d");
        if (frame.screenshot) {
        ctx.drawImage(frame.screenshot, 0, 0, previewEl.width, previewEl.height);
        } else {
        }
        option.appendChild(previewEl);

        var labelEl = doc.createElement("span");
        labelEl.innerHTML = "Frame " + frame.frameNumber;
        option.appendChild(labelEl);

        var timeEl = doc.createElement("span");
        timeEl.innerHTML = "XX:XX:XX";
        option.appendChild(timeEl);

        var br = doc.createElement("br");
        option.appendChild(br);

        var statsEl = doc.createElement("span");
        statsEl.innerHTML = "NN calls";
        option.appendChild(statsEl);
        */

        this.frameDropdown.appendChild(option);

        if (!dontSwitch) {
            this.setFrame(frame);
        }
    };

    Window.prototype.setFrame = function setFrame(frame) {
        if (frame == this.currentFrame) {
            return;
        }
        if (this.currentFrame) {
            // TODO: cleanup?
            this.currentFrame = null;
        }

        if (frame) {
            for (var n = 0; n < this.frameDropdown.options.length; n++) {
                var option = this.frameDropdown.options[n];
                if (parseInt(option.value) === frame.frameNumber) {
                    this.frameDropdown.selectedIndex = n;
                    break;
                }
            }
        }

        this.currentFrame = frame;

        this.tabBar.clearHistory();
        this.tabBar.switchTab("trace");

        this.controller.setFrame(frame);
    };

    ui.Window = Window;

    var interactiveDepth_ = 0;
    var oldTimerControl_;
    ui.interactiveModeStarted = new gli.util.EventSource("interactiveModeStarted");
    ui.interactiveModeEnded = new gli.util.EventSource("interactiveModeEnded");
    ui.isInteractive = function isInteractive() {
        return interactiveDepth_ != 0;
    };
    ui.beginInteractive = function beginInteractive() {
        if (interactiveDepth_ == 0) {
            oldTimerControl_ = gli.util.getTimerControlValue();
            gli.util.setTimerControlValue(Infinity);
            gli.ui.interactiveModeStarted.fire();
        }
        interactiveDepth_++;
    };
    ui.endInteractive = function endInteractive() {
        interactiveDepth_--;
        if (interactiveDepth_ == 0) {
            gli.util.setTimerControlValue(oldTimerControl_);
            gli.ui.interactiveModeEnded.fire();
        }
    };

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
                    title: "WebGL Inspector - " + window.document.baseURI,
                    miniBar: false,
                    statusBar: false
                }, function (popup) {
                    host.popup = popup;
                    host.window = new Window(popup.getRootElement(), context);
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
