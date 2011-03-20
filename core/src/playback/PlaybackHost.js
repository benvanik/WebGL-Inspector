(function () {
    var playback = glinamespace("gli.playback");

    var PlaybackHost = function PlaybackHost() {
        this.sessions = [];
    };

    PlaybackHost.prototype.openSession = function openSession(transport) {
        var session = new gli.playback.PlaybackSession(this, transport);
        this.sessions.push(session);

        transport.ready.fireDeferred();
    };

    playback.PlaybackHost = PlaybackHost;

})();
