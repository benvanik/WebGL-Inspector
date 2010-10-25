(function () {

    var Texture = function (gl, target) {
        gli.Resource.apply(this, [gl, target]);

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};

        this.uploader = null;
    };

    Texture.prototype.refresh = function () {
        var gl = this.gl;

        var paramEnums = [gl.TEXTURE_MAG_FILTER, gl.TEXTURE_MIN_FILTER, gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getTexParameter(this.type, paramEnums[n]);
        }
    };

    Texture.prototype.setData = function (target, level, internalformat, format, type, data) {
        this.refresh();
        this.type = target;

        // TODO: something with data
        var clonedData = gli.util.clone(data);
        this.uploader = function (gl) {
            gl.texImage2D(target, level, internalformat, format, type, clonedData);
        };
    };
    Texture.prototype.setDataRaw = function (target, level, internalformat, width, height, border, format, type, pixels) {
        this.refresh();
        this.type = target;

        // TODO: something with data
        var clonedPixels = gli.util.clone(pixels);
        this.uploader = function (gl) {
            gl.texImage2D(target, level, internalformat, width, height, border, format, type, clonedPixels);
        };
    };

    Texture.prototype.setSubData = function (target, level, xoffset, yoffset, format, type, data) {
        this.refresh();
        this.type = target;

        // TODO: something with data
        throw "subdata not yet implemented";
    };
    Texture.prototype.setSubDataRaw = function (target, level, xoffset, yoffset, width, height, format, type, pixels) {
        this.refresh();
        this.type = target;

        // TODO: something with data
        throw "subdata not yet implemented";
    };

    Texture.prototype.createMirror = function (gl) {
        var mirror = gl.createTexture();

        gl.bindTexture(this.type, mirror);

        for (var n in this.parameters) {
            gl.texParameteri(this.type, parseInt(n), this.parameters[n]);
        }

        if (this.uploader) {
            this.uploader(gl);
            gl.generateMipmap(this.type);
        } else {
            // Nothing uploaded yet
        }

        mirror.dispose = function () {
            gl.deleteTexture(mirror);
        };
        return mirror;
    };

    gli.Texture = Texture;

})();
