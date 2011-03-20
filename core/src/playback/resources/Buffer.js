(function () {
    var resources = glinamespace("gli.playback.resources");

    var Buffer = function Buffer(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
        this.creationOrder = 0;
    };

    resources.Buffer = Buffer;

})();
