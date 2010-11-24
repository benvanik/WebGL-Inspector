(function () {
    var ui = glinamespace("gli.ui");

    var TimelineView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-whole-inner")[0]
        };
        
        this.displayCanvas = document.createElement("canvas");
        this.displayCanvas.className = "gli-reset";
        this.displayCanvas.width = 800;
        this.displayCanvas.height = 200;
        this.elements.view.appendChild(this.displayCanvas);
        
        this.canvases = [];
        for (var n = 0; n < 2; n++) {
            var canvas = document.createElement("canvas");
            canvas.className = "gli-reset";
            canvas.width = 800;
            canvas.height = 200;
            this.canvases.push(canvas);
        }
        this.activeCanvasIndex = 0;
        
        // Install a frame watcher
        this.window.context.frameCompleted.addListener(this, function () {
            // TODO: hold updates for a bit? Could affect perf to do this every frame
            self.appendFrame();
        });
    };
    
    TimelineView.prototype.appendFrame = function () {
        var statistics = this.window.context.statistics;
        
        var canvas = this.canvases[this.activeCanvasIndex];
        this.activeCanvasIndex = (this.activeCanvasIndex + 1) % this.canvases.length;
        var oldCanvas = this.canvases[this.activeCanvasIndex];
        
        var ctx = canvas.getContext("2d");
        
        // Draw old
        ctx.drawImage(oldCanvas, -1, 0);
        
        // Clear newly revealed line
        var x = canvas.width - 1;
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(x - 1, 0, 2, canvas.height);
        
        // Draw counter values
        for (var n = 0; n < statistics.counters.length; n++) {
            var counter = statistics.counters[n];
            var v = Math.round(counter.value);
            var pv = Math.round(counter.previousValue);
            var y = canvas.height - v;
            var py = canvas.height - pv;
            ctx.beginPath();
            ctx.moveTo(x - 1 + 0.5, py + 0.5);
            ctx.lineTo(x + 0.5, y + 0.5);
            ctx.strokeStyle = counter.color;
            ctx.stroke();
        }
        
        var displayCtx = this.displayCanvas.getContext("2d");
        displayCtx.drawImage(canvas, 0, 0);
    };


    ui.TimelineView = TimelineView;
})();
