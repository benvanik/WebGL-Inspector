(function () {

    var Texture = function (gl, stack, target) {
        gli.Resource.apply(this, [gl, stack, target]);

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};

        this.faces = [];
    };

    Texture.prototype.refresh = function () {
        var gl = this.gl;

        var paramEnums = [gl.TEXTURE_MAG_FILTER, gl.TEXTURE_MIN_FILTER, gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getTexParameter(this.type, paramEnums[n]);
        }
    };

    Texture.prototype.setData = function (target, level, internalformat, format, type, data) {
        var gl = this.gl;

        this.refresh();

        var faceIndex = 0;
        if (target == gl.TEXTURE_2D) {
            this.type = gl.TEXTURE_2D;
            faceIndex = 0;
        } else {
            this.type = gl.TEXTURE_CUBE_MAP;
            faceIndex = target - gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        }

        // TODO: something with data
        var clonedData = gli.util.clone(data);
        this.faces[faceIndex] = {
            data: function (gl) {
                gl.texImage2D(target, level, internalformat, format, type, clonedData);
            },
            subDatas: []
        };
    };
    Texture.prototype.setDataRaw = function (target, level, internalformat, width, height, border, format, type, pixels) {
        var gl = this.gl;

        this.refresh();

        var faceIndex = 0;
        if (target == gl.TEXTURE_2D) {
            this.type = gl.TEXTURE_2D;
            faceIndex = 0;
        } else {
            this.type = gl.TEXTURE_CUBE_MAP;
            faceIndex = target - gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        }

        // TODO: something with data
        var clonedPixels = gli.util.clone(pixels);
        this.faces[faceIndex] = {
            data: function (gl) {
                gl.texImage2D(target, level, internalformat, width, height, border, format, type, clonedPixels);
            },
            subDatas: []
        };
    };

    Texture.prototype.setSubData = function (target, level, xoffset, yoffset, format, type, data) {
        var gl = this.gl;

        this.refresh();

        var faceIndex = 0;
        if (target == gl.TEXTURE_2D) {
            this.type = gl.TEXTURE_2D;
            faceIndex = 0;
        } else {
            this.type = gl.TEXTURE_CUBE_MAP;
            faceIndex = target - gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        }

        var face = this.faces[faceIndex];
        if (!face) {
            face = this.faces[faceIndex] = {
                data: null,
                subDatas: []
            };
        }
        face.subDatas.push(function (gl) {
            gl.texSubImage2D(target, level, xoffset, yoffset, format, type, data);
        });
    };
    Texture.prototype.setSubDataRaw = function (target, level, xoffset, yoffset, width, height, format, type, pixels) {
        var gl = this.gl;

        this.refresh();

        var faceIndex = 0;
        if (target == gl.TEXTURE_2D) {
            this.type = gl.TEXTURE_2D;
            faceIndex = 0;
        } else {
            this.type = gl.TEXTURE_CUBE_MAP;
            faceIndex = target - gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        }

        var face = this.faces[faceIndex];
        if (!face) {
            face = this.faces[faceIndex] = {
                data: null,
                subDatas: []
            };
        }
        face.subDatas.push(function (gl) {
            gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
        });
    };

    Texture.prototype.createMirror = function (gl) {
        var mirror = gl.createTexture();

        gl.bindTexture(this.type, mirror);

        for (var n in this.parameters) {
            gl.texParameteri(this.type, parseInt(n), this.parameters[n]);
        }

        var anyUploaded = false;
        if (this.type == gl.TEXTURE_2D) {
            var face = this.faces[0];
            if (face.data) {
                face.data(gl);
                anyUploaded = true;
            }
            for (var m = 0; m < face.subDatas.length; m++) {
                face.subDatas[m](gl);
            }
        } else {
            for (var n = 0; n < this.faces.length; n++) {
                var face = this.faces[n];
                if (face.data) {
                    face.data(gl);
                    anyUploaded = true;
                }
                for (var m = 0; m < face.subDatas.length; m++) {
                    face.subDatas[m](gl);
                }
            }
        }

        // TODO: is this enough of a check?
        if (anyUploaded) {
            // TODO: only do if it had been requested before!
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
