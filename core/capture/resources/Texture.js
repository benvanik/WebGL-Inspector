(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var Texture = function Texture(resourceCache, rawArgs, target, stack) {
        glisubclass(resources.Resource, this, [resourceCache, rawArgs, target, stack, "Texture"]);
        this.creationOrder = 1;
    };
    
    Texture.getTracked = function getTracked(gl, args) {
        gl = gl.raw;
        var bindingEnum;
        switch (args[0]) {
            case gl.TEXTURE_2D:
                bindingEnum = gl.FRAMEBUFFER_BINDING;
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
            gl = gl.raw;
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
        
        buildRecorder(methods, "copyTexImage2D", Texture.getTracked, true);
        buildRecorder(methods, "copyTexSubImage2D", Texture.getTracked, true);
        
        buildRecorder(methods, "texParameterf", Texture.getTracked, false);
        buildRecorder(methods, "texParameteri", Texture.getTracked, false);
        
        buildRecorder(methods, "texImage2D", Texture.getTracked, true, pushPixelStoreState);
        buildRecorder(methods, "texSubImage2D", Texture.getTracked, false, pushPixelStoreState);
        
        buildRecorder(methods, "generateMipmap", Texture.getTracked, false);
        buildRecorder(methods, "readPixels", Texture.getTracked, false, pushPixelStoreState);
    };
    
    resources.Texture = Texture;
    
})();
