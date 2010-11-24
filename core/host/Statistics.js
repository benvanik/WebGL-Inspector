(function () {
    var host = glinamespace("gli.host");
    
    var Counter = function (name, description, unit, color, enabledByDefault) {
        this.name = name;
        this.description = description;
        this.unit = unit;
        this.color = color;
        this.enabled = enabledByDefault;
        
        this.value = 0;
        this.previousValue = 0;
        this.averageValue = 0;
    };

    var Statistics = function () {
        this.counters = [];
        
        this.counters.push(new Counter("frameTime", "Frame Time", "ms", "rgb(255,0,0)", true));
        this.counters.push(new Counter("drawsPerFrame", "Draws/Frame", null, "rgb(255,0,0)", true));
        this.counters.push(new Counter("primitivesPerFrame", "Primitives/Frame", null, "rgb(255,0,0)", true));
        this.counters.push(new Counter("textureCount", "Textures", null, "rgb(255,0,0)", true));
        this.counters.push(new Counter("bufferCount", "Buffers", null, "rgb(255,0,0)", true));
        this.counters.push(new Counter("programCount", "Programs", null, "rgb(255,0,0)", true));
        this.counters.push(new Counter("framebufferCount", "Framebuffers", null, "rgb(255,0,0)", false));
        this.counters.push(new Counter("renderbufferCount", "Renderbuffers", null, "rgb(255,0,0)", false));
        this.counters.push(new Counter("shaderCount", "Shaders", null, "rgb(255,0,0)", false));
        this.counters.push(new Counter("textureBytes", "Texture Memory", "MB", "rgb(255,0,0)", true));
        this.counters.push(new Counter("bufferBytes", "Buffer Memory", "MB", "rgb(255,0,0)", true));
        this.counters.push(new Counter("textureWrites", "Texture Writes/Frame", "MB", "rgb(255,0,0)", true));
        this.counters.push(new Counter("bufferWrites", "Buffer Writes/Frame", "MB", "rgb(255,0,0)", true));
        this.counters.push(new Counter("textureReads", "Texture Reads/Frame", "MB", "rgb(255,0,0)", true));
        
        for (var n = 0; n < this.counters.length; n++) {
            var counter = this.counters[n];
            this[counter.name] = counter;
        }
    };
    
    Statistics.prototype.beginFrame = function () {
        for (var n = 0; n < this.counters.length; n++) {
            var counter = this.counters[n];
            counter.previousValue = counter.value;
        }
        
        this.frameTime.value = 0;
        this.drawsPerFrame.value = 0;
        this.primitivesPerFrame.value = 0;
        this.textureWrites.value = 0;
        this.bufferWrites.value = 0;
        this.textureReads.value = 0;
        
        this.startTime = (new Date()).getTime();
    };
    
    Statistics.prototype.endFrame = function () {
        this.frameTime.value = (new Date()).getTime() - this.startTime;
        
        // Average things
        // TODO: better average calculation
        for (var n = 0; n < this.counters.length; n++) {
            var counter = this.counters[n];
            if (counter.averageValue == 0) {
                counter.averageValue = counter.value;
            } else {
                counter.averageValue = (counter.value * 75 + counter.averageValue * 25) / 100;
            }
        }
    };

    host.Statistics = Statistics;
})();
