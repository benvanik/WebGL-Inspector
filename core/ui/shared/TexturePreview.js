(function () {
    var ui = glinamespace("gli.ui");

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
        program2d.u_sampler0 = gl.getUniformLocation(program2d, "u_sampler0");
        program2d.a_position = gl.getAttribLocation(program2d, "a_position");
        program2d.a_uv = gl.getAttribLocation(program2d, "a_uv");
        gl.useProgram(null);

        var vertices = new Float32Array([
            -1, -1, 0, 1,
             1, -1, 1, 1,
            -1, 1, 0, 0,
            -1, 1, 0, 0,
             1, -1, 1, 1,
             1, 1, 1, 0
        ]);
        var buffer = this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    TexturePreviewGenerator.prototype.draw = function (texture, version, targetFace, desiredWidth, desiredHeight) {
        var gl = this.gl;

        // Capture all state
        var stateSnapshot = new gli.host.StateSnapshot(gl);

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
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            gl.useProgram(this.program2d);
            gl.uniform1i(this.program2d.u_sampler0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(this.program2d.a_position, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(this.program2d.a_uv, 2, gl.FLOAT, false, 16, 8);

            var gltex;
            if (this.useMirror) {
                gltex = texture.mirror.target;
            } else {
                gltex = texture.createTarget(gl, version, targetFace);
            }

            gl.enable(gl.TEXTURE_2D);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gltex);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (!this.useMirror) {
                texture.deleteTarget(gl, gltex);
            }
        }

        // Re-apply existing state
        stateSnapshot.apply(gl);
    };

    TexturePreviewGenerator.prototype.capture = function () {
        var targetCanvas = document.createElement("canvas");
        targetCanvas.className = "gli-reset";
        targetCanvas.width = this.canvas.width;
        targetCanvas.height = this.canvas.height;
        var ctx = targetCanvas.getContext("2d");
        ctx.drawImage(this.canvas, 0, 0);
        return targetCanvas;
    };

    ui.TexturePreviewGenerator = TexturePreviewGenerator;
})();
