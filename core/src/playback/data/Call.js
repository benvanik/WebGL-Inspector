(function () {
    var data = glinamespace("gli.playback.data");

    var Call = function Call(session, sourceCall) {
        this.ordinal = sourceCall.ordinal;
        this.type = sourceCall.type;
        this.name = sourceCall.name;
        this.duration = sourceCall.duration;
        this.result = sourceCall.result;
        this.error = sourceCall.error;
        this.stack = sourceCall.stack;
        this.time = sourceCall.time;

        this.args = new Array(sourceCall.args.length);
        for (var n = 0; n < sourceCall.args.length; n++) {
            var sarg = sourceCall.args[n];
            var darg = sarg;
            
            if (sarg) {
                darg = gli.playback.data.Converter.typeFromJson(session, sarg);
            }

            this.args[n] = darg;
        }
    };

    data.Call = Call;

})();
