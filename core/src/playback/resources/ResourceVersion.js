(function () {
    var resources = glinamespace("gli.playback.resources");

    var ResourceVersion = function ResourceVersion(session, source) {
        this.versionNumber = source.versionNumber;

        this.calls = new Array(source.calls.length);
        for (var n = 0; n < source.calls.length; n++) {
            var scall = source.calls[n];
            this.calls[n] = new gli.playback.data.Call(session, scall);
        }
    };

    resources.ResourceVersion = ResourceVersion;

})();
