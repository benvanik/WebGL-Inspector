(function () {
    var ui = glinamespace("gli.ui");
    
    var TextureInspector = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            toolbar: elementRoot.getElementsByClassName("texture-toolbar")[0],
            view: elementRoot.getElementsByClassName("texture-inspector")[0]
        };
        
        // Add toolbar widgets
        var faceDiv = document.createElement("div");
        faceDiv.className = "texture-faces";
        faceDiv.style.display = "none";
        var faceSpan = document.createElement("span");
        faceSpan.innerHTML = "Face: ";
        faceDiv.appendChild(faceSpan);
        var faceList = document.createElement("select");
        faceList.className = "";
        faceDiv.appendChild(faceList);
        var faceNames = ["POSITIVE_X", "NEGATIVE_X", "POSITIVE_Y", "NEGATIVE_Y", "POSITIVE_Z", "NEGATIVE_Z"];
        for (var n = 0; n < faceNames.length; n++) {
            var faceOption = document.createElement("option");
            faceOption.innerHTML = faceNames[n];
            faceList.appendChild(faceOption);
        }
        this.elements.toolbar.appendChild(faceDiv);
        this.elements.faces = faceDiv;
        
        var sizingDiv = document.createElement("div");
        sizingDiv.className = "texture-sizing";
        var nativeSize = document.createElement("span");
        nativeSize.title = "Native resolution (100%)";
        nativeSize.innerHTML = "100%";
        nativeSize.onclick = function () {
            self.sizingMode = "native";
            self.layout();
        };
        sizingDiv.appendChild(nativeSize);
        var sepSize = document.createElement("div");
        sepSize.className = "texture-sizing-sep";
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
        
        var canvas = this.canvas = document.createElement("canvas");
        canvas.className = "gli-reset texture-inspector-canvas";
        canvas.style.display = "none";
        canvas.width = 1;
        canvas.height = 1;
        this.elements.view.appendChild(canvas);
        
        this.sizingMode = "fit";
        this.resizeHACK = false;
        
        this.currentTexture = null;
        this.currentVersion = null;
        
        this.layout();
    };
    TextureInspector.prototype.layout = function () {
        if (!this.currentTexture) {
            return;
        }
        
        var gl = this.window.context;
        var size = this.currentTexture.guessSize(gl);
        switch (this.sizingMode) {
            case "native":
                this.elements.view.scrollTop = 0;
                this.elements.view.scrollLeft = 0;
                this.canvas.style.left = "";
                this.canvas.style.top = "";
                this.canvas.style.width = "";
                this.canvas.style.height = "";
                break;
            case "fit":
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
    TextureInspector.prototype.setTexture = function (texture, version) {
        var gl = this.window.context;
        
        this.currentTexture = texture;
        this.currentVersion = version;
        
        if (texture) {
            // Setup UI
            switch (texture.type) {
                case gl.TEXTURE_2D:
                    this.elements.faces.style.display = "none";
                    break;
                case gl.TEXTURE_CUBE_MAP:
                    this.elements.faces.style.display = "";
                    break;
            }
            var size = this.currentTexture.guessSize(gl);
            this.canvas.width = size[0];
            this.canvas.height = size[1];
            this.canvas.style.display = "";
        } else {
            // Clear everything
            this.elements.faces.style.display = "none";
            this.canvas.width = 1;
            this.canvas.height = 1;
            this.canvas.style.display = "none";
        }
        
        this.layout();
    };

    var TextureView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("texture-listing")[0]
        };
        
        this.inspector = new TextureInspector(w, elementRoot);

        this.currentTexture = null;
    };
    TextureView.prototype.layout = function () {
        this.inspector.layout();
    };
    
    function generateTextureDisplay(gl, el, texture) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = texture.getName();
        el.appendChild(titleDiv);

        var repeatEnums = ["REPEAT", "CLAMP_TO_EDGE", "MIRROR_REPEAT"];
        var filterEnums = ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR"];
        gli.ui.appendParameters(gl, el, texture, ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER"], [repeatEnums, repeatEnums, filterEnums, filterEnums]);
        gli.ui.appendbr(el);
        
        gli.ui.appendSeparator(el);
        
        var historyDiv = document.createElement("div");
        historyDiv.className = "info-title-secondary";
        historyDiv.innerHTML = "History";
        el.appendChild(historyDiv);
        
        var dummy = document.createElement("div");
        dummy.innerHTML = "upload history will go here<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>...and probably be long";
        el.appendChild(dummy);
    };

    TextureView.prototype.setTexture = function (texture) {
        this.elements.listing.innerHTML = "";
        if (texture) {
            generateTextureDisplay(this.window.context, this.elements.listing, texture);
        }
        
        this.inspector.setTexture(texture);
        
        this.elements.listing.scrollTop = 0;
    };

    ui.TextureView = TextureView;
})();
