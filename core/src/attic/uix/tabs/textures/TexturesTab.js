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
        '    <div class="window-left"></div>' +
        '</div>';
        this.el.innerHTML = html;
        
        this.window = w;

        this.listing = new gli.ui.LeftListing(this.window, this.el, "texture", {
            filterBar: {
                aliveDead: true,
                used: true,
                types: ["2D", "Cube"]
            },
            buttonBar: true
        }, this, this.itemGenerator, this.itemUpdater);
        
        this.listing.valueSelected.addListener(this, function (value) {
            this.textureView.setTexture(value);
        });
        
        this.listing.addButton("Browse All").addListener(this, function () {
            gli.ui.PopupWindow.show(this.window, gli.ui.TexturePicker, "texturePicker", function (popup) {
            });
        });
        
        this.listing.bindToResource("Texture");

        this.textureView = new gli.ui.TextureView(this.window, this.el);

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });
        
        this.layout = function () {
            this.textureView.layout();
        };

        this.refresh = function () {
            this.textureView.setTexture(this.textureView.currentTexture);
        };
    };
    
    TexturesTab.prototype.itemGenerator = function itemGenerator(item, value) {
        var gl = this.window.context;
        var document = this.window.document;

        var name = el.name = document.createElement("div");
        name.className = "texture-item-number";
        name.innerHTML = texture.getName();
        el.appendChild(name);

        var row = el.sizeRow = document.createElement("div");
        row.className = "texture-item-row";
        row.innerHTML = "? x ?";
        el.appendChild(row);
    };
    
    TexturesTab.prototype.itemUpdater = function itemUpdater(item, value) {
        var gl = this.w.context;
        
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
    };

    ui.TexturesTab = TexturesTab;
})();
