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
                if (sarg.gliType) {
                    // Self resource of some kind
                    var resource = null;//resourceCache.getResourceById(sarg.id);
                    switch (sarg.gliType) {
                        case "UniformLocation":
                            darg = {
                                uniformReference: true,
                                program: resource,
                                name: sarg.name
                            };
                            break;
                        case "Buffer":
                        case "Framebuffer":
                        case "Program":
                        case "Renderbuffer":
                        case "Shader":
                        case "Texture":
                            darg = resource;
                            break;
                        default:
                            console.log("unknown gliType on Call arg decode: " + sarg.gliType);
                            break;
                    }
                } else if (sarg.arrayType) {
                    // TypedArray
                    switch (sarg.arrayType) {
                        case "Int8Array":
                            darg = new Int8Array(sarg.data);
                            break;
                        case "Uint8Array":
                            darg = new Uint8Array(sarg.data);
                            break;
                        case "Int16Array":
                            darg = new Int16Array(sarg.data);
                            break;
                        case "Uint16Array":
                            darg = new Uint16Array(sarg.data);
                            break;
                        case "Int32Array":
                            darg = new Int32Array(sarg.data);
                            break;
                        case "Uint32Array":
                            darg = new Uint32Array(sarg.data);
                            break;
                        case "Float32Array":
                            darg = new Float32Array(sarg.data);
                            break;
                        case "Float64Array":
                            darg = new Float64Array(sarg.data);
                            break;
                        default:
                            console.log("unknown arrayType on Call arg decode: " + sarg.arrayType);
                            break;
                    }
                } else if (sarg.domType) {
                    // DOM resource of some kind
                    console.log("NOT YET IMPLEMENTED");
                    switch (sarg.domType) {
                        case "ImageData":
                            // width, height, data
                            break;
                        case "HTMLCanvasElement":
                            // width, height, data
                            break;
                        case "HTMLImageElement":
                            // width, height, src
                            break;
                        case "HTMLVideoElement":
                            // width, height, src
                            break;
                        default:
                            console.log("unknown domType on Call arg decode: " + sarg.domType);
                            break;
                    }
                }
            }

            this.args[n] = darg;
        }
    };

    data.Call = Call;

})();
