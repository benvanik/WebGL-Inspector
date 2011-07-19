(function () {
    var ui = glinamespace("gli.ui");

    var TextureView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("texture-listing")[0]
        };

        this.inspectorElements = {
            "window-texture-outer": elementRoot.getElementsByClassName("window-texture-outer")[0],
            "window-texture-inspector": elementRoot.getElementsByClassName("window-texture-inspector")[0],
            "texture-listing": elementRoot.getElementsByClassName("texture-listing")[0]
        };
        this.inspector = new ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'textureSplitter',
            title: 'Texture Preview',
            selectionName: 'Face',
            selectionValues: ["POSITIVE_X", "NEGATIVE_X", "POSITIVE_Y", "NEGATIVE_Y", "POSITIVE_Z", "NEGATIVE_Z"]
        });
        this.inspector.currentTexture = null;
        this.inspector.currentVersion = null;
        this.inspector.getTargetFace = function (gl) {
            var targetFace;
            switch (this.currentTexture.type) {
                case gl.TEXTURE_2D:
                    targetFace = null;
                    break;
                case gl.TEXTURE_CUBE_MAP:
                    targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X + this.activeOption;
                    break;
            }
            return targetFace;
        };
        this.inspector.querySize = function () {
            var gl = this.gl;
            if (!this.currentTexture || !this.currentVersion) {
                return null;
            }
            var targetFace = this.getTargetFace(gl);
            return this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
        };
        this.inspector.setupPreview = function () {
            if (this.previewer) {
                return;
            }
            this.previewer = new ui.TexturePreviewGenerator(this.canvas, false);
            this.gl = this.previewer.gl;
        };
        this.inspector.updatePreview = function () {
            var gl = this.gl;

            var targetFace = this.getTargetFace(gl);
            var size = this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
            var desiredWidth = 1;
            var desiredHeight = 1;
            if (size) {
                desiredWidth = size[0];
                desiredHeight = size[1];
                this.canvas.style.display = "";
            } else {
                this.canvas.style.display = "none";
            }

            this.previewer.draw(this.currentTexture, this.currentVersion, targetFace, desiredWidth, desiredHeight);
        };
        this.inspector.setTexture = function (texture, version) {
            var gl = this.window.context;

            if (texture) {
                this.options.title = "Texture Preview: " + texture.getName();
            } else {
                this.options.title = "Texture Preview: (none)";
            }

            this.currentTexture = texture;
            this.currentVersion = version;
            this.activeOption = 0;
            this.optionsList.selectedIndex = 0;

            if (texture) {
                // Setup UI
                switch (texture.type) {
                    case gl.TEXTURE_2D:
                        this.elements.faces.style.display = "none";
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        this.elements.faces.style.display = "";
                        break;
                }
                this.updatePreview();
            } else {
                // Clear everything
                this.elements.faces.style.display = "none";
                this.canvas.width = 1;
                this.canvas.height = 1;
                this.canvas.style.display = "none";
            }

            this.reset();
            this.layout();
        };

        this.currentTexture = null;
    };

    TextureView.prototype.setInspectorWidth = function (newWidth) {
        //.window-texture-outer margin-left: -800px !important; /* -2 * window-texture-inspector.width */
        //.window-texture margin-left: 400px !important; /* window-texture-inspector.width */
        //.texture-listing right: 400px; /* window-texture-inspector */
        this.inspectorElements["window-texture-outer"].style.marginLeft = (-2 * newWidth) + "px";
        this.inspectorElements["window-texture-inspector"].style.width = newWidth + "px";
        this.inspectorElements["texture-listing"].style.right = newWidth + "px";
    };

    TextureView.prototype.layout = function () {
        this.inspector.layout();
    };

    function createImageDataFromPixels(gl, pixelStoreState, width, height, format, type, source) {
        var canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(width, height);
        
        // TODO: support all pixel store state
        //UNPACK_ALIGNMENT
        //UNPACK_COLORSPACE_CONVERSION_WEBGL
        //UNPACK_FLIP_Y_WEBGL
        //UNPACK_PREMULTIPLY_ALPHA_WEBGL
        var unpackAlignment = pixelStoreState["UNPACK_ALIGNMENT"];
        if (unpackAlignment === undefined) {
            unpackAlignment = 4;
        }
        if (pixelStoreState["UNPACK_COLORSPACE_CONVERSION_WEBGL"] !== gl.BROWSER_DEFAULT_WEBGL) {
            console.log("unsupported: UNPACK_COLORSPACE_CONVERSION_WEBGL != BROWSER_DEFAULT_WEBGL");
        }
        if (pixelStoreState["UNPACK_FLIP_Y_WEBGL"]) {
            console.log("unsupported: UNPACK_FLIP_Y_WEBGL = true");
        }
        if (pixelStoreState["UNPACK_PREMULTIPLY_ALPHA_WEBGL"]) {
            console.log("unsupported: UNPACK_PREMULTIPLY_ALPHA_WEBGL = true");
        }
        
        // TODO: implement all texture formats
        var sn = 0;
        var dn = 0;
        switch (type) {
            case gl.UNSIGNED_BYTE:
                switch (format) {
                    case gl.ALPHA:
                        var strideDiff = width % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 1, dn += 4) {
                                imageData.data[dn + 0] = 0;
                                imageData.data[dn + 1] = 0;
                                imageData.data[dn + 2] = 0;
                                imageData.data[dn + 3] = source[sn];
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGB:
                        var strideDiff = (width * 3) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 3, dn += 4) {
                                imageData.data[dn + 0] = source[sn + 0];
                                imageData.data[dn + 1] = source[sn + 1];
                                imageData.data[dn + 2] = source[sn + 2];
                                imageData.data[dn + 3] = 255;
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGBA:
                        var strideDiff = (width * 4) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 4, dn += 4) {
                                imageData.data[dn + 0] = source[sn + 0];
                                imageData.data[dn + 1] = source[sn + 1];
                                imageData.data[dn + 2] = source[sn + 2];
                                imageData.data[dn + 3] = source[sn + 3];
                            }
                            sn += strideDiff;
                        }
                        break;
                    default:
                        console.log("unsupported texture format");
                        return null;
                }
                break;
            case gl.UNSIGNED_SHORT_5_6_5:
                console.log("todo: UNSIGNED_SHORT_5_6_5");
                return null;
            case gl.UNSIGNED_SHORT_4_4_4_4:
                console.log("todo: UNSIGNED_SHORT_4_4_4_4");
                return null;
            case gl.UNSIGNED_SHORT_5_5_5_1:
                console.log("todo: UNSIGNED_SHORT_5_5_5_1");
                return null;
            case gl.FLOAT:
                switch (format) {
                    case gl.ALPHA:
                        var strideDiff = width % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 1, dn += 4) {
                                imageData.data[dn + 0] = 0;
                                imageData.data[dn + 1] = 0;
                                imageData.data[dn + 2] = 0;
                                imageData.data[dn + 3] = Math.floor(source[sn] * 255.0);
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGB:
                        var strideDiff = (width * 3) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 3, dn += 4) {
                                imageData.data[dn + 0] = Math.floor(source[sn + 0] * 255.0);
                                imageData.data[dn + 1] = Math.floor(source[sn + 1] * 255.0);
                                imageData.data[dn + 2] = Math.floor(source[sn + 2] * 255.0);
                                imageData.data[dn + 3] = 255;
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGBA:
                        var strideDiff = (width * 4) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 4, dn += 4) {
                                imageData.data[dn + 0] = Math.floor(source[sn + 0] * 255.0);
                                imageData.data[dn + 1] = Math.floor(source[sn + 1] * 255.0);
                                imageData.data[dn + 2] = Math.floor(source[sn + 2] * 255.0);
                                imageData.data[dn + 3] = Math.floor(source[sn + 3] * 255.0);
                            }
                            sn += strideDiff;
                        }
                        break;
                    default:
                        console.log("unsupported texture format");
                        return null;
                }
                break;
            default:
                console.log("unsupported texture type");
                return null;
        }

        return imageData;
    };

    function appendHistoryLine(gl, el, texture, version, call) {
        if (call.name == "pixelStorei") {
            // Don't care about these for now - maybe they will be useful in the future
            return;
        }

        gli.ui.appendHistoryLine(gl, el, call);

        if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
            // Gather up pixel store state between this call and the previous one
            var pixelStoreState = {};
            for (var i = version.calls.indexOf(call) - 1; i >= 0; i--) {
                var prev = version.calls[i];
                if ((prev.name == "texImage2D") || (prev.name == "texSubImage2D")) {
                    break;
                }
                var pname = gli.info.enumMap[prev.args[0]];
                pixelStoreState[pname] = prev.args[1];
            }
            
            // TODO: display src of last arg (either data, img, video, etc)
            var sourceArg = null;
            for (var n = 0; n < call.args.length; n++) {
                var arg = call.args[n];
                if (arg) {
                    if ((arg instanceof HTMLCanvasElement) ||
                        (arg instanceof HTMLImageElement) ||
                        (arg instanceof HTMLVideoElement)) {
                        sourceArg = gli.util.clone(arg);
                    } else if (glitypename(arg) == "ImageData") {
                        sourceArg = arg;
                    } else if (arg.length) {
                        // Likely an array of some kind
                        sourceArg = arg;
                    }
                }
            }

            // Fixup arrays by converting to ImageData
            if (sourceArg && sourceArg.length) {
                var width;
                var height;
                var format;
                var type;
                if (call.name == "texImage2D") {
                    width = call.args[3];
                    height = call.args[4];
                    format = call.args[6];
                    type = call.args[7];
                } else {
                    width = call.args[4];
                    height = call.args[5];
                    format = call.args[6];
                    type = call.args[7];
                }
                sourceArg = createImageDataFromPixels(gl, pixelStoreState, width, height, format, type, sourceArg);
            }

            // Fixup ImageData
            if (sourceArg && glitypename(sourceArg) == "ImageData") {
                // Draw into a canvas
                var canvas = document.createElement("canvas");
                canvas.className = "gli-reset";
                canvas.width = sourceArg.width;
                canvas.height = sourceArg.height;
                var ctx = canvas.getContext("2d");
                ctx.putImageData(sourceArg, 0, 0);
                sourceArg = canvas;
            }

            if (sourceArg) {
                var dupeEl = sourceArg;
                
                // Grab the size before we muck with the element
                var size = [dupeEl.width, dupeEl.height];
                
                dupeEl.style.width = "100%";
                dupeEl.style.height = "100%";

                if (dupeEl.src) {
                    var srcEl = document.createElement("div");
                    srcEl.className = "texture-history-src";
                    srcEl.innerHTML = "Source: ";
                    var srcLinkEl = document.createElement("span");
                    srcLinkEl.className = "texture-history-src-link";
                    srcLinkEl.target = "_blank";
                    srcLinkEl.href = dupeEl.src;
                    srcLinkEl.innerHTML = dupeEl.src;
                    srcEl.appendChild(srcLinkEl);
                    el.appendChild(srcEl);
                }

                var dupeRoot = document.createElement("div");
                dupeRoot.className = "texture-history-dupe";
                dupeRoot.appendChild(dupeEl);
                el.appendChild(dupeRoot);

                // Resize on click logic
                var parentWidth = 512; // TODO: pull from parent?
                var parentHeight = Math.min(size[1], 128);
                var parentar = parentHeight / parentWidth;
                var ar = size[1] / size[0];

                var width;
                var height;
                if (ar * parentWidth < parentHeight) {
                    width = parentWidth;
                    height = (ar * parentWidth);
                } else {
                    height = parentHeight;
                    width = (parentHeight / ar);
                }
                dupeRoot.style.width = width + "px";
                dupeRoot.style.height = height + "px";

                var sizedToFit = true;
                dupeRoot.onclick = function (e) {
                    sizedToFit = !sizedToFit;
                    if (sizedToFit) {
                        dupeRoot.style.width = width + "px";
                        dupeRoot.style.height = height + "px";
                    } else {
                        dupeRoot.style.width = size[0] + "px";
                        dupeRoot.style.height = size[1] + "px";
                    }
                    e.preventDefault();
                    e.stopPropagation();
                };
            }
        }
    };

    function generateTextureHistory(gl, el, texture, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "History";
        el.appendChild(titleDiv);

        var rootEl = document.createElement("div");
        rootEl.className = "texture-history";
        el.appendChild(rootEl);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];
            appendHistoryLine(gl, rootEl, texture, version, call);
        }
    };

    function generateTextureDisplay(gl, el, texture, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = texture.getName();
        el.appendChild(titleDiv);

        var repeatEnums = ["REPEAT", "CLAMP_TO_EDGE", "MIRROR_REPEAT"];
        var filterEnums = ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR"];
        gli.ui.appendParameters(gl, el, texture, ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER"], [repeatEnums, repeatEnums, filterEnums, filterEnums]);
        gli.ui.appendbr(el);

        gli.ui.appendSeparator(el);

        generateTextureHistory(gl, el, texture, version);
        gli.ui.appendbr(el);

        var frame = gl.ui.controller.currentFrame;
        if (frame) {
            gli.ui.appendSeparator(el);
            gli.ui.generateUsageList(gl, el, frame, texture);
            gli.ui.appendbr(el);
        }
    };

    TextureView.prototype.setTexture = function (texture) {
        this.currentTexture = texture;

        var version = null;
        if (texture) {
            switch (this.window.activeVersion) {
                case null:
                    version = texture.currentVersion;
                    break;
                case "current":
                    var frame = this.window.controller.currentFrame;
                    if (frame) {
                        version = frame.findResourceVersion(texture);
                    }
                    version = version || texture.currentVersion; // Fallback to live
                    break;
            }
        }

        this.elements.listing.innerHTML = "";
        if (texture) {
            generateTextureDisplay(this.window.context, this.elements.listing, texture, version);
        }

        this.inspector.setTexture(texture, version);

        this.elements.listing.scrollTop = 0;
    };

    ui.TextureView = TextureView;
})();
