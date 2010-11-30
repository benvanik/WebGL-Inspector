(function () {
    var resources = glinamespace("gli.resources");

    var Framebuffer = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);

        this.defaultName = "Framebuffer " + this.id;

        // TODO: track the attachments a framebuffer has (watching framebufferRenderbuffer/etc calls)

        this.parameters = {};
        // Attachments: COLOR_ATTACHMENT0, DEPTH_ATTACHMENT, STENCIL_ATTACHMENT
        // These parameters are per-attachment
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE] = 0;
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME] = 0;
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL] = 0;
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE] = 0;

        this.currentVersion.setParameters(this.parameters);
    };

    Framebuffer.prototype.refresh = function (gl) {
        // Attachments: COLOR_ATTACHMENT0, DEPTH_ATTACHMENT, STENCIL_ATTACHMENT
        //var paramEnums = [gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE];
        //for (var n = 0; n < paramEnums.length; n++) {
        //    this.parameters[paramEnums[n]] = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, attachment, paramEnums[n]);
        //}
    };

    Framebuffer.getTracked = function (gl, args) {
        // only FRAMEBUFFER
        var bindingEnum = gl.FRAMEBUFFER_BINDING;
        var glframebuffer = gl.getParameter(bindingEnum);
        if (glframebuffer == null) {
            // Going to fail
            return null;
        }
        return glframebuffer.trackedObject;
    };

    Framebuffer.setCaptures = function (gl) {
        var original_framebufferRenderbuffer = gl.framebufferRenderbuffer;
        gl.framebufferRenderbuffer = function () {
            var tracked = Framebuffer.getTracked(gl, arguments);
            tracked.markDirty(false);
            // TODO: remove existing calls for this attachment
            tracked.currentVersion.pushCall("framebufferRenderbuffer", arguments);

            var result = original_framebufferRenderbuffer.apply(gl, arguments);

            // HACK: query the parameters now - easier than calculating all of them
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);

            return result;
        };

        var original_framebufferTexture2D = gl.framebufferTexture2D;
        gl.framebufferTexture2D = function () {
            var tracked = Framebuffer.getTracked(gl, arguments);
            tracked.markDirty(false);
            // TODO: remove existing calls for this attachment
            tracked.currentVersion.pushCall("framebufferTexture2D", arguments);

            var result = original_framebufferTexture2D.apply(gl, arguments);

            // HACK: query the parameters now - easier than calculating all of them
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);

            return result;
        };
    };

    Framebuffer.prototype.createTarget = function (gl, version) {
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
                if (args[m] && args[m].mirror) {
                    if (!args[m].mirror.target) {
                        // Demand create target
                        // TODO: this is not the correct version!
                        args[m].restoreVersion(gl, args[m].currentVersion);
                    }
                    args[m] = args[m].mirror.target;
                }
            }

            gl[call.name].apply(gl, args);
        }

        return framebuffer;
    };

    Framebuffer.prototype.deleteTarget = function (gl, target) {
        gl.deleteFramebuffer(target);
    };

    resources.Framebuffer = Framebuffer;

})();
