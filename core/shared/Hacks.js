(function () {
    var hacks = glinamespace("gli.hacks");

    hacks.installMissingConstants = function (gl) {

        // HACK: due to some missing constants in ff, ensure that they are present before we do anything
        // https://bugzilla.mozilla.org/show_bug.cgi?id=611924

        if (!gl.VIEWPORT) {
            gl.VIEWPORT = 0x0BA2;
        }

    };

    hacks.installSamplerUniformHack = function (gl) {
        // HACK: bug in WebCore's getUniform causes all queries for SAMPLER_2D and SAMPLER_CUBE to fail
        // This workaround uses a lookaside to cache all uniform1i[v] calls
        // https://bugs.webkit.org/show_bug.cgi?id=52190

        gl.__uniqueUniformId = 0;

        var original_getUniformLocation = gl.getUniformLocation;
        gl.getUniformLocation = function (program, name) {
            var result = original_getUniformLocation.apply(this, arguments);
            if (result) {
                var uniformLookup = program.__uniformLookup;
                if (!uniformLookup) {
                    uniformLookup = program.__uniformLookup = {};
                }
                if (!uniformLookup.hasOwnProperty(name)) {
                    uniqueId = String(gl.__uniqueUniformId++);
                    uniformLookup[name] = uniqueId;
                }
                result.__uniqueId = uniformLookup[name];
            }
            return result;
        };
        var original_uniform1i = gl.uniform1i;
        gl.uniform1i = function (loc, value) {
            if (!loc) {
                return;
            }
            var program = this.getParameter(this.CURRENT_PROGRAM);
            if (!program) {
                return;
            }
            var lookaside = program.__uniformLookaside;
            if (!lookaside) {
                lookaside = program.__uniformLookaside = {};
            }
            lookaside[loc.__uniqueId] = value;
            original_uniform1i.apply(this, arguments);
        };
        var original_uniform1iv = gl.uniform1iv;
        gl.uniform1iv = function (loc, value) {
            if (!loc) {
                return;
            }
            var program = this.getParameter(this.CURRENT_PROGRAM);
            if (!program) {
                return;
            }
            var lookaside = program.__uniformLookaside;
            if (!lookaside) {
                lookaside = program.__uniformLookaside = {};
            }
            lookaside[loc.__uniqueId] = value[0];
            original_uniform1iv.apply(this, arguments);
        };
        var original_getUniform = gl.getUniform;
        gl.getUniform = function (program, loc) {
            var lookaside = program.__uniformLookaside;
            if (lookaside) {
                if (lookaside.hasOwnProperty(loc.__uniqueId)) {
                    return lookaside[loc.__uniqueId];
                }
            }
            return original_getUniform.apply(this, arguments);
        };
    };

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

    hacks.installAll = function (gl) {
        if (gl.__hasHacksInstalled) {
            return;
        }
        gl.__hasHacksInstalled = true;

        hacks.installMissingConstants(gl);
        hacks.installSamplerUniformHack(gl);
        hacks.installANGLEStateLookaside(gl);
    };

})();
