(function () {
    var hacks = glinamespace("gli.hacks");

    hacks.installANGLEStateLookaside = function (gl) {

        // HACK: due to an ANGLE bug, we don't get the values for enable/disable caps
        // http://code.google.com/p/angleproject/issues/detail?id=69

        var brokenEnums = ["BLEND", "CULL_FACE", "DEPTH_TEST", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"];

        // All default to false except DITHER
        gl.boolLookaside = {};
        for (var n = 0; n < brokenEnums.length; n++) {
            gl.boolLookaside[gl[brokenEnums[n]]] = false;
        }
        gl.boolLookaside[gl.DITHER] = true;

        // Snoop enable()/disable()
        var originalEnable = gl.enable;
        gl.enable = function (cap) {
            this.boolLookaside[cap] = true;
            return originalEnable.apply(this, arguments);
        };
        var originalDisable = gl.disable;
        gl.disable = function (cap) {
            this.boolLookaside[cap] = false;
            return originalDisable.apply(this, arguments);
        };

        // Wrap getParameter() to use our lookaside when required
        var originalGetParameter = gl.getParameter;
        gl.getParameter = function (cap) {
            if (gl.boolLookaside[cap] !== undefined) {
                return gl.boolLookaside[cap];
            } else {
                return originalGetParameter.apply(gl, arguments);
            }
        };

    };

})();