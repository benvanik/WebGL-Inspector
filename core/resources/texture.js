(function () {

    var Texture = function (gl, stack, target) {
        gli.Resource.apply(this, [gl, stack, target]);

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};

        this.uploader = null;
        this.subUploaders = [];
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
        this.subUploaders = [];
    };
    Texture.prototype.setDataRaw = function (target, level, internalformat, width, height, border, format, type, pixels) {
        this.refresh();
        this.type = target;

        // TODO: something with data
        var clonedPixels = gli.util.clone(pixels);
        this.uploader = function (gl) {
            gl.texImage2D(target, level, internalformat, width, height, border, format, type, clonedPixels);
        };
        this.subUploaders = [];
    };

    Texture.prototype.setSubData = function (target, level, xoffset, yoffset, format, type, data) {
        this.refresh();
        this.type = target;

        this.subUploaders.push(function (gl) {
            gl.texSubImage2D(target, level, xoffset, yoffset, format, type, data);
        });
    };
    Texture.prototype.setSubDataRaw = function (target, level, xoffset, yoffset, width, height, format, type, pixels) {
        this.refresh();
        this.type = target;

        this.subUploaders.push(function (gl) {
            gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
        });
    };

    Texture.prototype.createMirror = function (gl) {
        var mirror = gl.createTexture();

        gl.bindTexture(this.type, mirror);

        for (var n in this.parameters) {
            gl.texParameteri(this.type, parseInt(n), this.parameters[n]);
        }

        if (this.uploader) {
            this.uploader(gl);
        }

        for (var n = 0; n < this.subUploaders.length; n++) {
            this.subUploaders[n](gl);
        }

        if (this.uploader) {
            gl.generateMipmap(this.type);
        }

        mirror.dispose = function () {
            gl.deleteTexture(mirror);
        };
        return mirror;
    };

    gli = gli || {};
    gli.Texture = Texture;

})();
