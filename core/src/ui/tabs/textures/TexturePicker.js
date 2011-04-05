(function () {
    var ui = glinamespace("gli.ui");

    var TexturePicker = function (w, name) {
        this.super.call(this, w, name, "Texture Browser", 610, 600);
    };
    glisubclass(gli.ui.PopupWindow, TexturePicker);

    TexturePicker.prototype.setup = function () {
        var self = this;
        var w = this.w;
        var doc = this.browserWindow.document;

        this.previewer = new gli.ui.TexturePreviewGenerator(w.session);
        
        // Append textures already present
        var store = w.session.resourceStore;
        var textures = store.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            var el = this.previewer.buildItem(this, doc, texture, true, true);
            this.elements.innerDiv.appendChild(el);
        }

        // Listen for changes
        // TODO: needs to be object-local to allow for removal
        /*store.resourceAdded.addListener(this, function (resource) {
            if (resource.type === "Texture") {
                this.listing.appendValue(resource);
            }
        });
        store.resourceChanged.addListener(this, function (resource) {
            if (resource.type === "Texture") {
                this.listing.updateValue(resource);
            }
        });*/
    };
    
    TexturePicker.prototype.dispose = function () {
        this.previewer.dispose();
        this.previewer = null;
        //this.context.resources.resourceRegistered.removeListener(this);
    };

    ui.TexturePicker = TexturePicker;
})();
