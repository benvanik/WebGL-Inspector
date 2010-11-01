function glinamespace(name) {
    var parts = name.split(".");
    var current = window;
    for (var n = 0; n < parts.length; n++) {
        var part = parts[n];
        current[part] = current[part] || {};
        current = current[part];
    }
    return current;
}

function glisubclass(parent, child, args) {
    parent.apply(child, args);

    // TODO: this sucks - do it right

    for (var propertyName in parent.prototype) {
        if (propertyName == "constructor") {
            continue;
        }
        if (!child.__proto__[propertyName]) {
            child.__proto__[propertyName] = parent.prototype[propertyName];
        }
    }

    for (var propertyName in parent) {
        child[propertyName] = parent[propertyName];
    }
};

(function () {
    var util = glinamespace("gli.util");

    util.isWebGLResource = function(value) {
        if (value) {
            var typename = value.constructor.toString();
            if ((typename.indexOf("WebGLBuffer") >= 0) ||
                (typename.indexOf("WebGLFramebuffer") >= 0) ||
                (typename.indexOf("WebGLProgram") >= 0) ||
                (typename.indexOf("WebGLRenderbuffer") >= 0) ||
                (typename.indexOf("WebGLShader") >= 0) ||
                (typename.indexOf("WebGLTexture") >= 0)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    util.clone = function(arg) {
        if (arg) {
            if ((arg.constructor == Number) || (arg.constructor == String)) {
                // Fast path for immutables
                return arg;
            } else if (arg.constructor == Array) {
                return arg.slice(); // ghetto clone
            } else if (arg instanceof ArrayBuffer) {
                // There may be a better way to do this, but I don't know it
                var target = new ArrayBuffer(arg.byteLength);
                var sourceView = new DataView(arg, 0, source.byteLength);
                var targetView = new DataView(target, 0, target.byteLength);
                for (var n = 0; n < source.byteLength; n++) {
                    targetView.setUInt8(n, sourceView.getUInt8(n));
                }
                return target;
            } else if (arg.__proto__.__proto__.constructor.toString().indexOf("ArrayBufferView") > 0) {
                //} else if (arg instanceof ArrayBufferView) {
                // HACK: at least Chromium doesn't have ArrayBufferView as a known type (for some reason)
                var target = null;
                if (arg instanceof Int8Array) {
                    target = new Int8Array(arg);
                } else if (arg instanceof Uint8Array) {
                    target = new Uint8Array(arg);
                } else if (arg instanceof Int16Array) {
                    target = new Int16Array(arg);
                } else if (arg instanceof Uint16Array) {
                    target = new Uint16Array(arg);
                } else if (arg instanceof Int32Array) {
                    target = new Int32Array(arg);
                } else if (arg instanceof Uint32Array) {
                    target = new Uint32Array(arg);
                } else if (arg instanceof Float32Array) {
                    target = new Float32Array(arg);
                } else if (arg instanceof Float64Array) {
                    target = new Float64Array(arg);
                } else {
                    target = arg;
                }
                return target;
            } else if (arg.__proto__.constructor.toString().indexOf("ImageData") > 0) {
                var dummyCanvas = document.createElement("canvas");
                var dummyContext = dummyCanvas.getContext("2d");
                var target = dummyContext.createImageData(arg);
                for (var n = 0; n < arg.data.length; n++) {
                    target.data[n] = arg.data[n];
                }
                return target;
            } else if (arg instanceof HTMLCanvasElement) {
                // TODO: better way of doing this?
                var newCanvas = arg.cloneNode(true);
                var ctx = newCanvas.getContext("2d");
                ctx.drawImage(arg, 0, 0);
                return newCanvas;
            } else if (arg instanceof HTMLImageElement) {
                // TODO: clone image data (src?)
                return arg.cloneNode(true);
            } else if (arg instanceof HTMLVideoElement) {
                // TODO: clone video data (is this even possible? we want the exact frame at the time of upload - maybe preserve seek time?)
                return arg.cloneNode(true);
            } else {
                return arg;
            }
        } else {
            return arg;
        }
    };

})();
