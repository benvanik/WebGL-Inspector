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
            if (this.previewReady) {
                return;
            }
            this.previewReady = true;
            var canvas = this.canvas;
            try {
                if (canvas.getContextRaw) {
                    this.gl = canvas.getContextRaw("experimental-webgl");
                } else {
                    this.gl = canvas.getContext("experimental-webgl");
                }
            } catch (e) {
                // ?
                alert("Unable to create texture preview canvas: " + e);
            }
            gli.hacks.installAll(this.gl);
            var gl = this.gl;

            var vsSource =
            'attribute vec2 a_position;' +
            'attribute vec2 a_uv;' +
            'varying vec2 v_uv;' +
            'void main() {' +
            '    gl_Position = vec4(a_position, 0.0, 1.0);' +
            '    v_uv = a_uv;' +
            '}';
            var fs2dSource =
            'precision highp float;' +
            'uniform sampler2D u_sampler0;' +
            'varying vec2 v_uv;' +
            'void main() {' +
            '    gl_FragColor = texture2D(u_sampler0, v_uv);' +
            '}';

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            // Initialize shaders
            var vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vsSource);
            gl.compileShader(vs);
            var fs2d = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs2d, fs2dSource);
            gl.compileShader(fs2d);
            var program2d = this.program2d = gl.createProgram();
            gl.attachShader(program2d, vs);
            gl.attachShader(program2d, fs2d);
            gl.linkProgram(program2d);
            gl.useProgram(program2d);
            var samplerUniform = gl.getUniformLocation(program2d, "u_sampler0");
            gl.uniform1i(samplerUniform, 0);

            var vertices = [
                -1, -1, 0, 1,
                 1, -1, 1, 1,
                -1, 1, 0, 0,
                -1, 1, 0, 0,
                 1, -1, 1, 1,
                 1, 1, 1, 0
            ];
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            var positionAttr = gl.getAttribLocation(this.program2d, "a_position");
            gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 16, 0);
            var uvAttr = gl.getAttribLocation(this.program2d, "a_uv");
            gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 16, 8);
        };
        this.inspector.updatePreview = function () {
            var gl = this.gl;

            if (!this.currentTexture || !this.currentVersion) {
                gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT);
                return;
            }

            var targetFace = this.getTargetFace(gl);
            var size = this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
            if (size) {
                this.canvas.width = size[0];
                this.canvas.height = size[1];
                this.canvas.style.display = "";
            } else {
                this.canvas.width = 1;
                this.canvas.height = 1;
                this.canvas.style.display = "none";
            }

            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var gltex = this.currentTexture.createTarget(gl, this.currentVersion, targetFace);

            gl.activeTexture(gl.TEXTURE0);

            gl.useProgram(this.program2d);
            gl.bindTexture(gl.TEXTURE_2D, gltex);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            this.currentTexture.deleteTarget(gl, gltex);
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
    
    function generateTextureHistory(gl, el, texture) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "History";
        el.appendChild(titleDiv);

        var rootEl = document.createElement("div");
        rootEl.className = "texture-history";
        el.appendChild(rootEl);
        
        // ?
    };

    function generateTextureDisplay(gl, el, texture) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = texture.getName();
        el.appendChild(titleDiv);

        var repeatEnums = ["REPEAT", "CLAMP_TO_EDGE", "MIRROR_REPEAT"];
        var filterEnums = ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR"];
        gli.ui.appendParameters(gl, el, texture, ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER"], [repeatEnums, repeatEnums, filterEnums, filterEnums]);
        gli.ui.appendbr(el);

        gli.ui.appendSeparator(el);

        generateTextureHistory(gl, el, texture);
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

        this.elements.listing.innerHTML = "";
        if (texture) {
            generateTextureDisplay(this.window.context, this.elements.listing, texture);
        }

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

        this.inspector.setTexture(texture, version);

        this.elements.listing.scrollTop = 0;
    };

    ui.TextureView = TextureView;
})();
