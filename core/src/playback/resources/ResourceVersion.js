(function () {
    var resources = glinamespace("gli.playback.resources");

    var ResourceVersion = function ResourceVersion(session, source) {
        this.versionNumber = source.versionNumber;
        
        this.assets = [];
        
        this.calls = new Array(source.calls.length);
        for (var n = 0; n < source.calls.length; n++) {
            var scall = source.calls[n];
            var dcall = new gli.playback.data.Call(session, scall);
            
            for (var m = 0; m < dcall.args.length; m++) {
                var arg = dcall.args[m];
                if (arg && arg.domType) {
                    this.assets.push(arg);
                }
            }
            
            this.calls[n] = dcall;
        }
    };

    resources.ResourceVersion = ResourceVersion;

})();
