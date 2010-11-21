(function(){
    var ui = glinamespace("gli.ui");
    
    var TexturePicker = function (context) {
        var self = this;
        this.context = context;
        
        var w = this.browserWindow = window.open("", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=600,innerHeight=600");
        w.document.writeln("<html><head><title>Texture Browser</title></head><body style='margin: 0px; padding: 0px;'></body></html>");

        w.addEventListener("unload", function () {
            self.browserWindow.closed = true;
            self.browserWindow = null;
            context.ui.texturePicker = null;
        }, false);
        
        w.gli = window.gli;
        
        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        }
        
        setTimeout(function () {
            self.previewer = new gli.ui.TexturePreviewGenerator();
            self.setup();
        }, 0);
    };
    
    TexturePicker.prototype.setup = function () {
        var self = this;
        var context = this.context;
        
        // Build UI
        var body = this.browserWindow.document.body;
        
        var toolbarDiv = document.createElement("div");
        toolbarDiv.className = "texture-picker-toolbar";
        body.appendChild(toolbarDiv);
        
        var pickerDiv = document.createElement("div");
        pickerDiv.className = "texture-picker-inner";
        body.appendChild(pickerDiv);
        
        function addTexture (texture) {
            var el = document.createElement("div");
            el.className = "texture-picker-item";
            if (texture.status == gli.host.Resource.DEAD) {
                el.className += " texture-picker-item-deleted";
            }
            pickerDiv.appendChild(el);
            
            var preview = null;
            if (texture.cachedPreview) {
                // Preview exists - use it
                preview = texture.cachedPreview;
            } else {
                // Preview does not exist - create it
                // TODO: pick the right version
                var version = texture.currentVersion;
                var targetFace;
                switch (texture.type) {
                    case gl.TEXTURE_2D:
                        targetFace = null;
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X; // pick a different face?
                        break;
                }
                var desiredWidth = 128;
                var desiredHeight = 128;
                self.previewer.draw(texture, version, targetFace, desiredWidth, desiredHeight);
                preview = self.previewer.capture();
                texture.cachedPreview = preview;
            }
            if (preview) {
                // TODO: setup
                preview.className = "";
                if (preview.parentNode) {
                    preview.parentNode.removeChild(preview);
                }
                el.appendChild(preview);
            }
            
            var iconDiv = document.createElement("div");
            iconDiv.className = "texture-picker-item-icon";
            switch (texture.type) {
                case gl.TEXTURE_2D:
                    iconDiv.className += " texture-picker-item-icon-2d";
                    break;
                case gl.TEXTURE_CUBE_MAP:
                    iconDiv.className += " texture-picker-item-icon-cube";
                    break;
            }
            el.appendChild(iconDiv);
            
            var titleDiv = document.createElement("div");
            titleDiv.className = "texture-picker-item-title";
            titleDiv.innerHTML = texture.getName();
            el.appendChild(titleDiv);
            
            el.onclick = function (e) {
                self.context.ui.showTexture(texture);
                self.close(); // TODO: do this?
                e.preventDefault();
                e.stopPropagation();
            };
            
            texture.modified.addListener(this, function (texture) {
                //updateSize();
                // TODO: rerender texture preview on modification
                console.log("would rerender texture");
            });
            texture.deleted.addListener(this, function (texture) {
                el.className += " texture-picker-item-deleted";
            });
        };
        
        // Append textures already present
        var textures = context.resources.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            addTexture(texture);
        }
        
        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLTexture") {
                addTexture(resource);
            }
        });
    };
    
    TexturePicker.prototype.focus = function () {
        this.browserWindow.focus();
    };
    TexturePicker.prototype.close = function () {
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        this.context.ui.texturePicker = null;
    };
    TexturePicker.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };
    
    ui.TexturePicker = TexturePicker;
})();
