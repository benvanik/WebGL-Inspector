(function () {
    
    var FrameListing = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            list: w.root.getElementsByClassName("frames-listing")[0]
        };

        this.frames = [];
    };

    FrameListing.prototype.addFrame = function (frame) {
        var self = this;

        // <div class="frame-item">
        //     <canvas class="frame-item-preview" width="30" height="30">
        //     </canvas>
        //     <span class="frame-item-number">1234 </span>
        // </div>

        var el = document.createElement("div");
        el.className = "frame-item";

        var canvas = document.createElement("canvas");
        canvas.className = "frame-item-preview";
        canvas.width = "30";
        canvas.height = "30";
        el.appendChild(canvas);

        var number = document.createElement("number");
        number.className = "frame-item-number";
        number.innerHTML = frame.frameNumber;
        el.appendChild(number);

        this.elements.list.appendChild(el);

        el.onclick = function () {
            self.window.traceView.setFrame(frame);
            el.scrollIntoViewIfNeeded(true);
        };

        this.frames.push({
            frame: frame,
            element: el
        });
        frame.uielement = el;
    };

    FrameListing.prototype.removeFrame = function (frame) {
    };

    FrameListing.prototype.selectFrame = function (frame) {
        // TODO: clear previous selection
        frame.uielement.scrollIntoViewIfNeeded();
        this.window.traceView.setFrame(frame);
    };

    gli.ui = gli.ui || {};
    gli.ui.FrameListing = FrameListing;

})();
