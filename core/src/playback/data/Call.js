(function () {
    var data = glinamespace("gli.playback.data");

    // Call(call)
    // Call(session, sourceCall)
    var Call = function Call() {
        if (arguments.length === 1) {
            // Call(call)
            var sourceCall = arguments[0];
            gli.util.deepCloneInto(this, sourceCall, function (value) {
                if ((value instanceof gli.playback.resources.Resource) ||
                    (value instanceof HTMLCanvasElement) ||
                    (value instanceof HTMLImageElement) ||
                    (value instanceof HTMLVideoElement)) {
                    return true;
                }
                var type = glitypename(value);
                if ((type == "ImageData") ||
                    (type == "function")) {
                    return true;
                }
                return false;
            });
        } else {
            // Call(session, sourceCall)
            var session = arguments[0];
            var sourceCall = arguments[1];
            this.ordinal = sourceCall.i;
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
        }
    };

    Call.prototype.clone = function clone() {
        var call = new Call(this);
        return call;
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

    Call.issueCall = function issueCall(pool, call) {
        var gl = pool.gl;
        var wildcardBindings = pool.mutationTable.calls[null];
        var callBindings = pool.mutationTable.calls[call.name];

        if (wildcardBindings) {
            for (var n = 0; n < wildcardBindings.pre.length; n++) {
                var binding = wildcardBindings.pre[n];
                call = binding.handler.call(binding.mutator, gl, pool, call);
                if (!call) {
                    return;
                }
            }
        }
        if (callBindings) {
            for (var n = 0; n < callBindings.pre.length; n++) {
                var binding = callBindings.pre[n];
                call = binding.handler.call(binding.mutator, gl, pool, call);
                if (!call) {
                    return;
                }
            }
        }

        call.issue(pool);

        if (callBindings) {
            for (var n = 0; n < callBindings.post.length; n++) {
                var binding = callBindings.post[n];
                binding.handler.call(binding.mutator, gl, pool, call);
            }
        }
        if (wildcardBindings) {
            for (var n = 0; n < wildcardBindings.post.length; n++) {
                var binding = wildcardBindings.post[n];
                binding.handler.call(binding.mutator, gl, pool, call);
            }
        }
    };

    Call.prototype.transformArgs = function transformArgs(pool) {
        var gl = pool.gl;

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
                                var selfUri = parseUri(window.location.href);
                                var remoteUri = parseUri(sarg.src);
                                if ((selfUri.protocol !== "file") && (remoteUri.protocol !== "file") &&
                                    (selfUri.protocol === remoteUri.protocol) &&
                                    (selfUri.authority === remoteUri.authority)) {
                                    // Same - allow
                                } else {
                                    // Mismatch - ignore content
                                    console.log("ignoring cross-domain content: " + sarg.src);
                                    darg = null;
                                }
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
        return args;
    };

    Call.prototype.issue = function issue(pool) {
        var gl = pool.gl;
        var func = gl[this.name];

        var args = this.transformArgs(pool);

        //console.log(this.name);

        var result = func.apply(gl, args);

        //var error = gli.playback.checkErrors(gl, "call[" + this.name + "]");

        // TODO: set error from recorded call?

        return result;
    };

    data.Call = Call;

})();
