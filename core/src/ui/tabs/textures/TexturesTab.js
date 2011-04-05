(function () {
    var ui = glinamespace("gli.ui");

    var TexturesTab = function (w) {
        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-inspector window-texture-inspector">' +
        '            <div class="surface-inspector-toolbar">' +
        '                <!-- toolbar -->' +
        '            </div>' +
        '            <div class="surface-inspector-inner">' +
        '                <!-- inspector -->' +
        '            </div>' +
        '            <div class="surface-inspector-statusbar">' +
        '                <canvas class="gli-reset surface-inspector-pixel" width="1" height="1"></canvas>' +
        '                <span class="surface-inspector-location"></span>' +
        '            </div>' +
        '        </div>' +
        '        <div class="window-texture-outer">' +
        '            <div class="texture-listing">' +
        '                <!-- call trace -->' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- buttons --></div>' +
        '    </div>' +
        '</div>';
        this.el.innerHTML = html;

        this.listing = new gli.ui.LeftListing(w, this.el, "texture", function (el, texture) {
            var gl = w.context;

            var name = el.name = document.createElement("div");
            name.className = "texture-item-number";
            name.innerHTML = texture.getName();
            el.appendChild(name);

            var row = el.sizeRow = document.createElement("div");
            row.className = "texture-item-row";
            row.innerHTML = "? x ?";
            el.appendChild(row);
        }, function (el, texture) {
            var gl = w.context;
            
            if (!texture.alive && (el.className.indexOf("texture-item-deleted") == -1)) {
                el.className += " texture-item-deleted";
            }
            
            el.name = texture.getName();
            
            var version = texture.getLatestVersion();
            if (version) {
                var target = texture.determineTarget(version);
                
                el.className = el.className.replace(" texture-item-2d", "").replace(" texture-item-cube", "");
                switch (target) {
                    case gl.TEXTURE_2D:
                        el.className += " texture-item-2d";
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        el.className += " texture-item-cube";
                        break;
                }
                
                switch (target) {
                    case gl.TEXTURE_2D:
                        var guessedSize = texture.determineSize(version);
                        if (guessedSize) {
                            el.sizeRow.innerHTML = guessedSize[0] + " x " + guessedSize[1];
                        } else {
                            el.sizeRow.innerHTML = "? x ?";
                        }
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        el.sizeRow.innerHTML = "? x ?";
                        break;
                }
            }
        });

        this.listing.addButton("Browse All").addListener(this, function () {
            gli.ui.PopupWindow.show(w, gli.ui.TexturePicker, "texturePicker", function (popup) {
            });
        });

        this.textureView = new gli.ui.TextureView(w, this.el);

        this.listing.valueSelected.addListener(this, function (texture) {
            this.textureView.setTexture(texture);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });
        
        // Append programs already present
        var store = w.session.resourceStore;
        var textures = store.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            this.listing.appendValue(texture);
        }
        
        // Listen for changes
        store.resourceAdded.addListener(this, function (resource) {
            if (resource.type === "Texture") {
                this.listing.appendValue(resource);
            }
        });
        store.resourceChanged.addListener(this, function (resource) {
            if (resource.type === "Texture") {
                this.listing.updateValue(resource);
                if (this.textureView.currentTexture == resource) {
                    this.textureView.setTexture(resource);
                }
            }
        });

        this.layout = function () {
            this.textureView.layout();
        };

        this.refresh = function () {
            this.textureView.setTexture(this.textureView.currentTexture);
        };
    };

    ui.TexturesTab = TexturesTab;
})();
