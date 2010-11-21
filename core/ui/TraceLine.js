(function () {
    var ui = glinamespace("gli.ui");

    function generateFunctionDisplay(context, call, el) {
        var sig = "";

        // TODO: return type must be set in info.js
        //if (call.info.returnType) {
        if (call.result) {
            sig += "UNK ";
        } else {
            sig += "void ";
        }

        sig += call.info.name + "(";

        if (call.info.args.length || call.info.args.length == 0) {
            for (var n = 0; n < call.info.args.length; n++) {
                var argInfo = call.info.args[n];
                if (n != 0) {
                    sig += ", ";
                }
                sig += argInfo.name;
            }
        } else {
            if (call.info.args) {
                var UIType = gli.UIType;
                switch (call.info.args.ui) {
                    case UIType.COLORMASK:
                        sig += "r, g, b, a";
                        break;
                    case UIType.COLOR:
                        sig += "r, g, b, a";
                        break;
                }
            }
        }

        sig += ")";

        var functionSpan = document.createElement("span");
        functionSpan.innerHTML = call.info.name;
        functionSpan.title = sig;
        el.appendChild(functionSpan);
    };

    function generateValueDisplay(w, context, call, el, ui, value, argIndex) {
        var vel = document.createElement("span");

        var gl = context;
        var UIType = gli.UIType;

        var text = null;
        var tip = null;
        var clickhandler = null;

        if (call.info.args.length || call.info.args.length == 0) {
            var argInfo = call.info.args[argIndex];
            if (argInfo) {
                tip = argInfo.name;
            }
        } else {
            if (call.info.args) {
                switch (call.info.args.ui) {
                    case UIType.COLORMASK:
                        break;
                    case UIType.COLOR:
                        break;
                }
            }
        }

        // If no UI provided, fake one and guess
        if (!ui) {
            ui = {};
            ui.type = UIType.OBJECT;
        }
        if (value && value.trackedObject) {
            // Got passed a real gl object instead of our tracked one - fixup
            value = value.trackedObject;
        }

        // This slows down large traces - need to do all tips on demand instead
        var useEnumTips = false;

        switch (ui.type) {
            case UIType.ENUM:
                var enumTip = tip;
                enumTip += ":\r\n";
                var anyMatches = false;
                for (var i = 0; i < ui.values.length; i++) {
                    var enumName = ui.values[i];
                    enumTip += enumName;
                    if (value == gl[enumName]) {
                        anyMatches = true;
                        text = enumName;
                        enumTip += " <---";
                    }
                    enumTip += "\r\n";
                }
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
                }
                if (useEnumTips) {
                    tip = enumTip;
                }
                break;
            case UIType.ARRAY:
                text = "[" + value + "]";
                break;
            case UIType.BOOL:
                text = value ? "true" : "false";
                break;
            case UIType.LONG:
                text = value;
                break;
            case UIType.ULONG:
                text = value;
                break;
            case UIType.COLORMASK:
                text = value;
                //outputHTML += "R<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[0] ? "checked='checked'" : "") + "/>";
                //outputHTML += "G<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[1] ? "checked='checked'" : "") + "/>";
                //outputHTML += "B<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[2] ? "checked='checked'" : "") + "/>";
                //outputHTML += "A<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[3] ? "checked='checked'" : "") + "/>";
                break;
            case UIType.OBJECT:
                // TODO: custom object output based on type
                text = value ? value : "null";
                if (value && value.target && gli.util.isWebGLResource(value.target)) {
                    var typename = glitypename(value.target);
                    switch (typename) {
                        case "WebGLBuffer":
                            clickhandler = function () {
                                w.showBuffer(value, true);
                            };
                            break;
                        case "WebGLFramebuffer":
                            break;
                        case "WebGLProgram":
                            clickhandler = function () {
                                w.showProgram(value, true);
                            };
                            break;
                        case "WebGLRenderbuffer":
                            break;
                        case "WebGLShader":
                            break;
                        case "WebGLTexture":
                            clickhandler = function () {
                                w.showTexture(value, true);
                            };
                            break;
                    }
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value) {
                    var typename = glitypename(value);
                    switch (typename) {
                        case "WebGLUniformLocation":
                            text = '"' + value.sourceUniformName + '"';
                            break;
                    }
                }
                break;
            case UIType.WH:
                text = value[0] + " x " + value[1];
                break;
            case UIType.RECT:
                text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
                break;
            case UIType.STRING:
                text = '"' + value + '"';
                break;
            case UIType.COLOR:
                text = value;
                //                outputHTML += "<span style='color: rgb(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + ")'>rgba(" +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>, " +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>, " +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>, " +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>" +
                //                                ")</span>";
                // TODO: color tip
                break;
            case UIType.FLOAT:
                text = value;
                break;
            case UIType.BITMASK:
                text = "0x" + value.toString(16);
                // TODO: bitmask tip
                break;
            case UIType.RANGE:
                text = value[0] + " - " + value[1];
                break;
            case UIType.MATRIX:
                switch (value.length) {
                    default: // ?
                        text = "[matrix]";
                        break;
                    case 4: // 2x2
                        text = "[matrix 2x2]";
                        break;
                    case 9: // 3x3
                        text = "[matrix 3x3]";
                        break;
                    case 16: // 4x4
                        text = "[matrix 4x4]";
                        break;
                }
                // TODO: matrix tip
                break;
        }

        vel.innerHTML = text;
        vel.title = tip;

        if (clickhandler) {
            vel.className += " trace-call-clickable";
            vel.onclick = function (e) {
                clickhandler();
                e.preventDefault();
                e.stopPropagation();
            };
        }

        el.appendChild(vel);
    };

    function populateCallLine(w, call, el) {
        var context = w.context;

        generateFunctionDisplay(context, call, el);

        el.appendChild(document.createTextNode("("));

        if (call.info.args.length || call.info.args.length == 0) {
            for (var n = 0; n < call.args.length; n++) {
                var argInfo = (n < call.info.args.length) ? call.info.args[n] : null;
                var argValue = call.args[n];
                if (n != 0) {
                    el.appendChild(document.createTextNode(", "));
                }
                generateValueDisplay(w, context, call, el, argInfo ? argInfo.ui : null, argValue, n);
            }
        } else {
            // Special argument formatter
            generateValueDisplay(w, context, call, el, call.info.args, call.args);
        }

        el.appendChild(document.createTextNode(")"));

        // TODO: return type must be set in info.js
        //if (call.info.returnType) {
        if (call.result) {
            el.appendChild(document.createTextNode(" = "));
            generateValueDisplay(w, context, call, el, call.info.returnType, call.result);
            //el.appendChild(document.createTextNode(call.result)); // TODO: pretty
        }
    };
    
    function appendHistoryLine(gl, el, call) {
        // <div class="history-call">
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        // </div>
        
        var callRoot = document.createElement("div");
        callRoot.className = "usage-call";
        
        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(gl.ui, call, line);
        callRoot.appendChild(line);

        el.appendChild(callRoot);
        
        // TODO: click to expand stack trace?
    };
    
    function appendCallLine(gl, el, frame, call, resource) {
        // <div class="usage-call">
        //     <div class="usage-call-ordinal">
        //         NNNN
        //     </div>
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        // </div>
        
        var callRoot = document.createElement("div");
        callRoot.className = "usage-call usage-call-clickable";
        
        callRoot.onclick = function (e) {
            // Jump to trace view and run until ordinal
            gl.ui.showTrace(frame, call.ordinal);
            e.preventDefault();
            e.stopPropagation();
        };

        var ordinal = document.createElement("div");
        ordinal.className = "usage-call-ordinal";
        ordinal.innerHTML = call.ordinal;
        callRoot.appendChild(ordinal);
        
        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(gl.ui, call, line);
        callRoot.appendChild(line);

        el.appendChild(callRoot);
    };
    
    function generateUsageList(gl, el, frame, resource) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "Usage in frame " + frame.frameNumber;
        el.appendChild(titleDiv);
        
        var rootEl = document.createElement("div");
        rootEl.className = "resource-usage";
        el.appendChild(rootEl);
        
        var usages = frame.findResourceUsages(resource);
        if (usages == null) {
            var notUsed = document.createElement("div");
            notUsed.innerHTML = "Not used in this frame";
            rootEl.appendChild(notUsed);
        } else if (usages.length == 0) {
            var notUsed = document.createElement("div");
            notUsed.innerHTML = "Used but not referenced in this frame";
            rootEl.appendChild(notUsed);
        } else {
            for (var n = 0; n < usages.length; n++) {
                var call = usages[n];
                appendCallLine(gl, rootEl, frame, call, resource);
            }
        }
    };
    
    ui.populateCallLine = populateCallLine;
    ui.appendHistoryLine = appendHistoryLine;
    ui.generateUsageList = generateUsageList;
    
})();
