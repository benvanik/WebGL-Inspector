(function () {
    var ui = glinamespace("gli.ui");
    
    var FrameListing = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            list: w.root.getElementsByClassName("frames-listing")[0]
        };

        this.frames = [];

        this.previousSelection = null;
    };

    FrameListing.prototype.appendFrame = function (frame) {
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
        canvas.width = 80;
        canvas.height = frame.screenshot.height / frame.screenshot.width * 80;

        // Draw the data - hacky, but easiest?
        var ctx2d = canvas.getContext("2d");
        ctx2d.drawImage(frame.screenshot, 0, 0, canvas.width, canvas.height);

        el.appendChild(canvas);

        var number = document.createElement("div");
        number.className = "frame-item-number";
        number.innerHTML = frame.frameNumber;
        el.appendChild(number);

        this.elements.list.appendChild(el);

        el.onclick = function () {
            self.selectFrame(frame);
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

        if (this.previousSelection) {
            var el = this.previousSelection.element;
            el.className = el.className.replace(" frame-item-selected", "");
            this.previousSelection = null;
        }

        var frameObj = null;
        for (var n = 0; n < this.frames.length; n++) {
            if (this.frames[n].frame == frame) {
                frameObj = this.frames[n];
                break;
            }
        }
        this.previousSelection = frameObj;
        frameObj.element.className += " frame-item-selected";

        frame.uielement.scrollIntoViewIfNeeded();
        this.window.traceView.setFrame(frame);
        //this.window.stateHUD.showState(frame.initialState);
    };

    ui.FrameListing = FrameListing;
})();
