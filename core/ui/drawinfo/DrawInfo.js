(function () {
    var ui = glinamespace("gli.ui");

    var DrawInfo = function (context, name) {
        glisubclass(gli.ui.PopupWindow, this, [context, name, "Draw Info", 610, 600]);
    };

    DrawInfo.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var doc = this.browserWindow.document;
        var gl = context;

        // TODO: toolbar buttons/etc
        
        // TODO: move to shared code
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
        this.canvas = doc.createElement("canvas");
        this.gl = prepareCanvas(this.canvas);
    };

    DrawInfo.prototype.dispose = function () {
        this.canvas = null;
        this.gl = null;
    };

    DrawInfo.prototype.clear = function () {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info";
        this.elements.innerDiv.innerHTML = "";
    };
    
    function appendClear(doc, el) {
        var clearDiv = doc.createElement("div");
        clearDiv.style.clear = "both";
        el.appendChild(clearDiv);
    };
    
    DrawInfo.prototype.addCallInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        
        var panel = this.buildPanel();
        
        // Call line
        var callLine = doc.createElement("div");
        callLine.className = "drawinfo-call";
        gli.ui.appendCallLine(this.context, callLine, frame, call);
        panel.appendChild(callLine);
        
        // ELEMENT_ARRAY_BUFFER (if an indexed call)
        if (call.name == "drawElements") {
            var elementArrayLine = doc.createElement("div");
            elementArrayLine.className = "drawinfo-elementarray trace-call-line";
            elementArrayLine.style.paddingLeft = "42px !important";
            elementArrayLine.innerHTML = "ELEMENT_ARRAY_BUFFER: "
            gli.ui.appendObjectRef(this.context, elementArrayLine, drawInfo.args.elementArrayBuffer);
            panel.appendChild(elementArrayLine);
            appendClear(doc, panel);
        }
        
        // Previews
        var previewsLine = doc.createElement("div");
        previewsLine.className = "drawinfo-previews";
        
        // TODO: preview canvases
        previewsLine.innerHTML = "TODO: preview canvases";
        
        appendClear(doc, previewsLine);
        panel.appendChild(previewsLine);
    };
    
    DrawInfo.prototype.addProgramInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        
        var panel = this.buildPanel();
        
        // Name
        var programLine = doc.createElement("div");
        programLine.className = "drawinfo-program trace-call-line";
        programLine.innerHTML = "<b>Program</b>: ";
        gli.ui.appendObjectRef(this.context, programLine, drawInfo.program);
        panel.appendChild(programLine);
        appendClear(doc, panel);
        
        // Uniforms
        
        // Vertex attribs
    };
    
    DrawInfo.prototype.addBlendingInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        
        var panel = this.buildPanel();
        
        //
    };
    
    DrawInfo.prototype.captureDrawInfo = function (frame, call) {
        var gl = this.gl;
        
        var drawInfo = {
            args: {
                mode: 0,
                elementArrayBuffer: null,
                elementArrayType: 0,
                first: 0,
                offset: 0,
                count: 0
            },
            program: null,
            uniformInfos: [],
            attribInfos: [],
            state: null
        };
        
        // Args
        switch (call.name) {
            case "drawArrays":
                drawInfo.args.mode = call.args[0];
                drawInfo.args.first = call.args[1];
                drawInfo.args.count = call.args[2];
                break;
            case "drawElements":
                drawInfo.args.mode = call.args[0];
                drawInfo.args.count = call.args[1];
                drawInfo.args.elementArrayType = call.args[2];
                drawInfo.args.offset = call.args[3];
                var glelementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
                drawInfo.args.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
                break;
        }
        
        // Program
        var glprogram = gl.getParameter(gl.CURRENT_PROGRAM);
        drawInfo.program = glprogram ? glprogram.trackedObject : null;
        if (glprogram) {
            drawInfo.uniformInfos = drawInfo.program.getUniformInfos(gl, glprogram);
            drawInfo.attribInfos = drawInfo.program.getAttribInfos(gl, glprogram);
        }
        
        // Capture entire state for blend mode/etc
        drawInfo.state = new gli.host.StateSnapshot(gl);
        
        return drawInfo;
    };

    DrawInfo.prototype.inspectDrawCall = function (frame, drawCall) {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info: #" + drawCall.ordinal + " " + drawCall.name;
        
        this.elements.innerDiv.innerHTML = "";
        
        // Prep canvas
        var width = frame.canvasInfo.width;
        var height = frame.canvasInfo.height;
        this.canvas.width = width;
        this.canvas.height = height;
        var gl = this.gl;

        // Prepare canvas
        frame.switchMirrors("drawinfo");
        frame.makeActive(gl, true, {
            ignoreTextureUploads: true
        });
        
        // Issue all calls (minus the draws we don't care about) and stop at our draw
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            
            if (call == drawCall) {
                // Call we want
            } else {
                // Skip other draws/etc
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        continue;
                }
            }
            
            call.emit(gl);
            
            if (call == drawCall) {
                break;
            }
        }

        // Capture interesting draw info
        var drawInfo = this.captureDrawInfo(frame, drawCall);
        
        this.addCallInfo(frame, drawCall, drawInfo);
        this.addProgramInfo(frame, drawCall, drawInfo);
        this.addBlendingInfo(frame, drawCall, drawInfo);

        // Restore all resource mirrors
        frame.switchMirrors(null);
    };

    ui.DrawInfo = DrawInfo;
})();
