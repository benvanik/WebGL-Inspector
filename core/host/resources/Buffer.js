(function () {
    var resources = glinamespace("gli.resources");

    var Buffer = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);

        this.type = gl.ARRAY_BUFFER; // ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER

        this.parameters = {};
        this.parameters[gl.BUFFER_SIZE] = 0;
        this.parameters[gl.BUFFER_USAGE] = gl.STATIC_DRAW;

        this.currentVersion.setParameters(this.parameters);
    };

    Buffer.prototype.refresh = function (gl) {
        var paramEnums = [gl.BUFFER_SIZE, gl.BUFFER_USAGE];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getBufferParameter(this.type, paramEnums[n]);
        }
    };

    Buffer.getTracked = function (gl, args) {
        var bindingEnum;
        switch (args[0]) {
            case gl.ARRAY_BUFFER:
                bindingEnum = gl.ARRAY_BUFFER_BINDING;
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                bindingEnum = gl.ELEMENT_ARRAY_BUFFER_BINDING;
                break;
        }
        var glbuffer = gl.getParameter(bindingEnum);
        if (glbuffer == null) {
            // Going to fail
            return null;
        }
        return glbuffer.trackedObject;
    };

    Buffer.setCaptures = function (gl) {
        var original_bufferData = gl.bufferData;
        gl.bufferData = function () {
            var tracked = Buffer.getTracked(gl, arguments);
            tracked.markDirty(true);
            tracked.currentVersion.pushCall("bufferData", arguments);
            var result = original_bufferData.apply(gl, arguments);
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);
            return result;
        };

        var original_bufferSubData = gl.bufferSubData;
        gl.bufferSubData = function () {
            var tracked = Buffer.getTracked(gl, arguments);
            tracked.markDirty(false);
            tracked.currentVersion.pushCall("bufferSubData", arguments);
            return original_bufferSubData.apply(gl, arguments);
        };
    };

    resources.Buffer = Buffer;

})();