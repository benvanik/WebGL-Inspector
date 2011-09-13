(function () {
    var ui = glinamespace("gli.ui");

    ui.argToString = function(value, argInfo) {
        var UIType = gli.info.UIType;

        var ui = argInfo ? argInfo.ui : null;
        var uitype = ui ? ui.type : UIType.OBJECT;

        switch (uitype) {
            case UIType.ENUM:
                var anyMatches = false;
                for (var i = 0; i < ui.values.length; i++) {
                    var enumName = ui.values[i];
                    if (value == gl[enumName]) {
                        anyMatches = true;
                        text = enumName;
                    }
                }
                if (!anyMatches) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
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
                text = value; // [r, g, b, a]
                break;
            case UIType.OBJECT:
                // TODO: custom object output based on type
                text = value ? value : "null";
                if (value && value instanceof gli.playback.resources.Resource) {
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value && value.uniformReference) {
                    text = '"' + value.name + '"';
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
                text = value; // [r, g, b, a]
                break;
            case UIType.FLOAT:
                text = value;
                break;
            case UIType.BITMASK:
                // If enum values present use them (they are flags), otherwise just a hex value
                text = "";
                if (ui.values && ui.values.length) {
                    for (var i = 0; i < ui.values.length; i++) {
                        var enumName = ui.values[i];
                        if (value & gl[enumName]) {
                            if (text.length) {
                                text += " | " + enumName;
                            } else {
                                text = enumName;
                            }
                        }
                    }
                } else {
                    text = "0x" + value.toString(16);
                }
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
                text = "[" + value + "]";
                break;
        }

        return text;
    };

    ui.callToString = function(call) {
        var s = call.name + "(";

        var argInfos = call.info.getArgs(call);
        for (var n = 0; n < call.args.length; n++) {
            var arg = call.args[n];
            if (n) {
                s += ", ";
            }
            s += gli.ui.argToString(arg, argInfos[n]);
        }

        return s + ")";
    };

    function drawArg(ctx, x, y, arg, argInfo) {
        // TODO: better viz? custom displays, etc
        var s = gli.ui.argToString(arg, argInfo);
        var w = ctx.measureText(s).width;
        ctx.fillText(s, x, y);
        return w;
    };

    ui.drawCall = function(ctx, x, y, call) {
        var pre = call.name + "(";
        var post = ")";
        var preWidth = ctx.measureText(pre).width;
        var commaSpaceWidth = ctx.measureText(", ").width;

        var info = call.info;

        // name(
        ctx.fillText(pre, x, y);
        x += preWidth;

        for (var n = 0; n < call.args.length; n++) {
            var arg = call.args[n];
            if (n) {
                ctx.fillText(", ", x, y);
                x += commaSpaceWidth;
            }
            x += drawArg(ctx, x, y, arg, info.args[n]);
        }

        // )
        ctx.fillText(post, x, y);
    };

    ui.hitTestCall = function(x, y, call) {
                var UIType = gli.UIType;

        var text = null;
        var tip = null;
        var clickhandler = null;

        var argInfos = call.info.getArgs(call);
        if (argInfos.length || argInfos.length == 0) {
            var argInfo = argInfos[argIndex];
            if (argInfo) {
                tip = argInfo.name;
            }
        } else {
            if (argInfos) {
                switch (argInfos.ui) {
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
                if (useEnumTips) {
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
                    tip = enumTip;
                } else {
                    for (var i = 0; i < ui.values.length; i++) {
                        var enumName = ui.values[i];
                        if (value == gl[enumName]) {
                            anyMatches = true;
                            text = enumName;
                        }
                    }
                }
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
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
                if (value && value instanceof gli.playback.resources.Resource) {
                    if (value instanceof gli.playback.resources.Buffer) {
                        clickhandler = function () {
                            w.showBuffer(value, true);
                        };
                    } else if (value instanceof gli.playback.resources.Framebuffer) {
                    } else if (value instanceof gli.playback.resources.Program) {
                        clickhandler = function () {
                            w.showProgram(value, true);
                        };
                    } else if (value instanceof gli.playback.resources.Renderbuffer) {
                    } else if (value instanceof gli.playback.resources.Shader) {
                    } else if (value instanceof gli.playback.resources.Texture) {
                        clickhandler = function () {
                            w.showTexture(value, true);
                        };
                    }
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value && value.uniformReference) {
                    text = '"' + value.name + '"';
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
                // If enum values present use them (they are flags), otherwise just a hex value
                text = "";
                if (ui.values && ui.values.length) {
                    for (var i = 0; i < ui.values.length; i++) {
                        var enumName = ui.values[i];
                        if (value & gl[enumName]) {
                            if (text.length) {
                                text += " | " + enumName;
                            } else {
                                text = enumName;
                            }
                        }
                    }
                } else {
                    text = "0x" + value.toString(16);
                }
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
                text = "[" + value + "]";
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
    };

})();
