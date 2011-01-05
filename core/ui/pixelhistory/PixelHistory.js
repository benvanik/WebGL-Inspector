(function () {
    var ui = glinamespace("gli.ui");

    var PixelHistory = function (context) {
        var self = this;
        this.context = context;

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=610,innerHeight=600");
        w.document.writeln("<html><head><title>Pixel History</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
        w.focus();

        w.addEventListener("unload", function () {
            if (self.browserWindow) {
                self.browserWindow.closed = true;
                self.browserWindow = null;
            }
            context.ui.pixelHistory = null;
        }, false);

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        } else {
            var targets = [w.document.body, w.document.head, w.document.documentElement];
            for (var n = 0; n < targets.length; n++) {
                var target = targets[n];
                if (target) {
                    var link = w.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = window["gliCssUrl"];
                    target.appendChild(link);
                    break;
                }
            }
        }

        setTimeout(function () {
            self.setup();
        }, 0);
    };

    PixelHistory.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var gl = context;

        // Build UI
        var body = this.browserWindow.document.body;

        var toolbarDiv = document.createElement("div");
        toolbarDiv.className = "pixelhistory-toolbar";
        body.appendChild(toolbarDiv);

        var innerDiv = this.innerDiv = document.createElement("div");
        innerDiv.className = "pixelhistory-inner";
        body.appendChild(innerDiv);
    };

    PixelHistory.prototype.clearPanels = function () {
        this.innerDiv.innerHTML = "";
    };

    PixelHistory.prototype.addPanel = function (gl, frame, call) {
        var doc = this.browserWindow.document;

        var panelOuter = doc.createElement("div");
        panelOuter.className = "pixelhistory-panel-outer";

        var panel = doc.createElement("div");
        panel.className = "pixelhistory-panel";

        var callLine = doc.createElement("div");
        callLine.className = "pixelhistory-call";
        gli.ui.appendCallLine(gl, callLine, frame, call);
        panel.appendChild(callLine);

        panelOuter.appendChild(panel);
        this.innerDiv.appendChild(panelOuter);
        return panel;
    };

    PixelHistory.prototype.addClear = function (gl, frame, call) {
        var panel = this.addPanel(gl, frame, call);

        //
    };

    PixelHistory.prototype.addDraw = function (gl, frame, call) {
        var panel = this.addPanel(gl, frame, call);

        //
    };

    function replaceFragmentShaders(gl, frame) {
        var originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);

        // Find all programs
        var programs = [];
        for (var n = 0; n < frame.resourcesUsed.length; n++) {
            var resource = frame.resourcesUsed[n];
            var typename = glitypename(resource.target);
            if (typename == "WebGLProgram") {
                programs.push(resource.mirror.target);
            }
        }

        function createDummyShader(gl) {
            var shaderSource =
            "precision highp float;" +
            "void main() {" +
            "    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);" +
            "}";

            // Create dummy fragment shader
            var dummyShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(dummyShader, shaderSource);
            gl.compileShader(dummyShader);

            return dummyShader;
        };

        while (gl.getError() != gl.NO_ERROR);

        // Replace all fragment shaders on programs and relink
        for (var n = 0; n < programs.length; n++) {
            var program = programs[n];

            // TODO: get all attribute bindings

            // Remove old fragment shader
            var oldShaders = gl.getAttachedShaders(program);
            var oldShader = null;
            for (var m = 0; m < oldShaders.length; m++) {
                if (gl.getShaderParameter(oldShaders[m], gl.SHADER_TYPE) == gl.FRAGMENT_SHADER) {
                    oldShader = oldShaders[m];
                    break;
                }
            }
            if (!oldShader) {
                // May have been an invalid program
                continue;
            }
            gl.detachShader(program, oldShader);
            var error = gl.getError(); if (error != gl.NO_ERROR) { console.log(error); }

            // Attach new shader
            var dummyShader = createDummyShader(gl);
            gl.attachShader(program, dummyShader);
            var error = gl.getError(); if (error != gl.NO_ERROR) { console.log(error); }
            gl.linkProgram(program);
            var error = gl.getError(); if (error != gl.NO_ERROR) { console.log(error); }
            gl.deleteShader(dummyShader);
            var error = gl.getError(); if (error != gl.NO_ERROR) { console.log(error); }
            gl.useProgram(program);

            var error = gl.getError(); if (error != gl.NO_ERROR) { console.log(error); }

            // TODO: rebind all attributes
        }

        gl.useProgram(originalProgram);
    };

    function emitCall(gl, call) {
        var args = [];
        for (var n = 0; n < call.args.length; n++) {
            args[n] = call.args[n];

            if (args[n]) {
                if (args[n].mirror) {
                    // Translate from resource -> mirror target
                    args[n] = args[n].mirror.target;
                } else if (args[n].sourceUniformName) {
                    // Get valid uniform location on new context
                    args[n] = gl.getUniformLocation(args[n].sourceProgram.mirror.target, args[n].sourceUniformName);
                }
            }
        }

        while (gl.getError() != gl.NO_ERROR);

        // TODO: handle result?
        gl[call.name].apply(gl, args);
        //console.log("call " + call.name);

        var error = gl.getError();
        if (error != gl.NO_ERROR) {
            console.log(error);
        }
    };

    PixelHistory.prototype.inspectPixel = function (frame, x, y) {
        var doc = this.browserWindow.document;

        var width = this.context.canvas.width;
        var height = this.context.canvas.height;

        var readbackCanvas = doc.createElement("canvas");
        readbackCanvas.width = readbackCanvas.height = 1;
        doc.body.appendChild(readbackCanvas);

        function prepareCanvas(canvas) {
            doc.body.appendChild(canvas);
            var gl = null;
            try {
                if (canvas.getContextRaw) {
                    gl = canvas.getContextRaw("experimental-webgl");
                } else {
                    gl = canvas.getContext("experimental-webgl");
                }
            } catch (e) {
                // ?
                alert("Unable to create pixel history canvas: " + e);
            }
            gli.enableAllExtensions(gl);
            gli.hacks.installAll(gl);
            return gl;
        };
        var canvas1 = doc.createElement("canvas");
        var canvas2 = doc.createElement("canvas");
        canvas1.width = width; canvas1.height = height;
        canvas2.width = width; canvas2.height = height;
        var gl1 = prepareCanvas(canvas1);
        var gl2 = prepareCanvas(canvas2);

        // Canvas 1: no texture data, faked fragment shaders - for draw detection
        // Canvas 2: full playback - for color information

        // Prepare canvas 1 and hack all the programs
        frame.makeActive(gl1, true, true);
        replaceFragmentShaders(gl1, frame);

        // Issue all calls, read-back to detect changes, and mark the relevant calls
        var readbackctx = readbackCanvas.getContext("2d");
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            var needReadback = false;
            switch (call.name) {
                case "clear":
                case "drawArrays":
                case "drawElements":
                    needReadback = true;
                    break;
            }

            if (needReadback) {
                // Clear color buffer only (we need depth buffer to be valid)
                var oldColorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
                var oldColorClearValue = gl1.getParameter(gl1.COLOR_CLEAR_VALUE);
                gl1.colorMask(true, true, true, true);
                gl1.clearColor(0, 0, 0, 0);
                gl1.clear(gl1.COLOR_BUFFER_BIT);
                gl1.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
                gl1.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
            }

            // Issue call
            emitCall(gl1, call);

            if (needReadback) {
                // Draw to to readback canvas
                readbackctx.clearRect(0, 0, 1, 1);
                readbackctx.drawImage(canvas1, x, y, 1, 1, 0, 0, 1, 1);
                // Read back the pixel
                var imageData = null;
                try {
                    imageData = readbackctx.getImageData(0, 0, 1, 1);
                } catch (e) {
                    // Likely a security error
                }
                if (imageData) {
                    var r = imageData.data[0];
                    var g = imageData.data[1];
                    var b = imageData.data[2];
                    var a = imageData.data[3];
                    if (r) {
                        console.log("modified");
                    } else {
                        console.log("unmodified");
                    }
                } else {
                    console.log("unable to read back pixel");
                }
            }
        }

        // TODO: cleanup canvas 1 resources
        //doc.body.removeChild(canvas1);

        // Prepare canvas 2
        frame.makeActive(gl2, true);

        this.clearPanels();
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            switch (call.name) {
                case "clear":
                    //this.addClear(gl2, frame, call);
                    emitCall(gl2, call);
                    break;
                case "drawArrays":
                case "drawElements":
                    //this.addDraw(gl2, frame, call);
                    emitCall(gl2, call);
                    break;
                default:
                    // Issue
                    emitCall(gl2, call);
                    break;
            }
        }

        // TODO: cleanup canvas 2 resources
        //doc.body.removeChild(canvas2);

        // Now because we have destroyed everything, we need to rebuild the replay
        var controller = this.context.ui.controller;
        var callIndex = controller.callIndex - 1;
        controller.reset();
        controller.openFrame(frame, true, true);
        controller.stepUntil(callIndex);
    };

    PixelHistory.prototype.focus = function () {
        this.browserWindow.focus();
    };
    PixelHistory.prototype.close = function () {
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        this.context.ui.pixelHistory = null;
    };
    PixelHistory.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    ui.PixelHistory = PixelHistory;
})();
