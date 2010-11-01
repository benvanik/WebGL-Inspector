(function () {
    var replay = glinamespace("gli.replay");

    var Frame = function (sourceFrame) {
        this.frameNumber = sourceFrame.iframeNumber;
        this.initialState = new replay.StateSnapshot(sourceFrame.initialState);
        this.screenshot = sourceFrame.screenshot;

        this.resourcesUsed = sourceFrame.resourcesUsed;
        this.resourcesRead = sourceFrame.resourcesRead;
        this.resourcesWritten = sourceFrame.resourcesWritten;

        this.calls = sourceFrame.calls;

        this.resourceVersions = sourceFrame.resourceVersions;
    };

    Frame.prototype.makeActive = function (gl) {
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];

            // TODO: faster lookup
            var version = null;
            for (var m = 0; m < this.resourceVersions.length; m++) {
                if (this.resourceVersions[m].resource.id === resource.id) {
                    version = this.resourceVersions[m].value;
                    break;
                }
            }

            resource.restoreVersion(gl, version);
        }

        frame.initialState.apply(gl);
    };

    replay.Frame = Frame;

})();
