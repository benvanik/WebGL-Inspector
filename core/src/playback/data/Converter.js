(function () {
    var data = glinamespace("gli.playback.data");

    var Converter = function Converter() {
    };

    Converter.typeFromJson = function typeFromJson(session, arg) {
        if (!arg) {
            return arg;
        }

        var darg = arg;

        if (arg.gliType) {
            // Self resource of some kind
            var resource = session.resourceStore.getResourceById(arg.id);
            switch (arg.gliType) {
                case "UniformLocation":
                    darg = {
                        uniformReference: true,
                        program: resource,
                        name: arg.name
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
                    console.log("unknown gliType on arg decode: " + arg.gliType);
                    break;
            }
        } else if (arg.arrayType) {
            // TypedArray
            switch (arg.arrayType) {
                case "Int8Array":
                    darg = new Int8Array(arg.data);
                    break;
                case "Uint8Array":
                    darg = new Uint8Array(arg.data);
                    break;
                case "Int16Array":
                    darg = new Int16Array(arg.data);
                    break;
                case "Uint16Array":
                    darg = new Uint16Array(arg.data);
                    break;
                case "Int32Array":
                    darg = new Int32Array(arg.data);
                    break;
                case "Uint32Array":
                    darg = new Uint32Array(arg.data);
                    break;
                case "Float32Array":
                    darg = new Float32Array(arg.data);
                    break;
                case "Float64Array":
                    darg = new Float64Array(arg.data);
                    break;
                default:
                    console.log("unknown arrayType on arg decode: " + arg.arrayType);
                    break;
            }
        } else if (arg.domType) {
            // DOM resource of some kind
            console.log("NOT YET IMPLEMENTED");
            switch (arg.domType) {
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
                    console.log("unknown domType on arg decode: " + arg.domType);
                    break;
            }
        }

        return darg;
    };

    data.Converter = Converter;

})();
