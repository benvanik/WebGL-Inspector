(function () {
    var gli = glinamespace("gli");

    function installFrameTerminatorExtension(gl) {
        var ext = {};

        ext.frameEvent = new gli.EventSource("frameEvent");

        ext.frameTerminator = function () {
            ext.frameEvent.fire();
        };

        return {
            name: "GLI_frame_terminator",
            object: ext
        };
    };

    gli.installExtensions = function (gl) {
        var extensionStrings = [];
        var extensionObjects = {};

        // Setup extensions
        var frameTerminatorExt = installFrameTerminatorExtension(gl);
        extensionStrings.push(frameTerminatorExt.name);
        extensionObjects[frameTerminatorExt.name] = frameTerminatorExt.object;

        // Patch in new extensions
        var original_getSupportedExtensions = gl.getSupportedExtensions;
        gl.getSupportedExtensions = function () {
            var supportedExtensions = original_getSupportedExtensions.apply(gl);
            for (var n = 0; n < extensionStrings.length; n++) {
                supportedExtensions.push(extensionStrings[n]);
            }
            return supportedExtensions;
        };
        var original_getExtension = gl.getExtension;
        gl.getExtension = function (name) {
            var ext = extensionObjects[name];
            if (ext) {
                return ext;
            } else {
                return original_getExtension.apply(gl, arguments);
            }
        };
    };

    gli.enableAllExtensions = function (gl) {
        if (!gl.getSupportedExtensions) {
            return;
        }

        var extensionNames = gl.getSupportedExtensions();
        for (var n = 0; n < extensionNames.length; n++) {
            var extensionName = extensionNames[n];
            var extension = gl.getExtension(extensionName);
            // Ignore result
        }
    };

})();
