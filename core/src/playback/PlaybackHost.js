(function () {
    var playback = glinamespace("gli.playback");

    var PlaybackHost = function PlaybackHost() {
        this.sessions = [];

        this.sessionAdded = new gli.util.EventSource("sessionAdded");
        this.sessionUpdated = new gli.util.EventSource("sessionUpdated");
        this.sessionRemoved = new gli.util.EventSource("sessionRemoved");
    };

    PlaybackHost.prototype.openSession = function openSession(transport) {
        var session = new gli.playback.PlaybackSession(this, transport);
        this.sessions.push(session);

        this.sessionAdded.fire(session);

        transport.ready.fireDeferred();
    };

    PlaybackHost.prototype.closeSession = function closeSession(session) {
        this.sessions.remove(session);

        this.sessionRemoved.fire(session);
    };

    playback.PlaybackHost = PlaybackHost;

})();
