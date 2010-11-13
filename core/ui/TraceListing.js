(function () {
    var ui = glinamespace("gli.ui");

    var TraceListing = function (view, w, elementRoot) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            list: elementRoot.getElementsByClassName("trace-listing")[0]
        };

        this.calls = [];

        this.activeCall = null;
    };

    TraceListing.prototype.reset = function () {
        this.activeCall = null;
        this.calls.length = 0;
        this.elements.list.innerHTML = "";
    };

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
                                w.showBuffer(value);
                            };
                            break;
                        case "WebGLFramebuffer":
                            break;
                        case "WebGLProgram":
                            clickhandler = function () {
                                w.showProgram(value);
                            };
                            break;
                        case "WebGLRenderbuffer":
                            break;
                        case "WebGLShader":
                            break;
                        case "WebGLTexture":
                            clickhandler = function () {
                                w.showTexture(value);
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
            for (var n = 0; n < call.info.args.length; n++) {
                var argInfo = call.info.args[n];
                var argValue = call.args[n];
                if (n != 0) {
                    el.appendChild(document.createTextNode(", "));
                }
                generateValueDisplay(w, context, call, el, argInfo.ui, argValue, n);
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

    function addCall(listing, call) {
        var document = listing.window.document;

        // <div class="trace-call">
        //     <div class="trace-call-icon">
        //         &nbsp;
        //     </div>
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        //     <div class="trace-call-timing">
        //         32ms
        //     </div>
        // </div>

        var el = document.createElement("div");
        el.className = "trace-call";

        var icon = document.createElement("div");
        icon.className = "trace-call-icon";
        el.appendChild(icon);

        var line = document.createElement("div");
        line.className = "trace-call-line";
        populateCallLine(listing.window, call, line);
        el.appendChild(line);

        /*var timing = document.createElement("div");
        timing.className = "trace-call-timing";
        timing.innerHTML = call.duration + "ms";
        el.appendChild(timing);*/

        listing.elements.list.appendChild(el);

        var index = listing.calls.length;
        el.onclick = function () {
            listing.view.minibar.stepUntil(index);
        };

        listing.calls.push({
            call: call,
            element: el,
            icon: icon
        });
    };

    TraceListing.prototype.setFrame = function (frame) {
        this.reset();

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            addCall(this, call);
        }

        this.elements.list.scrollTop = 0;
    };

    TraceListing.prototype.setActiveCall = function (callIndex) {
        if (this.activeCall == callIndex) {
            return;
        }

        if (this.activeCall != null) {
            // Clean up previous changes
            var oldel = this.calls[this.activeCall].element;
            oldel.className = oldel.className.replace("trace-call-highlighted", "");
            var oldicon = this.calls[this.activeCall].icon;
            oldicon.className = oldicon.className.replace("trace-call-icon-active", "");
        }

        this.activeCall = callIndex;

        if (callIndex === null) {
            this.scrollToCall(0);
        } else {
            var el = this.calls[callIndex].element;
            el.className += " trace-call-highlighted";
            var icon = this.calls[callIndex].icon;
            icon.className += " trace-call-icon-active";

            this.scrollToCall(callIndex);
        }
    };

    TraceListing.prototype.scrollToCall = function (callIndex) {
        var el = this.calls[callIndex].icon;
        scrollIntoViewIfNeeded(el);
    };

    ui.TraceListing = TraceListing;

})();
