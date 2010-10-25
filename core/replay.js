(function () {

    var Replay = function (context, targetgl) {
        this.context = context;
        this.gl = targetgl;
    };

    Replay.prototype.reset = function () {
    };

    Replay.prototype.runFrame = function (frame) {
        this.beginFrame(frame);
        this.stepUntilEnd();
    };

    Replay.prototype.beginFrame = function (frame) {
    };

    Replay.prototype.step = function () {
    };

    Replay.prototype.stepUntilError = function () {
    };

    Replay.prototype.stepUntilDraw = function () {
    };

    Replay.prototype.stepUntilEnd = function () {
    };

    gli.Replay = Replay;

})();
