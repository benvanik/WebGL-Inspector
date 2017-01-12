define([
        '../../host/CaptureContext',
        '../../shared/Settings',
        '../../shared/ShaderUtils',
        '../../shared/Utilities',
        '../../host/Resource',
    ], function (
        captureContext,
        settings,
        shaderUtils,
        util,
        Resource
    ) {

    var TexturePreviewGenerator = function (canvas, useMirror) {
        this.useMirror = useMirror;
        if (canvas) {
            // Re-use the canvas passed in
        } else {
            // Create a canvas for previewing
            canvas = document.createElement("canvas");
            canvas.className = "gli-reset";

            // HACK: this gets things working in firefox
            var frag = document.createDocumentFragment();
            frag.appendChild(canvas);
        }
        this.canvas = canvas;

        var gl = this.gl = util.getWebGLContext(canvas);

        this.programInfo = shaderUtils.createProgramInfo(gl, [
                `
                    attribute vec4 a_position;
                    varying vec2 v_uv;
                    void main() {
                        gl_Position = a_position;
                        v_uv = a_position.xy * vec2(1,-1) * .5 + .5;
                    }
                `,
                `
                    precision highp float;
                    uniform sampler2D u_sampler0;
                    varying vec2 v_uv;
                    void main() {
                        gl_FragColor = texture2D(u_sampler0, v_uv);
                    }
                `,
            ],
            ['a_position']);

        // Initialize buffer
        var vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);
        var buffer = this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    TexturePreviewGenerator.prototype.dispose = function() {
        var gl = this.gl;

        gl.deleteProgram(gl.programInfo.program);
        this.programInfo = null;

        gl.deleteBuffer(this.buffer);
        this.buffer = null;

        this.gl = null;
        this.canvas = null;
    };

    TexturePreviewGenerator.prototype.draw = function (texture, version, targetFace, desiredWidth, desiredHeight) {
        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if ((this.canvas.width != desiredWidth) || (this.canvas.height != desiredHeight)) {
            this.canvas.width = desiredWidth;
            this.canvas.height = desiredHeight;
        }

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.colorMask(true, true, true, true);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (texture && version) {
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            gl.useProgram(this.programInfo.program);

            const a_position = 0;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            var gltex;
            if (this.useMirror) {
                gltex = texture.mirror.target;
            } else {
                gltex = texture.createTarget(gl, version, null, targetFace);
            }

            shaderUtils.setUniforms(gl, this.programInfo, {
                u_sampler0: gltex,
            });

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (!this.useMirror) {
                texture.deleteTarget(gl, gltex);
            }
        }
    };

    TexturePreviewGenerator.prototype.capture = function (doc) {
        var targetCanvas = doc.createElement("canvas");
        targetCanvas.className = "gli-reset";
        targetCanvas.width = this.canvas.width;
        targetCanvas.height = this.canvas.height;
        try {
            var ctx = targetCanvas.getContext("2d");
            if (doc == this.canvas.ownerDocument) {
                ctx.drawImage(this.canvas, 0, 0);
            } else {
                // Need to extract the data and copy manually, as doc->doc canvas
                // draws aren't supported for some stupid reason
                var srcctx = this.canvas.getContext("2d");
                if (srcctx) {
                    var srcdata = srcctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    ctx.putImageData(srcdata, 0, 0);
                } else {
                    var dataurl = this.canvas.toDataURL();
                    var img = doc.createElement("img");
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = dataurl;
                }
            }
        } catch (e) {
            window.console.log('unable to draw texture preview');
            window.console.log(e);
        }
        return targetCanvas;
    };

    TexturePreviewGenerator.prototype.buildItem = function (w, doc, gl, texture, closeOnClick, useCache) {
        var self = this;

        var el = doc.createElement("div");
        el.className = "texture-picker-item";
        if (texture.status == Resource.DEAD) {
            el.className += " texture-picker-item-deleted";
        }

        var previewContainer = doc.createElement("div");
        previewContainer.className = "texture-picker-item-container";
        el.appendChild(previewContainer);

        function updatePreview() {
            var preview = null;
            if (useCache && texture.cachedPreview) {
                // Preview exists - use it
                preview = texture.cachedPreview;
            }
            if (!preview) {
                // Preview does not exist - create it
                // TODO: pick the right version
                var version = texture.currentVersion;
                var targetFace;
                switch (texture.type) {
                    case gl.TEXTURE_CUBE_MAP:
                        targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X; // pick a different face?
                        break;
                    default:
                        targetFace = null;
                        break;
                }
                var size = texture.guessSize(gl, version, targetFace);
                var desiredWidth = 128;
                var desiredHeight = 128;
                if (size) {
                    if (size[0] > size[1]) {
                        desiredWidth = 128;
                        desiredHeight = 128 / (size[0] / size[1]);
                    } else {
                        desiredHeight = 128;
                        desiredWidth = 128 / (size[1] / size[0]);
                    }
                }
                self.draw(texture, version, targetFace, desiredWidth, desiredHeight);
                preview = self.capture(doc);
                var x = (128 / 2) - (desiredWidth / 2);
                var y = (128 / 2) - (desiredHeight / 2);
                preview.style.marginLeft = x + "px";
                preview.style.marginTop = y + "px";
                if (useCache) {
                    texture.cachedPreview = preview;
                }
            }
            if (preview) {
                // TODO: setup
                preview.className = "";
                if (preview.parentNode) {
                    preview.parentNode.removeChild(preview);
                }
                while (previewContainer.hasChildNodes()) {
                    previewContainer.removeChild(previewContainer.firstChild());
                }
                previewContainer.appendChild(preview);
            }
        };

        updatePreview();

        var iconDiv = doc.createElement("div");
        iconDiv.className = "texture-picker-item-icon";
        switch (texture.type) {
            case gl.TEXTURE_2D:
                iconDiv.className += " texture-picker-item-icon-2d";
                break;
            case gl.TEXTURE_CUBE_MAP:
                iconDiv.className += " texture-picker-item-icon-cube";
                break;
        }
        el.appendChild(iconDiv);

        var titleDiv = doc.createElement("div");
        titleDiv.className = "texture-picker-item-title";
        titleDiv.textContent = texture.getName();
        el.appendChild(titleDiv);

        el.onclick = function (e) {
            w.context.ui.showTexture(texture);
            if (closeOnClick) {
                w.close(); // TODO: do this?
            }
            e.preventDefault();
            e.stopPropagation();
        };

        texture.modified.addListener(self, function (texture) {
            texture.cachedPreview = null;
            updatePreview();
        });
        texture.deleted.addListener(self, function (texture) {
            el.className += " texture-picker-item-deleted";
        });

        return el;
    };

    return TexturePreviewGenerator;
});
