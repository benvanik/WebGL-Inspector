(function () {

    var Buffer = function (gl, target) {
        gli.Resource.apply(this, [gl, target]);

        this.type = gl.ARRAY_BUFFER; // ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER

        this.parameters = {};
        this.parameters[gl.BUFFER_SIZE] = 0;
        this.parameters[gl.BUFFER_USAGE] = gl.STATIC_DRAW;

        this.data = null;
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
        var size;
        if (data instanceof Number) {
            size = data;
            this.data = null;
        } else {
            size = data.byteLength;
            this.data = gli.util.clone(data);
        }

        // TODO: something with data
        this.parameters[gl.BUFFER_SIZE] = size;
        this.parameters[gl.BUFFER_USAGE] = usage;
    };

    Buffer.prototype.setSubData = function (target, offset, data) {
        this.refresh();
        this.type = target;

        // TODO: something with data
        throw "subdata not yet implemented";
    };

    Buffer.prototype.createMirror = function (gl) {
        var mirror = gl.createBuffer();

        gl.bindBuffer(this.type, mirror);

        if (this.data == null) {
            gl.bufferData(this.type, this.parameters[gl.BUFFER_SIZE], this.parameters[gl.BUFFER_USAGE]);
        } else {
            gl.bufferData(this.type, this.data, this.parameters[gl.BUFFER_USAGE]);
        }

        mirror.dispose = function () {
            gl.deleteBuffer(mirror);
        };
        return mirror;
    };

    gli.Buffer = Buffer;

})();
