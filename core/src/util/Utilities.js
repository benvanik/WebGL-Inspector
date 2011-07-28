(function () {
    var util = glinamespace("gli.util");

    var Cloner = function () { };
    util.shallowClone = function shallowClone(obj) {
        Cloner.prototype = obj;
        return new Cloner();
    };

    util.deepClone = function deepClone(obj, filter) {
        if (filter && filter(obj)) {
            return obj;
        }
        var type = glitypename(obj);
        if ((type == "Object") || (type == "Array")) {
            var clone = (type == "Array") ? [] : {};
            for (var key in obj) {
                clone[key] = gli.util.deepClone(obj[key], filter);
            }
            return clone;
        }
        return obj;
    };

    util.deepCloneInto = function deepCloneInto(target, source, filter) {
        for (var key in source) {
            if (target[key] && target[key] instanceof Object) {
                gli.util.deepCloneInto(target[key], source[key], filter);
            } else {
                target[key] = gli.util.deepClone(source[key], filter);
            }
        }
    };

    // Helper to get a GL context with options
    util.getWebGLContext = function getWebGLContext(canvas, baseAttrs, attrs) {
        var finalAttrs = {};

        // baseAttrs are all required and attrs are ORed in
        if (baseAttrs) {
            for (var k in baseAttrs) {
                finalAttrs[k] = baseAttrs[k];
            }
        }
        if (attrs) {
            for (var k in attrs) {
                if (finalAttrs[k] === undefined) {
                    finalAttrs[k] = attrs[k];
                } else {
                    finalAttrs[k] |= attrs[k];
                }
            }
        }

        // Grab the gl context
        var contextName = "experimental-webgl";
        var gl = null;
        try {
            // getContextRaw is present if we have hijacked getContext
            if (canvas.getContextRaw) {
                gl = canvas.getContextRaw(contextName, finalAttrs);
            } else {
                gl = canvas.getContext(contextName, finalAttrs);
            }
        } catch (e) {
            // ?
            alert("Unable to get WebGL context: " + e);
        }

        if (gl) {
            // Enable all extensions on the context
            // TODO: better extension tracking to more accurately match host app behavior
            var extensionNames = gl.getSupportedExtensions();
            for (var n = 0; n < extensionNames.length; n++) {
                var extensionName = extensionNames[n];
                var extension = gl.getExtension(extensionName);
                // Ignore result
            }

            // Install any required hacks
            gli.util.installWebGLHacks(gl);
        }

        return gl;
    };

    // Given a width/height resize to a new [w, h] that has a max dimension of max
    util.constrainSize = function constrainSize(w, h, max) {
        var nw, nh;
        if (w > h) {
            if (w <= max) {
                return [w, h];
            }
            nw = max;
            nh = h / w * max;
        } else {
            if (h <= max) {
                return [w, h];
            }
            nh = max;
            nw = w / h * max;
        }
        return [nw, nh];
    };

    // Adjust TypedArray types to have consistent toString methods across browsers
    // TODO: remove this? don't want to mess with the host app...
    var typedArrayToString = function typedArrayToString() {
        var s = "";
        var maxIndex = Math.min(64, this.length);
        for (var n = 0; n < maxIndex; n++) {
            s += this[n];
            if (n < this.length - 1) {
                s += ",";
            }
        }
        if (maxIndex < this.length) {
            s += ",... (" + (this.length) + " total)";
        }
        return s;
    };
    Int8Array.prototype.toString = typedArrayToString;
    Uint8Array.prototype.toString = typedArrayToString;
    Int16Array.prototype.toString = typedArrayToString;
    Uint16Array.prototype.toString = typedArrayToString;
    Int32Array.prototype.toString = typedArrayToString;
    Uint32Array.prototype.toString = typedArrayToString;
    Float32Array.prototype.toString = typedArrayToString;

    // Pretty print a typed array
    util.typedArrayToString = function typedArrayToString(array) {
        if (array) {
            return typedArrayToString.apply(array);
        } else {
            return "(null)";
        }
    };

    // Convert a typed array to an array
    util.typedArrayToArray = function typedArrayToArray(array) {
        var result = new Array(array.length);
        for (var n = 0; n < array.length; n++) {
            result[n] = array[n];
        }
        return result;
    };

    // Returns true if the given value is a typed array
    util.isTypedArray = function isTypedArray(value) {
        if (!value) {
            return false;
        }
        if ((value instanceof Int8Array) ||
            (value instanceof Uint8Array) ||
            (value instanceof Int16Array) ||
            (value instanceof Uint16Array) ||
            (value instanceof Int32Array) ||
            (value instanceof Uint32Array) ||
            (value instanceof Float32Array)) {
            return true;
        } else {
            return false;
        }
    };

    // Compare, value for value, the given arrays
    util.arrayCompare = function arrayCompare(a, b) {
        if (a && b && a.length == b.length) {
            for (var n = 0; n < a.length; n++) {
                if (a[n] !== b[n]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    // Returns true if the given value is a WebGL resource type
    util.isWebGLResource = function isWebGLResource(value) {
        if (!value) {
            return false;
        }
        if (value.isWebGLObject) {
            return true;
        }
        if ((value instanceof WebGLBuffer) ||
            (value instanceof WebGLFramebuffer) ||
            (value instanceof WebGLProgram) ||
            (value instanceof WebGLRenderbuffer) ||
            (value instanceof WebGLShader) ||
            (value instanceof WebGLTexture)) {
            return true;
        }
        return false;
    }

    function prepareDocumentElement(el) {
        // FF requires all content be in a document before it'll accept it for playback
        if (window.navigator.product == "Gecko") {
            var frag = document.createDocumentFragment();
            frag.appendChild(el);
        }
    };

    // Clone the given argument (attempts a copy or real clone)
    util.clone = function clone(arg) {
        if (!arg) {
            return arg;
        }

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
        } else if (util.isTypedArray(arg)) {
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
            } else {
                target = arg;
            }
            return target;
        } else if (glitypename(arg) == "ImageData") {
            var dummyCanvas = document.createElement("canvas");
            var dummyContext = dummyCanvas.getContext("2d");
            var target = dummyContext.createImageData(arg);
            for (var n = 0; n < arg.data.length; n++) {
                target.data[n] = arg.data[n];
            }
            return target;
        } else if (arg instanceof HTMLCanvasElement) {
            // TODO: better way of doing this?
            var target = arg.cloneNode(true);
            var ctx = target.getContext("2d");
            ctx.drawImage(arg, 0, 0);
            prepareDocumentElement(target);
            return target;
        } else if (arg instanceof HTMLImageElement) {
            // TODO: clone image data (src?)
            var target = arg.cloneNode(true);
            target.crossOrigin = arg.crossOrigin || '';
            target.width = arg.width;
            target.height = arg.height;
            prepareDocumentElement(target);
            return target;
        } else if (arg instanceof HTMLVideoElement) {
            // TODO: clone video data (is this even possible? we want the exact frame at the time of upload - maybe preserve seek time?)
            var target = arg.cloneNode(true);
            prepareDocumentElement(target);
            return target;
        } else {
            return arg;
        }
    };

    // Not universally supported but useful
    util.scrollIntoViewIfNeeded = function scrollIntoViewIfNeeded(el) {
        if (el.scrollIntoViewIfNeeded) {
            el.scrollIntoViewIfNeeded();
        } else {
            // TODO: determine if el is in the current view of the parent
            var scrollTop = el.offsetParent.scrollTop;
            var scrollBottom = el.offsetParent.scrollTop + el.offsetParent.clientHeight;
            var elTop = el.offsetTop;
            var elBottom = el.offsetTop + el.offsetHeight;
            if ((elTop < scrollTop) || (elTop > scrollBottom)) {
                el.scrollIntoView();
            }
        }
    };

    var requestAnimationFrameNames = [
        "requestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "operaRequestAnimationFrame",
        "msAnimationFrame"
    ];
    for (var n = 0; n < requestAnimationFrameNames.length; n++) {
        if (window[requestAnimationFrameNames[n]]) {
            util.requestAnimationFrame = (function (func) {
                return function requestAnimationFrame() {
                    return func.apply(window, arguments);
                };
            })(window[requestAnimationFrameNames[n]]);
            break;
        }
    }
    if (!util.requestAnimationFrame) {
        util.requestAnimationFrame = function requestAnimationFrame(callback, element) {
            util.setTimeout(callback, 16);
        };
    }

})();
