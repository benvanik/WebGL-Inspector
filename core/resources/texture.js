(function () {

    var Texture = function (gl, target) {
        gli.Resource.apply(this, [gl, target]);

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};
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
    };
    Texture.prototype.setDataRaw = function (target, level, internalformat, width, height, border, format, type, pixels) {
        this.refresh();
        this.type = target;

        // TODO: something with data
    };

    Texture.prototype.setSubData = function (target, level, xoffset, yoffset, format, type, data) {
        this.refresh();
        this.type = target;

        // TODO: something with data
    };
    Texture.prototype.setSubDataRaw = function (target, level, xoffset, yoffset, width, height, format, type, pixels) {
        this.refresh();
        this.type = target;

        // TODO: something with data
    };

    gli.Texture = Texture;

})();
