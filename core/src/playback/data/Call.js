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

    Call.prototype.issue = function issue(pool) {
        var gl = pool.gl;
        var func = gl[this.name];

        var args = new Array(this.args.length);
        for (var n = 0; n < args.length; n++) {
            var sarg = this.args[n];
            var darg = sarg;

            if (sarg) {
                if (sarg instanceof gli.playback.resources.Resource) {
                    darg = pool.getTargetValue(sarg);
                } else if (sarg.uniformReference) {
                    var target = pool.getTargetValue(sarg.program);
                    darg = gl.getUniformLocation(target, sarg.name);
                } else if (sarg.domType) {
                    if (!sarg.value) {
                        console.log("Call issuing with unloaded asset");
                    }
                    darg = sarg.value;
                } else {
                    //console.log(sarg);
                }
            }

            args[n] = darg;
        }

        var result = func.apply(gl, args);

        // TODO: set error from recorded call?

        return result;
    };

    data.Call = Call;

})();
