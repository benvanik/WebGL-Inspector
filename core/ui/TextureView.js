(function () {
    var ui = glinamespace("gli.ui");

    var TextureView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };

        this.currentTexture = null;
    };

    TextureView.prototype.setTexture = function (texture) {
        console.log("would show texture " + texture.id);
    };

    ui.TextureView = TextureView;
})();
