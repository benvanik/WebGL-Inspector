(function () {
    var resources = glinamespace("gli.resources");

    var Framebuffer = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        
        this.defaultName = "Framebuffer " + this.id;

        //this.type = gl.ARRAY_BUFFER; // ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER

        this.parameters = {};

        this.currentVersion.setParameters(this.parameters);
    };

    Framebuffer.prototype.refresh = function (gl) {
//        var paramEnums = [gl.BUFFER_SIZE, gl.BUFFER_USAGE];
//        for (var n = 0; n < paramEnums.length; n++) {
//            this.parameters[paramEnums[n]] = gl.getFramebufferParameter(this.type, paramEnums[n]);
//        }
    };

    Framebuffer.setCaptures = function (gl) {
//        var original_bufferData = gl.bufferData;
//        gl.bufferData = function () {
//            // 
//            return original_bufferData.apply(gl, arguments);
//        };

//        var original_bufferSubData = gl.bufferSubData;
//        gl.bufferSubData = function () {
//            // 
//            return original_bufferSubData.apply(gl, arguments);
//        };
    };

    Framebuffer.prototype.createTarget = function (gl, version) {
        /*var buffer = gl.createBuffer();
        gl.bindBuffer(version.target, buffer);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
            }

            gl[call.name].apply(gl, args);
        }
        
        return buffer;*/
    };

    Framebuffer.prototype.deleteTarget = function (gl, target) {
        //gl.deleteBuffer(target);
    };

    resources.Framebuffer = Framebuffer;

})();
