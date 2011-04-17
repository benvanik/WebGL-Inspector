(function () {
    var controls = glinamespace("gli.ui.controls");

    // options: {
    //     drawGrid: true/false
    // }

    var ZoomView = function ZoomView(parentElement, options) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        if (!options) {
            this.options = {
                drawGrid: true
            };
        } else {
            this.options = {
                drawGrid: options.drawGrid === true
            };
        }

        this.clicked = new gli.util.EventSource("clicked");
        this.mouseMove = new gli.util.EventSource("mouseMove");
        this.mouseOut = new gli.util.EventSource("mouseOut");

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-zoomview");
        parentElement.appendChild(el);

        var canvas = this.canvas = doc.createElement("canvas");
        gli.ui.addClass(canvas, "gli-zoomview-canvas");
        el.appendChild(canvas);

        var inputLayer = this.inputLayer = doc.createElement("div");
        gli.ui.addClass(inputLayer, "gli-zoomview-input");
        el.appendChild(inputLayer);

        {
            var gridImage = doc.createElement("canvas");
            gridImage.width = 16;
            gridImage.height = 16;
            var gridCtx = gridImage.getContext("2d");
            gridCtx.fillStyle = "rgb(255,255,255)";
            gridCtx.fillRect(0, 0, 8, 8);
            gridCtx.fillRect(8, 8, 8, 8);
            gridCtx.fillStyle = "rgb(191,191,191)";
            gridCtx.fillRect(0, 8, 8, 8);
            gridCtx.fillRect(8, 0, 8, 8);
            var ctx = canvas.getContext("2d");
            this.gridPattern = ctx.createPattern(gridImage, "repeat");
        }

        this.setupMouseBindings(inputLayer);

        this.leftMouseDown_ = false;
        this.lastMouseX_ = 0;
        this.lastMouseY_ = 0;
        this.mouseDelta_ = 0;
        this.camera = {
            originX: new Tween(0),
            originY: new Tween(0),
            scale: new Tween(1),
            zoomCenterX: 0,
            zoomCenterY: 0
        };

        this.setCursor(null);

        this.content = null;

        var self = this;
        this.requestAnimationFrameThunk = function requestAnimationFrameThunk() {
            if (self.update()) {
                self.requestRender();
                self.render();
            }
        };
        this.invalidated = false;
        this.invalidate();

        gli.util.setTimeout(function () {
            self.layout();
        }, 0);
    };

    ZoomView.prototype.layout = function layout() {
        var width = this.el.offsetWidth;
        var height = this.el.offsetHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.zoomToFit(false);
        this.render();
    };

    ZoomView.prototype.setContent = function setContent(content) {
        this.content = content;
        this.zoomToFit(false);
        this.render();
    };

    ZoomView.prototype.setupMouseBindings = function setupMouseBindings(inputLayer) {
        var self = this;

        function onmousedown(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            var button = e.button;
            self.onMouseDown(x, y, button);
            e.preventDefault();
            e.stopPropagation();
        };

        function onmouseup(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            var button = e.button;
            self.onMouseUp(x, y, button);
            e.preventDefault();
            e.stopPropagation();
        };

        function onmouseout(e) {
            self.onMouseOut();
            e.preventDefault();
            e.stopPropagation();
        };

        var lastMoveX;
        var lastMoveY;
        function onmousemove(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            if (x === lastMoveX && y === lastMoveY) {
                return;
            }
            lastMoveX = x;
            lastMoveY = y;
            self.onMouseMove(x, y);
            e.preventDefault();
            e.stopPropagation();
        };

        function onmousewheel(e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = e.wheelDelta / 120;
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                var x = e.offsetX;
                var y = e.offsetY;
                if (!isNaN(x) && !isNaN(y)) {
                    self.onMouseWheel(x, y, delta);
                }
            }
            e.preventDefault();
            e.stopPropagation();
        };

        inputLayer.addEventListener("mousedown", onmousedown, false);
        inputLayer.addEventListener("mouseup", onmouseup, false);
        inputLayer.addEventListener("mouseout", onmouseout, false);
        inputLayer.addEventListener("mousemove", onmousemove, false);
        inputLayer.addEventListener("mousewheel", onmousewheel, false);
    };

    ZoomView.prototype.setCursor = function setCursor(cursor) {
        cursor = cursor || "crosshair";
        this.inputLayer.style.cursor = cursor + "  !important";
    };

    ZoomView.prototype.onMouseDown = function mouseDown(x, y, button) {
        //console.log("mouseDown(" + x + ", " + y + ", " + button + ")");

        this.setCursor("pointer");

        this.leftMouseDown_ = (button == 0);
        this.mouseDelta_ = 0;
        this.lastMouseX_ = x;
        this.lastMouseY_ = y;

        this.stop();
    };

    ZoomView.prototype.onMouseUp = function mouseUp(x, y, button) {
        //console.log("mouseUp(" + x + ", " + y + ", " + button + ")");

        this.setCursor(null);

        this.leftMouseDown_ = false;

        if (this.mouseDelta_ < 4) {
            var sceneXY = this.screenToScene(x, y);
            this.clicked.fire(x, y, sceneXY.x, sceneXY.y, button);
        }

        this.mouseDelta_ = 0;
    };

    ZoomView.prototype.onMouseOut = function mouseOut() {
        //console.log("mouseOut()");

        this.setCursor(null);

        this.leftMouseDown_ = false;
        this.mouseDelta_ = 0;
        this.lastMouseX_ = 0;
        this.lastMouseY_ = 0;

        this.mouseOut.fire();
    };

    ZoomView.prototype.onMouseMove = function mouseMove(x, y) {
        console.log("mouseMove(" + x + ", " + y + ")");

        if (this.leftMouseDown_) {
            var originX = this.camera.originX.target;
            var originY = this.camera.originY.target;
            var scale = this.camera.scale.current;
            this.mouseDelta_ += Math.abs(this.lastMouseX_ - x) + Math.abs(this.lastMouseY_ - y);
            var dx = (this.lastMouseX_ - x) / scale;
            var dy = (this.lastMouseY_ - y) / scale;
            if ((dx != 0) || (dy != 0)) {
                this.pan(originX + dx, originY + dy, false);
            }
        } else {
            var sceneXY = this.screenToScene(x, y);
            this.mouseMove.fire(x, y, sceneXY.x, sceneXY.y);
        }

        this.lastMouseX_ = x;
        this.lastMouseY_ = y;
    };

    ZoomView.prototype.onMouseWheel = function mouseWheel(x, y, delta) {
        //console.log("mouseWheel(" + x + ", " + y + ", " + delta + ")");

        var newScale = this.camera.scale.current;
        if (delta > 0) {
            newScale *= 2.5;
        } else {
            newScale /= 4.0;
        }
        this.zoomAboutPoint(x, y, newScale);
    };

    ZoomView.prototype.invalidate = function invalidate() {
        this.invalidated = true;
        this.requestRender();
    };

    ZoomView.prototype.requestRender = function requestRender() {
        gli.util.requestAnimationFrame(this.requestAnimationFrameThunk, this.canvas);
    };

    ZoomView.prototype.sceneToScreen = function sceneToScreen(x, y) {
        return {
            x: (x - this.camera.originX.current) * this.camera.scale.current,
            y: (y - this.camera.originY.current) * this.camera.scale.current
        };
    };

    ZoomView.prototype.screenToScene = function screenToScene(x, y) {
        return {
            x: this.camera.originX.current + (x / this.camera.scale.current),
            y: this.camera.originY.current + (y / this.camera.scale.current)
        };
    };

    ZoomView.prototype.stop = function stop() {
        this.stopPan();
        this.stopZoom();
    };

    ZoomView.prototype.stopPan = function stopPan() {
        this.camera.originX.stop();
        this.camera.originY.stop();
    };

    ZoomView.prototype.stopZoom = function stopZoom() {
        this.camera.scale.stop();
    };

    var kAnimationTimeScale = 2;

    ZoomView.prototype.zoomToFit = function zoomToFit(animated) {
        if (this.content) {
            this.zoomToBounds(0, 0, this.content.width, this.content.height, animated);
        } else {
            // ?
        }
    };

    ZoomView.prototype.zoomToBounds = function zoomToBounds(x, y, w, h, animated) {
        animated = (animated !== undefined) ? animated : true;

        this.stop();

        var canvasWidth = this.canvas.width;
        var canvasHeight = this.canvas.height;

        var targetWidth;
        var targetHeight;
        var boundsRatio = w / h;
        if (canvasWidth >= canvasHeight) {
            targetWidth = canvasWidth;
            targetHeight = targetWidth / boundsRatio;
            if (targetHeight > canvasHeight) {
                targetHeight = canvasHeight;
                targetWidth = targetHeight * boundsRatio;
            }
        } else {
            targetHeight = canvasHeight;
            targetWidth = targetHeight * boundsRatio;
            if (targetWidth > canvasWidth) {
                targetWidth = canvasWidth;
                targetHeight = targetWidth / boundsRatio;
            }
        }

        var scaleX = canvasWidth / w;
        var scaleY = canvasHeight / h;
        var newScale = Math.min(scaleX, scaleY);
        var x = ((canvasWidth / 2) - (targetWidth / 2)) / newScale - x;
        var y = ((canvasHeight / 2) - (targetHeight / 2)) / newScale - y;

        if (animated) {
            var currentScale = this.camera.scale.current;
            if (Math.abs(1 - (newScale / currentScale)) < 0.1) {
                this.pan(-x, -y, animated);
            } else {
                var addToPanX = -x - this.camera.originX.current;
                var addToPanY = -y - this.camera.originY.current;
                var multiplier = (currentScale * newScale) / (newScale - currentScale);
                var distanceX = addToPanX * multiplier;
                var distanceY = addToPanY * multiplier;

                this.camera.zoomCenterX = distanceX + canvasWidth / 2;
                this.camera.zoomCenterY = distanceY + canvasHeight / 2;

                this.camera.originX.stop();
                this.camera.originY.stop();
                this.camera.scale.animate(newScale, kAnimationTimeScale);
            }
        } else {
            this.camera.originX.set(-x);
            this.camera.originY.set(-y);
            this.camera.scale.set(newScale);
        }

        this.requestRender();
    };

    ZoomView.prototype.setCamera = function setCamera(x, y, scale, animated) {
        animated = (animated !== undefined) ? animated : true;

        if (animated) {
            if ((x != this.camera.originX.current) || (y != this.camera.originY.current)) {
                this.camera.originX.animate(x, kAnimationTimeScale);
                this.camera.originY.animate(y, kAnimationTimeScale);
            }
            if (scale != this.camera.scale.target) {
                this.camera.scale.animate(scale, kAnimationTimeScale);
            }
        } else {
            this.camera.originX.set(x);
            this.camera.originY.set(y);
            this.camera.scale.set(scale);
        }

        this.requestRender();
    };

    ZoomView.prototype.pan = function pan(x, y, animated) {
        animated = (animated !== undefined) ? animated : true;

        this.stopZoom();

        if (animated) {
            if ((x != this.camera.originX.current) || (y != this.camera.originY.current)) {
                this.camera.originX.animate(x, kAnimationTimeScale);
                this.camera.originY.animate(y, kAnimationTimeScale);
            }
        } else {
            this.camera.originX.set(x);
            this.camera.originY.set(y);
        }

        this.requestRender();
    };

    ZoomView.prototype.zoomAboutPoint = function zoomAboutPoint(x, y, newScale, animated) {
        animated = (animated !== undefined) ? animated : true;
        x = (x !== undefined) ? x : this.canvas.width / 2;
        y = (y !== undefined) ? y : this.canvas.height / 2;

        this.stopPan();

        if (animated) {
            this.camera.scale.animate(newScale, kAnimationTimeScale);
            this.camera.zoomCenterX = x + this.canvas.width / 2;
            this.camera.zoomCenterY = y + this.canvas.height / 2;
        } else {
            var originX = this.camera.originX.current;
            var originY = this.camera.originY.current;
            var currentScale = this.camera.scale.current;
            originX = originX + (x / currentScale) - (x / newScale);
            originY = originY + (y / currentScale) - (y / newScale);

            this.camera.originX.set(originX);
            this.camera.originY.set(originY);
            this.camera.scale.set(newScale);
        }

        this.requestRender();
    };

    ZoomView.prototype.update = function update() {
        var time = (new Date()).getTime();
        var changing = this.invalidated;
        this.invalidated = false;

        var frameCenterX = this.canvas.width / 2;
        var frameCenterY = this.canvas.height / 2;
        {
            var oldZoomDistanceX = this.camera.zoomCenterX - frameCenterX;
            var oldZoomDistanceY = this.camera.zoomCenterY - frameCenterY;
            var newZoomDistanceX = oldZoomDistanceX;
            var newZoomDistanceY = oldZoomDistanceY;
            oldZoomDistanceX /= this.camera.scale.current;
            oldZoomDistanceY /= this.camera.scale.current;

            changing = this.camera.scale.update(time) || changing;
            if (!changing) {
                this.camera.zoomCenterX = frameCenterX;
                this.camera.zoomCenterY = frameCenterY;
            }

            newZoomDistanceX /= this.camera.scale.current;
            newZoomDistanceY /= this.camera.scale.current;
            var addToPanX = oldZoomDistanceX - newZoomDistanceX;
            var addToPanY = oldZoomDistanceY - newZoomDistanceY;
            this.camera.originX.current += addToPanX;
            this.camera.originY.current += addToPanY;
            this.camera.originX.target += addToPanX;
            this.camera.originY.target += addToPanY;
        }

        changing = this.camera.originX.update(time) || changing;
        changing = this.camera.originY.update(time) || changing;

        return changing;
    };

    ZoomView.prototype.render = function render() {
        var xy = this.sceneToScreen(0, 0);
        var scale = this.camera.scale.current;

        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var content = this.content;
        if (!content) {
            return;
        }

        ctx.save();
        ctx.transform(scale, 0, 0, scale, xy.x, xy.y);

        if (this.options.drawGrid && this.gridPattern) {
            ctx.fillStyle = this.gridPattern;
            ctx.fillRect(0, 0, content.width, content.height);
        }

        ctx.drawImage(content, 0, 0);

        ctx.restore();
    };

    var kTweenConstant = 0.0018;
    var kDamperConstant = 0.6;
    var kEqualThreshold = 0.0001;
    var Tween = function Tween(value) {
        this.target = value;
        this.current = value;
        this.velocity = 0;
        this.lastTime = null;
        this.dirty = true;
    };
    Tween.prototype.set = function set(value) {
        this.target = value;
        this.current = value;
        this.velocity = 0;
        this.lastTime = null;
        this.dirty = true;
    };
    Tween.prototype.animate = function animate(value, timeScale) {
        this.target = value;
        this.timeScale = timeScale;
        if (!this.dirty) {
            this.velocity = 0;
            this.lastTime = null;
        }
        this.dirty = true;
    };
    Tween.prototype.stop = function stop() {
        this.set(this.current);
    };
    Tween.prototype.update = function update(time) {
        if (!this.dirty) {
            return false;
        }
        if (this.current == this.target) {
            this.dirty = false;
            this.lastTime = null;
            return true;
        }
        if (this.lastTime === null) {
            this.lastTime = time;
            return true;
        }

        var dt = (time - this.lastTime) * this.timeScale;
        if (dt <= 0) {
            return true;
        }

        // Spring logic
        var diff = this.current - this.target;
        this.velocity += -kTweenConstant * diff - kDamperConstant * this.velocity;
        var delta = this.velocity * dt;

        // Clamp
        var maxDelta = -diff;
        if (((delta > 0) && (maxDelta > 0) && (maxDelta < delta)) ||
            ((delta < 0) && (maxDelta < 0) && (maxDelta > delta))) {
            delta = maxDelta;
            this.velocity = 0;
        }

        this.current += delta;

        // Check for completion
        if ((Math.abs(this.target - this.current) < kEqualThreshold) &&
            (Math.abs(delta) < kEqualThreshold)) {
            this.current = this.target;
            this.lastTime = null;
            this.dirty = false;
        } else {
            this.lastTime = time;
        }

        return true;
    };

    controls.ZoomView = ZoomView;

})();
