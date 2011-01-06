(function () {
    var ui = glinamespace("gli.ui");

    var PixelHistory = function (context) {
        var self = this;
        this.context = context;

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=926,innerHeight=600");
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

    PixelHistory.prototype.clear = function () {
        this.clearPanels();
    };

    PixelHistory.prototype.clearPanels = function () {
        this.innerDiv.scrollTop = 0;
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
        gli.ui.appendCallLine(this.context, callLine, frame, call);
        panel.appendChild(callLine);

        function addColor(doc, colorsLine, colorMask, name, canvas, subscript) {
            // Label
            // Canvas
            // rgba(r, g, b, a)

            var div = doc.createElement("div");
            div.className = "pixelhistory-color";

            var labelSpan = doc.createElement("span");
            labelSpan.className = "pixelhistory-color-label";
            labelSpan.innerHTML = name;
            div.appendChild(labelSpan);

            canvas.className = "gli-reset pixelhistory-color-canvas";
            div.appendChild(canvas);

            var rgba = getPixelRGBA(canvas.getContext("2d"));
            if (rgba) {
                var rgbaSpan = doc.createElement("span");
                rgbaSpan.className = "pixelhistory-color-rgba";
                var rv = Math.floor(rgba[0] * 255);
                var gv = Math.floor(rgba[1] * 255);
                var bv = Math.floor(rgba[2] * 255);
                var av = Math.floor(rgba[3] * 255);
                if (!colorMask[0]) {
                    rv = "<strike>" + rv + "</strike>";
                }
                if (!colorMask[1]) {
                    gv = "<strike>" + gv + "</strike>";
                }
                if (!colorMask[2]) {
                    bv = "<strike>" + bv + "</strike>";
                }
                if (!colorMask[3]) {
                    av = "<strike>" + av + "</strike>";
                }
                var subscripthtml = "<sub>" + subscript + "</sub>";
                rgbaSpan.innerHTML =
                    "R" + subscripthtml + ": " + rv + "<br/>" +
                    "G" + subscripthtml + ": " + gv + "<br/>" +
                    "B" + subscripthtml + ": " + bv + "<br/>" +
                    "A" + subscripthtml + ": " + av;
                div.appendChild(rgbaSpan);
            }

            colorsLine.appendChild(div);
        };

        var colorsLine = doc.createElement("div");
        colorsLine.className = "pixelhistory-colors";
        addColor(doc, colorsLine, call.history.colorMask, "Source", call.history.self, "s");
        addColor(doc, colorsLine, [true, true, true, true], "Dest", call.history.pre, "d");
        addColor(doc, colorsLine, [true, true, true, true], "Result", call.history.post, "r");

        if (call.history.blendEnabled) {
            var letters = ["R", "G", "B", "A"];
            function genBlendString(index) {
                var letter = letters[index];
                var rgba_pre = getPixelRGBA(call.history.pre.getContext("2d"));
                var rgba_self = getPixelRGBA(call.history.self.getContext("2d"));
                var rgba_post = getPixelRGBA(call.history.post.getContext("2d"));
                var blendColor = call.history.blendColor[index];
                var blendEqu;
                var blendSrc;
                var blendDst;
                switch (index) {
                    case 0:
                    case 1:
                    case 2:
                        blendEqu = call.history.blendEquRGB;
                        blendSrc = call.history.blendSrcRGB;
                        blendDst = call.history.blendDstRGB;
                        break;
                    case 3:
                        blendEqu = call.history.blendEquAlpha;
                        blendSrc = call.history.blendSrcAlpha;
                        blendDst = call.history.blendDstAlpha;
                        break;
                }
                function genFactor(factor) {
                    switch (factor) {
                        case gl.ZERO:
                            return ["0", 0];
                        case gl.ONE:
                            return ["1", 1];
                        case gl.SRC_COLOR:
                            return [letter + "<sub>s</sub>", rgba_self[index]];
                        case gl.ONE_MINUS_SRC_COLOR:
                            return ["1 - " + letter + "<sub>s</sub>", 1 - rgba_self[index]];
                        case gl.DST_COLOR:
                            return [letter + "<sub>d</sub>", rgba_pre[index]];
                        case gl.ONE_MINUS_DST_COLOR:
                            return ["1 - " + letter + "<sub>d</sub>", 1 - rgba_pre[index]];
                        case gl.SRC_ALPHA:
                            return ["A<sub>s</sub>", rgba_self[3]];
                        case gl.ONE_MINUS_SRC_ALPHA:
                            return ["1 - A<sub>s</sub>", 1 - rgba_self[3]];
                        case gl.DST_ALPHA:
                            return ["A<sub>d</sub>", rgba_pre[3]];
                        case gl.ONE_MINUS_DST_ALPHA:
                            return ["1 - A<sub>d</sub>", 1 - rgba_pre[3]];
                        case gl.CONSTANT_COLOR:
                            return [letter + "<sub>c</sub>", blendColor[index]];
                        case gl.ONE_MINUS_CONSTANT_COLOR:
                            return ["1 - " + letter + "<sub>c</sub>", 1 - blendColor[index]];
                        case gl.CONSTANT_ALPHA:
                            return ["A<sub>c</sub>", blendColor[3]];
                        case gl.ONE_MINUS_CONSTANT_ALPHA:
                            return ["1 - A<sub>c</sub>", 1 - blendColor[3]];
                        case gl.SRC_ALPHA_SATURATE:
                            if (index == 3) {
                                return ["1", 1];
                            } else {
                                return ["i", Math.min(rgba_self[3], 1 - rgba_pre[3])];
                            }
                    }
                };
                var sfactor = genFactor(blendSrc);
                var dfactor = genFactor(blendDst);
                var s = letter + "<sub>s</sub>(" + sfactor[0] + ")";
                var d = letter + "<sub>d</sub>(" + dfactor[0] + ")";
                function fixFloat(n) {
                    var f = Math.round(n * 10000) / 10000;
                    var s = String(f);
                    if (s.length == 1) {
                        s += ".0000";
                    }
                    while (s.length < 6) {
                        s += "0";
                    }
                    return s;
                };
                var ns = fixFloat(rgba_self[index]) + "(" + fixFloat(sfactor[1]) + ")";
                var nd = fixFloat(rgba_pre[index]) + "(" + fixFloat(dfactor[1]) + ")";
                var largs = ["s", "d"];
                var args = [s, d];
                var nargs = [ns, nd];
                var equstr = "";
                switch (blendEqu) {
                    case gl.FUNC_ADD:
                        equstr = "+";
                        break;
                    case gl.FUNC_SUBTRACT:
                        equstr = "-";
                        break;
                    case gl.FUNC_REVERSE_SUBTRACT:
                        equstr = "-";
                        largs = ["d", "s"];
                        args = [d, s];
                        nargs = [nd, ns];
                        break;
                }
                var str = "";
                str +=
                    letter + "<sub>r</sub> = " +
                    args[0] + " " + equstr + " " + args[1];
                var nstr = "";
                nstr +=
                    fixFloat(rgba_post[index]) + " = " +
                    nargs[0] + "&nbsp;" + equstr + "&nbsp;" + nargs[1] + "<sub>&nbsp;</sub>"; // last sub for line height fix
                return [str, nstr];
            };
            var rs = genBlendString(0);
            var gs = genBlendString(1);
            var bs = genBlendString(2);
            var as = genBlendString(3);
            var blendingLine2 = doc.createElement("div");
            blendingLine2.className = "pixelhistory-blending pixelhistory-blending-equ";
            blendingLine2.innerHTML = rs[0] + "<br/>" + gs[0] + "<br/>" + bs[0] + "<br/>" + as[0];
            colorsLine.appendChild(blendingLine2);
            var blendingLine1 = doc.createElement("div");
            blendingLine1.className = "pixelhistory-blending pixelhistory-blending-values";
            blendingLine1.innerHTML = rs[1] + "<br/>" + gs[1] + "<br/>" + bs[1] + "<br/>" + as[1];
            colorsLine.appendChild(blendingLine1);
        } else {
            var blendingLine = doc.createElement("div");
            blendingLine.className = "pixelhistory-blending";
            blendingLine.innerHTML = "blending disabled";
            colorsLine.appendChild(blendingLine);
        }

        var clearDiv = doc.createElement("div");
        clearDiv.style.clear = "both";
        colorsLine.appendChild(clearDiv);

        panel.appendChild(colorsLine);

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
        var allPrograms = frame.getResourcesUsedOfType("WebGLProgram");
        var programs = [];
        for (var n = 0; n < allPrograms.length; n++) {
            var resource = allPrograms[n];
            programs.push(resource.mirror.target);
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

            // Attach new shader
            var dummyShader = createDummyShader(gl);
            gl.attachShader(program, dummyShader);
            gl.linkProgram(program);
            gl.deleteShader(dummyShader);
            gl.useProgram(program);

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

        //while (gl.getError() != gl.NO_ERROR);

        // TODO: handle result?
        gl[call.name].apply(gl, args);
        //console.log("call " + call.name);

        //var error = gl.getError();
        //if (error != gl.NO_ERROR) {
        //    console.log(error);
        //}
    };

    function clearColorBuffer(gl) {
        var oldColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
        var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        gl.colorMask(true, true, true, true);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
        gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
    };

    function getPixelRGBA(ctx) {
        var imageData = null;
        try {
            imageData = ctx.getImageData(0, 0, 1, 1);
        } catch (e) {
            // Likely a security error
        }
        if (imageData) {
            var r = imageData.data[0] / 255.0;
            var g = imageData.data[1] / 255.0;
            var b = imageData.data[2] / 255.0;
            var a = imageData.data[3] / 255.0;
            return [r, g, b, a];
        } else {
            console.log("unable to read back pixel");
            return null;
        }
    };

    function readbackRGBA(canvas, gl, x, y) {
        // NOTE: this call may fail due to security errors
        var pixel = new Uint8Array(4);
        try {
            gl.readPixels(x, canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return pixel;
        } catch (e) {
            console.log("unable to read back pixel");
            return null;
        }
    };

    function readbackPixel(canvas, gl, doc, x, y) {
        var readbackCanvas = doc.createElement("canvas");
        readbackCanvas.width = readbackCanvas.height = 1;
        var frag = doc.createDocumentFragment();
        frag.appendChild(readbackCanvas);
        var ctx = readbackCanvas.getContext("2d");

        // First attempt to read the pixel the fast way
        var pixel = readbackRGBA(canvas, gl, x, y);
        if (pixel) {
            // Fast - write to canvas and return
            var imageData = ctx.createImageData(1, 1);
            imageData.data[0] = pixel[0];
            imageData.data[1] = pixel[1];
            imageData.data[2] = pixel[2];
            imageData.data[3] = pixel[3];
            ctx.putImageData(imageData, 0, 0);
        } else {
            // Slow - blit entire canvas
            ctx.clearRect(0, 0, 1, 1);
            ctx.drawImage(canvas, x, y, 1, 1, 0, 0, 1, 1);
        }

        return readbackCanvas;
    };

    function gatherInterestingResources(gl, resourcesUsed) {
        var markResourceUsed = null;
        markResourceUsed = function (resource) {
            if (resourcesUsed.indexOf(resource) == -1) {
                resourcesUsed.push(resource);
            }
            if (resource.getDependentResources) {
                var dependentResources = resource.getDependentResources();
                for (var n = 0; n < dependentResources.length; n++) {
                    markResourceUsed(dependentResources[n]);
                }
            }
        };

        var currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        if (currentProgram) {
            markResourceUsed(currentProgram.trackedObject);
        }

        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            var tex2d = gl.getParameter(gl.TEXTURE_BINDING_2D);
            if (tex2d) {
                markResourceUsed(tex2d.trackedObject);
            }
            var texCube = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
            if (texCube) {
                markResourceUsed(texCube.trackedObject);
            }
        }
        gl.activeTexture(originalActiveTexture);

        var indexBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (indexBuffer) {
            markResourceUsed(indexBuffer.trackedObject);
        }

        var vertexBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        if (vertexBuffer) {
            markResourceUsed(vertexBuffer.trackedObject);
        }
        var maxVertexAttrs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttrs; n++) {
            vertexBuffer = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
            if (vertexBuffer) {
                markResourceUsed(vertexBuffer.trackedObject);
            }
        }
    };

    PixelHistory.prototype.inspectPixel = function (frame, x, y, locationString) {
        var doc = this.browserWindow.document;
        doc.title = "Pixel History: " + locationString;

        var width = this.context.canvas.width;
        var height = this.context.canvas.height;

        // Cleanup the controller - we are about to mess it up
        // Stash off the current call index first, though, so we can restore it later
        var controller = this.context.ui.controller;
        var callIndex = controller.callIndex - 1;
        controller.reset(true);

        function prepareCanvas(canvas) {
            var frag = doc.createDocumentFragment();
            frag.appendChild(canvas);
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
        frame.makeActive(gl1, true, {
            ignoreTextureUploads: true,
            ignoreLinkProgram: true
        });
        replaceFragmentShaders(gl1, frame);

        // Issue all calls, read-back to detect changes, and mark the relevant calls
        var writeCalls = [];
        var resourcesUsed = [];
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            var needReadback = false;
            switch (call.name) {
                case "clear":
                    // Only deal with clears that affect the color buffer
                    if (call.args[0] & gl1.COLOR_BUFFER_BIT) {
                        needReadback = true;
                    }
                    break;
                case "drawArrays":
                case "drawElements":
                    needReadback = true;
                    break;
            }
            // If the current framebuffer is not the default one, skip the call
            // TODO: support pixel history on other framebuffers?
            if (gl1.getParameter(gl1.FRAMEBUFFER_BINDING)) {
                needReadback = false;
            }

            if (needReadback) {
                // Clear color buffer only (we need depth buffer to be valid)
                clearColorBuffer(gl1);
            }

            var originalBlendEnable = null;
            var originalColorMask = null;
            var unmungedColorClearValue = null;
            if (needReadback) {
                // Disable blending during draws
                originalBlendEnable = gl1.isEnabled(gl1.BLEND);
                gl1.disable(gl1.BLEND);

                // Enable all color channels to get fragment output
                originalColorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
                gl1.colorMask(true, true, true, true);

                // Clear calls get munged so that we make sure we can see their effects
                if (call.name == "clear") {
                    unmungedColorClearValue = gl1.getParameter(gl1.COLOR_CLEAR_VALUE);
                    gl1.clearColor(1, 1, 1, 1);
                }
            }

            // Issue call
            emitCall(gl1, call);

            if (needReadback) {
                // Restore blend mode
                if (originalBlendEnable != null) {
                    if (originalBlendEnable) {
                        gl1.enable(gl1.BLEND);
                    } else {
                        gl1.disable(gl1.BLEND);
                    }
                }

                // Restore color mask
                if (originalColorMask) {
                    gl1.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
                }

                // Restore clear color
                if (unmungedColorClearValue) {
                    gl1.clearColor(unmungedColorClearValue[0], unmungedColorClearValue[1], unmungedColorClearValue[2], unmungedColorClearValue[3]);
                }
            }

            if (needReadback) {
                var rgba = readbackRGBA(canvas1, gl1, x, y);
                if (rgba) {
                    if (rgba[0] || rgba[1] || rgba[2] || rgba[3]) {
                        // Call had an effect!
                        call.history = {};
                        call.history.colorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
                        call.history.blendEnabled = gl1.isEnabled(gl1.BLEND);
                        call.history.blendEquRGB = gl1.getParameter(gl1.BLEND_EQUATION_RGB);
                        call.history.blendEquAlpha = gl1.getParameter(gl1.BLEND_EQUATION_ALPHA);
                        call.history.blendSrcRGB = gl1.getParameter(gl1.BLEND_SRC_RGB);
                        call.history.blendSrcAlpha = gl1.getParameter(gl1.BLEND_SRC_ALPHA);
                        call.history.blendDstRGB = gl1.getParameter(gl1.BLEND_DST_RGB);
                        call.history.blendDstAlpha = gl1.getParameter(gl1.BLEND_DST_ALPHA);
                        call.history.blendColor = gl1.getParameter(gl1.BLEND_COLOR);
                        writeCalls.push(call);

                        // Stash off a bunch of useful resources
                        gatherInterestingResources(gl1, resourcesUsed);
                    }
                }
            }
        }

        // TODO: cleanup canvas 1 resources
        frame.cleanup(gl1);
        canvas1.parentNode.removeChild(canvas1);

        // Find resources that were not used so we can exclude them
        var exclusions = [];
        // TODO: better search
        for (var n = 0; n < frame.resourcesUsed.length; n++) {
            var resource = frame.resourcesUsed[n];
            var typename = glitypename(resource.target);
            switch (typename) {
                case "WebGLTexture":
                case "WebGLProgram":
                case "WebGLShader":
                case "WebGLBuffer":
                    if (resourcesUsed.indexOf(resource) == -1) {
                        // Not used - exclude
                        exclusions.push(resource);
                    }
                    break;
            }
        }

        // Prepare canvas 2 for pulling out individual contribution
        frame.makeActive(gl2, true, null, exclusions);

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var isWrite = writeCalls.indexOf(call) >= 0;

            // Ignore things that don't affect this pixel
            var ignore = false;
            if (!isWrite) {
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        ignore = true;
                        break;
                }
            }
            if (ignore) {
                continue;
            }

            var originalBlendEnable = null;
            var originalColorMask = null;
            if (isWrite) {
                // Clear color buffer only (we need depth buffer to be valid)
                clearColorBuffer(gl2);

                // Disable blending during draws
                originalBlendEnable = gl2.isEnabled(gl2.BLEND);
                gl2.disable(gl2.BLEND);

                // Enable all color channels to get fragment output
                originalColorMask = gl2.getParameter(gl2.COLOR_WRITEMASK);
                gl2.colorMask(true, true, true, true);
            }

            emitCall(gl2, call);

            if (isWrite) {
                // Restore blend mode
                if (originalBlendEnable != null) {
                    if (originalBlendEnable) {
                        gl2.enable(gl2.BLEND);
                    } else {
                        gl2.disable(gl2.BLEND);
                    }
                }

                // Restore color mask
                if (originalColorMask) {
                    gl2.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
                }
            }

            if (isWrite) {
                // Read back the written fragment color
                call.history.self = readbackPixel(canvas2, gl2, doc, x, y);
            }
        }

        // Prepare canvas 2 for pulling out blending before/after
        canvas2.width = 1; canvas2.width = width;
        frame.cleanup(gl2);
        frame.makeActive(gl2, true, null, exclusions);

        this.clearPanels();
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var isWrite = writeCalls.indexOf(call) >= 0;

            // Ignore things that don't affect this pixel
            var ignore = false;
            if (!isWrite) {
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        ignore = true;
                        break;
                }
            }
            if (ignore) {
                continue;
            }

            if (isWrite) {
                // Read prior color
                call.history.pre = readbackPixel(canvas2, gl2, doc, x, y);
            }

            emitCall(gl2, call);

            if (isWrite) {
                // Read new color
                call.history.post = readbackPixel(canvas2, gl2, doc, x, y);
            }

            if (isWrite) {
                switch (call.name) {
                    case "clear":
                        this.addClear(gl2, frame, call);
                        break;
                    case "drawArrays":
                    case "drawElements":
                        this.addDraw(gl2, frame, call);
                        break;
                }
            }
        }

        // TODO: cleanup canvas 2 resources
        frame.cleanup(gl2);
        canvas2.parentNode.removeChild(canvas2);

        // Now because we have destroyed everything, we need to rebuild the replay
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
