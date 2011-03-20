(function () {
    var resources = glinamespace("gli.playback.resources");

    var Program = function Program(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Program);
    Program.prototype.creationOrder = 5;

    resources.Program = Program;

})();
