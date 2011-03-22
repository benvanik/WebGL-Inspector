(function () {
    var data = glinamespace("gli.playback.data");

    var CaptureFrame = function CaptureFrame(session, request, sourceFrame) {
        this.request = request;
        this.canvasInfo = sourceFrame.canvasInfo;
        this.frameNumber = sourceFrame.frameNumber;
        this.screenshot = null;
        this.time = sourceFrame.time;
        this.duration = sourceFrame.duration;
        
        this.assets = [];
        
        // Initial GL state
        this.initialState = {};
        for (var name in sourceFrame.initialState) {
            var svalue = sourceFrame.initialState[name];
            var dvalue = svalue;
            if (svalue) {
                dvalue = gli.playback.data.Converter.typeFromJson(session, svalue);
            }
            this.initialState[name] = dvalue;
        }

        // Initial uniforms for all programs
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

        // Initial resource:version that needs to be set at the start of the frame
        this.initialResources = [];
        for (var n = 0; n < sourceFrame.initialResources.length; n++) {
            var svalue = sourceFrame.initialResources[n];
            var resource = session.resourceStore.getResourceById(svalue.id);
            var version = resource.getVersion(svalue.version);
            this.initialResources.push({
                resource: resource,
                version: version
            });
            
            // Add all resource assets
            for (var m = 0; m < version.assets.length; m++) {
                this.assets.push(version.assets[m]);
            }
        }
        
        // All calls made in the frame
        this.calls = new Array(sourceFrame.calls.length);
        for (var n = 0; n < sourceFrame.calls.length; n++) {
            var scall = sourceFrame.calls[n];
            var dcall = new gli.playback.data.Call(session, scall);
            
            // Add all resource assets
            for (var m = 0; m < dcall.args.length; m++) {
                var arg = dcall.args[m];
                if (arg && arg.domType) {
                    this.assets.push(arg);
                }
            }
            
            this.calls[n] = dcall;
        }
    };

    data.CaptureFrame = CaptureFrame;

})();
