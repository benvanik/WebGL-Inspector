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

            if (texture.status == gli.host.Resource.DEAD) {
                el.className += " texture-item-deleted";
            }

            switch (texture.type) {
                case gl.TEXTURE_2D:
                    el.className += " texture-item-2d";
                    break;
                case gl.TEXTURE_CUBE_MAP:
                    el.className += " texture-item-cube";
                    break;
            }

            var number = document.createElement("div");
            number.className = "texture-item-number";
            number.innerHTML = texture.getName();
            el.appendChild(number);

            var row = document.createElement("div");
            row.className = "texture-item-row";

            function updateSize() {
                switch (texture.type) {
                    case gl.TEXTURE_2D:
                        var guessedSize = texture.guessSize(gl);
                        if (guessedSize) {
                            row.innerHTML = guessedSize[0] + " x " + guessedSize[1];
                        } else {
                            row.innerHTML = "? x ?";
                        }
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        break;
                }
            };
            updateSize();

            if (row.innerHTML != "") {
                el.appendChild(row);
            }

            texture.modified.addListener(this, function (texture) {
                number.innerHTML = texture.getName();
                updateSize();
                // TODO: refresh view if selected
            });
            texture.deleted.addListener(this, function (texture) {
                el.className += " texture-item-deleted";
            });
        });

        this.listing.addButton("Browse All").addListener(this, function () {
            gli.ui.PopupWindow.show(w.context, gli.ui.TexturePicker, "texturePicker", function (popup) {
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

        // Append textures already present
        var context = w.context;
        var textures = context.resources.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            this.listing.appendValue(texture);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLTexture") {
                this.listing.appendValue(resource);
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
