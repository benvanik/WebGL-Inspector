(function () {
    var ui = glinamespace("gli.ui");

    var TextureView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("texture-listing")[0]
        };

        this.inspector = new ui.SurfaceInspector(this, w, elementRoot, {
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
            this.previewer = new ui.TexturePreviewGenerator(this.canvas);
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
        var document = this.window.document;

        //.window-texture-outer margin-left: -800px !important; /* -2 * window-texture-inspector.width */
        //.window-texture margin-left: 400px !important; /* window-texture-inspector.width */
        //.texture-listing right: 400px; /* window-texture-inspector */
        document.getElementsByClassName("window-texture-outer")[0].style.marginLeft = (-2 * newWidth) + "px !important";
        document.getElementsByClassName("window-texture-inspector")[0].style.width = newWidth + "px";
        document.getElementsByClassName("texture-listing")[0].style.right = newWidth + "px !important";
    };

    TextureView.prototype.layout = function () {
        this.inspector.layout();
    };

    function createImageDataFromPixels(gl, width, height, format, type, source) {
        var canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(width, height);

        // TODO: implement all texture formats
        switch (type) {
            case gl.UNSIGNED_BYTE:
                switch (format) {
                    case gl.RGB:
                        for (var sn = 0, dn = 0; sn < width * height * 3; sn += 3, dn += 4) {
                            imageData.data[dn + 0] = source[sn + 0];
                            imageData.data[dn + 1] = source[sn + 1];
                            imageData.data[dn + 2] = source[sn + 2];
                            imageData.data[dn + 3] = 255;
                        }
                        break;
                    case gl.RGBA:
                        for (var n = 0; n < width * height * 4; n++) {
                            imageData.data[n] = source[n];
                        }
                        break;
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
        }

        return imageData;
    };

    function appendHistoryLine(gl, el, texture, call) {
        if (call.name == "pixelStorei") {
            // Don't care about these for now - maybe they will be useful in the future
            return;
        }

        gli.ui.appendHistoryLine(gl, el, call);

        if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
            // TODO: display src of last arg (either data, img, video, etc)
            var sourceArg = null;
            for (var n = 0; n < call.args.length; n++) {
                var arg = call.args[n];
                if (arg) {
                    if ((arg instanceof HTMLCanvasElement) ||
                        (arg instanceof HTMLImageElement) ||
                        (arg instanceof HTMLVideoElement)) {
                        sourceArg = gli.util.clone(arg);
                    } else if (arg.__proto__.constructor.toString().indexOf("ImageData") > 0) {
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
                sourceArg = createImageDataFromPixels(gl, width, height, format, type, sourceArg);
            }

            // Fixup ImageData
            if (sourceArg && sourceArg.__proto__.constructor.toString().indexOf("ImageData") > 0) {
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
                dupeEl.style.width = "100%";
                dupeEl.style.height = "100%";

                if (dupeEl.src) {
                    var srcEl = document.createElement("div");
                    srcEl.className = "texture-history-src";
                    srcEl.innerHTML = "Source: ";
                    var srcLinkEl = document.createElement("a");
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

                var size = [dupeEl.width, dupeEl.height];

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
            appendHistoryLine(gl, rootEl, texture, call);
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
