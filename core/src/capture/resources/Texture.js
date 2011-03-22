(function () {
    var resources = glinamespace("gli.capture.resources");
    
    var Texture = function Texture(resourceCache, rawArgs, target, stack) {
        this.super.call(this, resourceCache, rawArgs, target, stack, "Texture");
    };
    glisubclass(gli.capture.resources.Resource, Texture);
    
    Texture.getTracked = function getTracked(gl, args) {
        var bindingEnum;
        switch (args[0]) {
            case gl.TEXTURE_2D:
                bindingEnum = gl.TEXTURE_BINDING_2D;
                break;
            case gl.TEXTURE_CUBE_MAP:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_X:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                bindingEnum = gl.TEXTURE_BINDING_CUBE_MAP;
                break;
            default:
                console.log("Unknown texture binding type");
                break;
        }
        var target = gl.getParameter(bindingEnum);
        if (target) {
            return target.tracked;
        } else {
            return null;
        }
    };
    
    Texture.setupCaptures = function setupCaptures(impl) {
        var methods = impl.methods;
        var buildRecorder = resources.Resource.buildRecorder;
        
        function pushPixelStoreState(gl, tracked) {
            var pixelStoreEnums = [gl.PACK_ALIGNMENT, gl.UNPACK_ALIGNMENT, gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.UNPACK_FLIP_Y_WEBGL, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL];
            for (var n = 0; n < pixelStoreEnums.length; n++) {
                var pixelStoreEnum = pixelStoreEnums[n];
                if (pixelStoreEnum === undefined) {
                    continue;
                }
                var value = gl.getParameter(pixelStoreEnums[n]);
                tracked.currentVersion.recordCall("pixelStorei", [pixelStoreEnum, value]);
            }
        };
        
        var resetCalls = [
            "copyTexImage2D",
            "copyTexSubImage2D",
            "texImage2D",
            "texSubImage2D",
            "generateMipmap"
        ];
        
        buildRecorder(impl, "copyTexImage2D", Texture.getTracked, resetCalls);
        buildRecorder(impl, "copyTexSubImage2D", Texture.getTracked, null);
        
        buildRecorder(impl, "texParameterf", Texture.getTracked, null);
        buildRecorder(impl, "texParameteri", Texture.getTracked, null);
        
        buildRecorder(impl, "texImage2D", Texture.getTracked, resetCalls, pushPixelStoreState);
        buildRecorder(impl, "texSubImage2D", Texture.getTracked, null, pushPixelStoreState);
        
        buildRecorder(impl, "generateMipmap", Texture.getTracked, null);
    };
    
    resources.Texture = Texture;
    
})();
