(function () {
    var data = glinamespace("gli.capture.data");
    
    var Call = function Call(ordinal, type, name, rawArgs) {
        this.ordinal = ordinal;
        this.type = type;
        this.name = name;

        // Clone args
        var args = [];
        for (var n = 0; n < rawArgs.length; n++) {
            var sarg = rawArgs[n];
            var darg = sarg;
            if (sarg) {
                if (sarg.sourceUniformName) {
                    // Uniform location
                    darg = sarg;
                } else if (gli.util.isWebGLResource(sarg)) {
                    // WebGL resource reference
                    darg = sarg;
                } else {
                    // Generic arg
                    darg = gli.util.clone(sarg);
                }
            }
            args[n] = darg;
        }
        this.args = args;
        
        // Set on completion
        this.duration = 0;
        this.result = null;
        this.error = null;
        this.stack = null;
    };
    
    Call.prototype.complete = function complete(duration, result, error, stack) {
        this.duration = duration;
        
        // TODO: set? would need to sanitize like arguments
        //this.result = result;
        
        this.error = error;
        this.stack = stack;
    };

    Call.prototype.prepareForTransport = function prepareForTransport() {
        for (var n = 0; n < this.args.length; n++) {
            var sarg = this.args[n];
            var darg = sarg;
            if (sarg) {
                if (sarg.sourceUniformName) {
                    darg = {
                        gliType: "UniformLocation",
                        id: sarg.sourceProgram.id,
                        name: sarg.sourceUniformName
                    };
                } else if (gli.util.isWebGLResource(sarg)) {
                    var tracked = sarg.tracked;
                    darg = {
                        gliType: tracked.type,
                        id: tracked.id
                    };
                } else if (gli.util.isTypedArray(sarg)) {
                    darg = {
                        arrayType: glitypename(sarg),
                        data: gli.util.typedArrayToArray(sarg)
                    };
                } else if (glitypename(sarg) == "ImageData") {
                    darg = {
                        domType: "ImageData",
                        width: sarg.width,
                        height: sarg.height,
                        data: gli.util.typedArrayToArray(sarg.data)
                    };
                } else if (sarg instanceof HTMLCanvasElement) {
                    // NOTE: no way to know if the source canvas was 2D or 3D, so can't get a context
                    // and extract the pixels. Draw to one we know is 2D and get from that instead.
                    var canvas = (sarg.ownerDocument || document).createElement("canvas");
                    canvas.width = sarg.width;
                    canvas.height = sarg.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(sarg, 0, 0);
                    var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    darg = {
                        domType: "HTMLCanvasElement",
                        width: pixels.width,
                        height: pixels.height,
                        data: gli.util.typedArrayToArray(pixels.data)
                    };
                } else if (sarg instanceof HTMLImageElement) {
                    darg = {
                        domType: "HTMLImageElement",
                        width: sarg.width,
                        height: sarg.height,
                        src: sarg.src
                    };
                } else if (sarg instanceof HTMLVideoElement) {
                    darg = {
                        domType: "HTMLVideoElement",
                        width: sarg.width,
                        height: sarg.height,
                        src: sarg.src
                    };
                }
            }
            this.args[n] = darg;
        }
    };
    
    data.Call = Call;
    
})();
