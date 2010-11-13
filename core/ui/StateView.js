(function () {
    var ui = glinamespace("gli.ui");

    var StateView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-whole-inner")[0]
        };
    };

    function generateStateDisplay(gl, el, state) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = "State Snapshot";
        el.appendChild(titleDiv);
    };

    StateView.prototype.setState = function (state) {
        this.elements.view.innerHTML = "";
        if (state) {
            generateStateDisplay(this.window.context, this.elements.view, state);
        }

        this.elements.view.scrollTop = 0;
    };

    ui.StateView = StateView;
})();
