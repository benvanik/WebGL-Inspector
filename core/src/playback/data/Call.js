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
    
    var dummyCache = {};
    function createDummyTexture(width, height) {
        var key = String(width) + "x" + String(height);
        var canvas;
        if (!dummyCache[key]) {
            canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            //ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgb(255, 0, 0)";
            var size = 15;
            for (var y = 0, yi = 0; y < height; y += size, yi = (yi + 1) % 2) {
                for (var x = 0, xi = yi; x < width; x += size, xi = (xi + 1) % 2) {
                    if (xi) {
                        ctx.fillRect(x, y, size, size);
                    }
                }
            }
            dummyCache[key] = canvas;
        } else {
            canvas = dummyCache[key];
        }
        return canvas;
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
                    darg = sarg.value;
                    if (!sarg.value) {
                        console.log("Call issuing with unloaded asset");
                    }
                    if (pool.options.ignoreCrossDomainContent) {
                        switch (sarg.domType) {
                            case "HTMLImageElement":
                            case "HTMLVideoElement":
                                // TODO: try to ignore content on another domain
                                console.log("TODO: deserializeImage should check domain");
                                darg = null;
                                break;
                        }
                    }
                    if (!darg) {
                        // Substitute for dummy texture
                        darg = createDummyTexture(sarg.width, sarg.height);
                    }
                } else {
                    //console.log(sarg);
                }
            }

            args[n] = darg;
        }
        
        console.log(this.name);

        var result = func.apply(gl, args);
        
        var error = gl.getError();
        if (error) {
            console.log("error: " + error);
        }

        // TODO: set error from recorded call?

        return result;
    };

    data.Call = Call;

})();
