(function () {
    var ui = glinamespace("gli.ui");

    var BufferView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };

        this.currentBuffer = null;
    };

    BufferView.prototype.setBuffer = function (buffer) {
        console.log("would show buffer " + buffer.id);
    };

    ui.BufferView = BufferView;
})();
