(function () {
    var data = glinamespace("gli.playback.data");

    var CaptureFrame = function CaptureFrame(session, request, sourceFrame) {
        this.request = request;
        this.canvasInfo = sourceFrame.canvasInfo;
        this.frameNumber = sourceFrame.frameNumber;
        this.screenshot = null;
        this.time = sourceFrame.time;
        this.duration = sourceFrame.duration;
        
        this.initialState = {};
        for (var name in sourceFrame.initialState) {
            var svalue = sourceFrame.initialState[name];
            var dvalue = svalue;
            if (svalue) {
                dvalue = gli.playback.data.Converter.typeFromJson(session, svalue);
            }
            this.initialState[name] = dvalue;
        }

        this.initialUniforms = [];
        for (var n = 0; n < sourceFrame.initialUniforms.length; n++) {
            var svalue = sourceFrame.initialUniforms[n];
            var program = session.resourceStore.getResourceById(svalue.id);
            var values = {};
            for (var name in svalue.values) {
                var sinfo = svalue.values[name];
                var dinfo = gli.util.shallowClone(sinfo);
                values[name] = dinfo;
            }
            this.initialUniforms.push({
                program: program,
                values: values
            });
        }

        this.initialResources = [];
        for (var n = 0; n < sourceFrame.initialResources.length; n++) {
            var svalue = sourceFrame.initialResources[n];
            var resource = session.resourceStore.getResourceById(svalue.id);
            this.initialResources.push({
                resource: resource,
                version: resource.getVersion(svalue.version)
            });
        }
        
        this.calls = new Array(sourceFrame.calls.length);
        for (var n = 0; n < sourceFrame.calls.length; n++) {
            var sourceCall = sourceFrame.calls[n];
            this.calls[n] = new gli.playback.data.Call(session, sourceCall);
        }
    };

    data.CaptureFrame = CaptureFrame;

})();
