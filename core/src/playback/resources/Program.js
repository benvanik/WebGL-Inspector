(function () {
    var resources = glinamespace("gli.playback.resources");

    var Program = function Program(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
    };
    Program.prototype.creationOrder = 5;

    resources.Program = Program;

})();
