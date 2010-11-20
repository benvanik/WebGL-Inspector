(function () {
    var ui = glinamespace("gli.ui");

    // options: {
    //     title: 'Texture'
    //     selectionName: 'Face' / etc
    //     selectionValues: ['sel 1', 'sel 2', ...]
    // }

    var SurfaceInspector = function (view, w, elementRoot, options) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {
            toolbar: elementRoot.getElementsByClassName("surface-inspector-toolbar")[0],
            view: elementRoot.getElementsByClassName("surface-inspector-inner")[0]
        };
        this.options = options;

        var defaultWidth = 240;
        this.elements.view.style.width = defaultWidth + "px";
        this.splitter = new gli.controls.SplitterBar(this.elements.view, "vertical", 240, 800, "splitter-inspector", function (newWidth) {
            view.setInspectorWidth(newWidth);
            self.layout();
        });
        view.setInspectorWidth(defaultWidth);

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
        var selectionValues = options.selectionValues;
        if (selectionValues) {
            for (var n = 0; n < selectionValues.length; n++) {
                var selectionOption = document.createElement("option");
                selectionOption.innerHTML = selectionValues[n];
                optionsList.appendChild(selectionOption);
            }
        }
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

        // Display canvas
        var canvas = this.canvas = document.createElement("canvas");
        canvas.className = "gli-reset surface-inspector-canvas";
        canvas.style.display = "none";
        canvas.width = 1;
        canvas.height = 1;
        this.elements.view.appendChild(canvas);

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
    };

    SurfaceInspector.prototype.updatePreview = function () {
    };

    SurfaceInspector.prototype.layout = function () {
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
                this.canvas.style.width = width + "px";
                this.canvas.style.height = height + "px";

                this.canvas.style.left = ((parentWidth / 2) - (width / 2)) + "px";
                this.canvas.style.top = ((parentHeight / 2) - (height / 2)) + "px";

                // HACK: force another layout because we may have changed scrollbar status
                if (this.resizeHACK) {
                    this.resizeHACK = false;
                } else {
                    this.resizeHACK = true;
                    this.layout();
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
