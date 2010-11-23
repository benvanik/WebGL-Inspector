(function () {
    var ui = glinamespace("gli.ui");

    var TexturePreviewGenerator = function (canvas) {
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

    TexturePreviewGenerator.prototype.draw = function (texture, version, targetFace, desiredWidth, desiredHeight) {
        var gl = this.gl;

        this.canvas.width = desiredWidth;
        this.canvas.height = desiredHeight;

        if (!texture || !version) {
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var gltex = texture.createTarget(gl, version, targetFace);

        gl.activeTexture(gl.TEXTURE0);

        gl.useProgram(this.program2d);
        gl.bindTexture(gl.TEXTURE_2D, gltex);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        texture.deleteTarget(gl, gltex);
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
