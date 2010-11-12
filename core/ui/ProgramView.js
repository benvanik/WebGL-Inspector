(function () {
    var ui = glinamespace("gli.ui");

    var ProgramView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };

        this.currentProgram = null;
    };

    ProgramView.prototype.setProgram = function (program) {
        console.log("would show program " + program.id);
    };

    ui.ProgramView = ProgramView;
})();
