(function () {
    var util = glinamespace("gli.util");

    var Cloner = function () {};
    util.shallowClone = function shallowClone(obj) {
        Cloner.prototype = obj;
        return new Cloner();
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
        var typename = glitypename(value);
        switch (typename) {
            case "Int8Array":
            case "Uint8Array":
            case "Int16Array":
            case "Uint16Array":
            case "Int32Array":
            case "Uint32Array":
            case "Float32Array":
            case "Float64Array":
                return true;
            default:
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
        } else {
            return false;
        }
    };

    // Returns true if the given value is a WebGL resource type
    util.isWebGLResource = function isWebGLResource(value) {
        if (!value) {
            return false;
        }
        var typename = glitypename(value);
        switch (typename) {
            case "WebGLBuffer":
            case "WebGLFramebuffer":
            case "WebGLProgram":
            case "WebGLRenderbuffer":
            case "WebGLShader":
            case "WebGLTexture":
                return true;
            default:
                return false;
        }
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

})();
