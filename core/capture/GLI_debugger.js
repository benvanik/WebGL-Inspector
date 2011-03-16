(function () {
    var capture = glinamespace("gli.capture");
    
    var GLI_debugger = function GLI_debugger(gl) {
        this.name = "GLI_debugger";
        this.gl = gl;
    };
    
    GLI_debugger.prototype.frameTerminator = function frameTerminator() {
        gli.util.frameTerminator.fire();
    };
    
    capture.installExtension = function installExtension(gl) {
        var extensionStrings = [];
        var extensionObjects = {};

        // Setup extension object
        var ext = new GLI_debugger(gl);
        extensionStrings.push(ext.name);
        extensionObjects[ext.name] = ext;

        // getSupportedExtensions
        var original_getSupportedExtensions = gl.getSupportedExtensions;
        gl.getSupportedExtensions = function getSupportedExtensions() {
            var supportedExtensions = original_getSupportedExtensions.apply(gl);
            for (var n = 0; n < extensionStrings.length; n++) {
                supportedExtensions.push(extensionStrings[n]);
            }
            return supportedExtensions;
        };
        
        // getExtension
        var original_getExtension = gl.getExtension;
        gl.getExtension = function getExtension(name) {
            var ext = extensionObjects[name];
            if (ext) {
                return ext;
            } else {
                return original_getExtension.apply(gl, arguments);
            }
        };
    };

})();
