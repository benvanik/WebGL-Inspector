(function () {
    var ui = glinamespace("gli.ui");

    var TextureView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("texture-listing")[0],
            inspector: elementRoot.getElementsByClassName("texture-inspector")[0]
        };

        this.currentTexture = null;
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
        dummy.innerHTML = "some stuff goes here<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>ffoo";
        el.appendChild(dummy);
    };

    TextureView.prototype.setTexture = function (texture) {
        this.elements.listing.innerHTML = "";
        if (texture) {
            generateTextureDisplay(this.window.context, this.elements.listing, texture);
        }
        
        this.elements.listing.scrollTop = 0;
    };

    ui.TextureView = TextureView;
})();
