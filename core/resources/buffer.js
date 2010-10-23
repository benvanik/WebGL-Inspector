(function () {

    var Buffer = function (gl, target) {
        gli.Resource.apply(this, [gl, target]);

        this.type = gl.ARRAY_BUFFER; // ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER

        this.parameters = {};
        this.parameters[gl.BUFFER_SIZE] = 0;
        this.parameters[gl.BUFFER_USAGE] = gl.STATIC_DRAW;
    };

    Buffer.prototype.refresh = function () {
        var gl = this.gl;
        var paramEnums = [gl.BUFFER_SIZE, gl.BUFFER_USAGE];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getBufferParameter(this.type, paramEnums[n]);
        }
    };

    Buffer.prototype.setData = function (target, data, usage) {
        this.refresh();
        this.type = target;

        // data can be size (init to zero) or some buffer/view

        // TODO: something with data
        this.parameters[gl.BUFFER_SIZE] = 0;
        this.parameters[gl.BUFFER_USAGE] = usage;
    };

    Buffer.prototype.setSubData = function (target, offset, data) {
        this.refresh();
        this.type = target;

        // TODO: something with data
    };

    gli.Buffer = Buffer;

})();
