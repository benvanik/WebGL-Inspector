(function () {
    var data = glinamespace("gli.playback.data");

    var CaptureFrame = function CaptureFrame(session, request, sourceFrame) {
        this.request = request;
        this.canvasInfo = sourceFrame.canvasInfo;
        this.frameNumber = sourceFrame.frameNumber;
        this.screenshot = null;
        this.time = sourceFrame.time;
        this.duration = sourceFrame.duration;
        
        //this.resourceTable = {};
        
        //this.initialState = this.captureState(gl);
        //this.initialUniforms = this.captureUniforms(gl, resourceCache);
        //this.initialResources = resourceCache.captureVersions();
        
        this.calls = new Array(sourceFrame.calls.length);
        for (var n = 0; n < sourceFrame.calls.length; n++) {
            var sourceCall = sourceFrame.calls[n];
            this.calls[n] = new gli.playback.data.Call(session, sourceCall);
        }
    };

    data.CaptureFrame = CaptureFrame;

})();
