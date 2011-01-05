(function () {
    var ui = glinamespace("gli.ui");

    // options: {
    //     splitterKey: 'traceSplitter' / etc
    //     title: 'Texture'
    //     selectionName: 'Face' / etc
    //     selectionValues: ['sel 1', 'sel 2', ...]
    //     disableSizing: true/false
    //     transparentCanvas: false
    // }

    var SurfaceInspector = function (view, w, elementRoot, options) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {
            toolbar: elementRoot.getElementsByClassName("surface-inspector-toolbar")[0],
            statusbar: elementRoot.getElementsByClassName("surface-inspector-statusbar")[0],
            view: elementRoot.getElementsByClassName("surface-inspector-inner")[0]
        };
        this.options = options;

        var defaultWidth = 240;
        var width = gli.settings.session[options.splitterKey];
        if (width) {
            width = Math.max(240, Math.min(width, window.innerWidth - 400));
        } else {
            width = defaultWidth;
        }
        this.elements.view.style.width = width + "px";
        this.splitter = new gli.controls.SplitterBar(this.elements.view, "vertical", 240, 800, "splitter-inspector", function (newWidth) {
            view.setInspectorWidth(newWidth);
            self.layout();

            if (self.elements.statusbar) {
                self.elements.statusbar.style.width = newWidth + "px";
            }

            gli.settings.session[options.splitterKey] = newWidth;
            gli.settings.save();
        });
        view.setInspectorWidth(width);

        // Add view options
        var optionsDiv = document.createElement("div");
        optionsDiv.className = "surface-inspector-options";
        optionsDiv.style.display = "none";
        var optionsSpan = document.createElement("span");
        optionsSpan.innerHTML = options.selectionName + ": ";
        optionsDiv.appendChild(optionsSpan);
        var optionsList = document.createElement("select");
        optionsList.className = "";
        optionsDiv.appendChild(optionsList);
        this.setSelectionValues = function (selectionValues) {
            optionsList.innerHTML = "";
            if (selectionValues) {
                for (var n = 0; n < selectionValues.length; n++) {
                    var selectionOption = document.createElement("option");
                    selectionOption.innerHTML = selectionValues[n];
                    optionsList.appendChild(selectionOption);
                }
            }
        };
        this.setSelectionValues(options.selectionValues);
        this.elements.toolbar.appendChild(optionsDiv);
        this.elements.faces = optionsDiv;
        this.optionsList = optionsList;
        optionsList.onchange = function () {
            if (self.activeOption != optionsList.selectedIndex) {
                self.activeOption = optionsList.selectedIndex;
                self.updatePreview();
            }
        };

        // Add sizing options
        var sizingDiv = document.createElement("div");
        sizingDiv.className = "surface-inspector-sizing";
        if (this.options.disableSizing) {
            sizingDiv.style.display = "none";
        }
        var nativeSize = document.createElement("span");
        nativeSize.title = "Native resolution (100%)";
        nativeSize.innerHTML = "100%";
        nativeSize.onclick = function () {
            self.sizingMode = "native";
            self.layout();
        };
        sizingDiv.appendChild(nativeSize);
        var sepSize = document.createElement("div");
        sepSize.className = "surface-inspector-sizing-sep";
        sepSize.innerHTML = " | ";
        sizingDiv.appendChild(sepSize);
        var fitSize = document.createElement("span");
        fitSize.title = "Fit to inspector window";
        fitSize.innerHTML = "Fit";
        fitSize.onclick = function () {
            self.sizingMode = "fit";
            self.layout();
        };
        sizingDiv.appendChild(fitSize);
        this.elements.toolbar.appendChild(sizingDiv);
        this.elements.sizingDiv = sizingDiv;

        // Statusbar (may not be present)
        var updatePixelPreview = null;
        var pixelDisplayMode = "location";
        if (this.elements.statusbar) {
            var statusbar = this.elements.statusbar;
            var pixelCanvas = statusbar.getElementsByClassName("surface-inspector-pixel")[0];
            var locationSpan = statusbar.getElementsByClassName("surface-inspector-location")[0];
            var lastX = 0;
            var lastY = 0;
            updatePixelPreview = function (x, y) {
                pixelCanvas.style.display = "none";

                if ((x === null) || (y === null)) {
                    locationSpan.innerHTML = "";
                    return;
                }

                lastX = x;
                lastY = y;

                // Draw preview in the pixel canvas
                pixelCanvas.style.display = "";
                var pctx = pixelCanvas.getContext("2d");
                pctx.clearRect(0, 0, 1, 1);
                pctx.drawImage(self.canvas, x, y, 1, 1, 0, 0, 1, 1);

                switch (pixelDisplayMode) {
                    case "location":
                        var width = self.canvas.width;
                        var height = self.canvas.height;
                        var tx = String(Math.round(x / width * 1000) / 1000);
                        var ty = String(Math.round(y / height * 1000) / 1000);
                        if (tx.length == 1) {
                            tx += ".000";
                        }
                        while (tx.length < 5) {
                            tx += "0";
                        }
                        if (ty.length == 1) {
                            ty += ".000";
                        }
                        while (ty.length < 5) {
                            ty += "0";
                        }
                        locationSpan.innerHTML = x + ", " + y + " (" + tx + ", " + ty + ")";
                        break;
                    case "color":
                        var imageData = pctx.getImageData(0, 0, 1, 1);
                        if (imageData) {
                            var r = imageData.data[0];
                            var g = imageData.data[1];
                            var b = imageData.data[2];
                            var a = imageData.data[3];
                            locationSpan.innerHTML = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
                        } else {
                            locationSpan.innerHTML = "(unable to read)";
                        }
                        break;
                }
            };
            statusbar.style.width = width + "px";
            statusbar.addEventListener("click", function () {
                if (pixelDisplayMode == "location") {
                    pixelDisplayMode = "color";
                } else {
                    pixelDisplayMode = "location";
                }
                updatePixelPreview(lastX, lastY);
            }, false);

            this.clearPixel = function () {
                updatePixelPreview(null, null);
            };
        } else {
            this.clearPixel = function () { };
        }

        // Display canvas
        var canvas = this.canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        if (options.transparentCanvas) {
            canvas.className += " surface-inspector-canvas-transparent";
        } else {
            canvas.className += " surface-inspector-canvas";
        }
        canvas.style.display = "none";
        canvas.width = 1;
        canvas.height = 1;
        this.elements.view.appendChild(canvas);

        if (updatePixelPreview) {
            canvas.addEventListener("mousemove", function (e) {
                var x = e.offsetX;
                var y = e.offsetY;
                switch (self.sizingMode) {
                    case "fit":
                        var scale = parseFloat(self.canvas.style.width) / self.canvas.width;
                        x /= scale;
                        y /= scale;
                        break;
                    case "native":
                        break;
                }
                updatePixelPreview(Math.floor(x), Math.floor(y));
            }, false);
        }

        this.sizingMode = "fit";
        this.resizeHACK = false;
        this.elements.view.style.overflow = "";

        this.activeOption = 0;

        setTimeout(function () {
            self.setupPreview();
            self.layout();
        }, 0);
    };

    SurfaceInspector.prototype.setupPreview = function () {
        this.activeOption = 0;
    };

    SurfaceInspector.prototype.updatePreview = function () {
    };

    SurfaceInspector.prototype.layout = function () {
        this.clearPixel();

        var size = this.querySize();
        if (!size) {
            return;
        }

        switch (this.sizingMode) {
            case "native":
                this.elements.view.style.overflow = "auto";
                this.canvas.style.left = "";
                this.canvas.style.top = "";
                this.canvas.style.width = "";
                this.canvas.style.height = "";
                break;
            case "fit":
                this.elements.view.style.overflow = "";

                var parentWidth = this.elements.view.clientWidth;
                var parentHeight = this.elements.view.clientHeight;
                var parentar = parentHeight / parentWidth;
                var ar = size[1] / size[0];

                var width;
                var height;
                if (ar * parentWidth < parentHeight) {
                    width = parentWidth;
                    height = (ar * parentWidth);
                } else {
                    height = parentHeight;
                    width = (parentHeight / ar);
                }
                if (width && height) {
                    this.canvas.style.width = width + "px";
                    this.canvas.style.height = height + "px";
                }

                this.canvas.style.left = ((parentWidth / 2) - (width / 2)) + "px";
                this.canvas.style.top = ((parentHeight / 2) - (height / 2)) + "px";

                // HACK: force another layout because we may have changed scrollbar status
                if (this.resizeHACK) {
                    this.resizeHACK = false;
                } else {
                    this.resizeHACK = true;
                    var self = this;
                    setTimeout(function () {
                        self.layout();
                    }, 0);
                }
                break;
        }
    };

    SurfaceInspector.prototype.reset = function () {
        this.elements.view.scrollLeft = 0;
        this.elements.view.scrollTop = 0;
    };

    ui.SurfaceInspector = SurfaceInspector;
})();
