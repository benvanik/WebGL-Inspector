(function () {
    var resources = glinamespace("gli.playback.resources");

    var Program = function Program(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Program);
    Program.prototype.creationOrder = 5;

    Program.prototype.createTarget = function createTarget(version, options) {
        //
        return null;
    };

    Program.prototype.deleteTarget = function deleteTarget(value) {
        //
    };

    resources.Program = Program;

})();
