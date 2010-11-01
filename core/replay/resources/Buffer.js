(function () {
    var resources = glinamespace("gli.replay.resources");

    function BufferCreateTarget(gl, version) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(version.target, buffer);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
            }

            gl[call.name].apply(gl, args);
        }
    };

    function BufferDeleteTarget(gl, target) {
        gl.deleteBuffer(target);
    };

    var Buffer = function (sourceResource) {
        glisubclass(gli.replay.Resource, this, [sourceResource]);

        Buffer.createTarget = BufferCreateTarget;
        Buffer.deleteTarget = BufferDeleteTarget;
    };

    resources.Buffer = Buffer;

})();
