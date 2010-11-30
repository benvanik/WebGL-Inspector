(function () {
    var ui = glinamespace("gli.ui");

    var BufferPreview = function (canvas) {
        this.canvas = canvas;
        this.drawState = null;

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
        'uniform mat4 u_projMatrix;' +
        'uniform mat4 u_modelViewMatrix;' +
        'attribute vec3 a_position;' +
        'void main() {' +
        '    gl_Position = u_projMatrix * u_modelViewMatrix * vec4(a_position, 1.0);' +
        '}';
        var fsSource =
        'precision highp float;' +
        'void main() {' +
        '    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);' +
        '}';

        // Initialize shaders
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        var program = this.program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        this.program.a_position = gl.getAttribLocation(this.program, "a_position");
        this.program.u_projMatrix = gl.getUniformLocation(this.program, "u_projMatrix");
        this.program.u_modelViewMatrix = gl.getUniformLocation(this.program, "u_modelViewMatrix");

        gl.enableVertexAttribArray(this.program.a_position);

        // Default state
        gl.clearColor(0.0, 1.0, 0.0, 1.0);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        this.camera = {
            defaultDistance: 5,
            distance: 5,
            rotx: 0,
            roty: 0
        };
    };
    
    BufferPreview.prototype.resetCamera = function () {
        this.camera.distance = this.camera.defaultDistance;
        this.camera.rotx = 0;
        this.camera.roty = 0;
        this.draw();
    };

    BufferPreview.prototype.dispose = function () {
        this.setBuffer(null);

        gl.deleteProgram(this.program);
        this.program = null;

        this.gl = null;
        this.canvas = null;
    };

    BufferPreview.prototype.draw = function () {
        if (!this.drawState) {
            return;
        }

        var ds = this.drawState;
        var gl = this.gl;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Setup projection matrix
        var zn = 0.1;
        var zf = 1000.0; // TODO: normalize depth range based on buffer?
        var fovy = 45.0;
        var top = zn * Math.tan(fovy * Math.PI / 360.0);
        var bottom = -top;
        var aspectRatio = (this.canvas.width / this.canvas.height);
        var left = bottom * aspectRatio;
        var right = top * aspectRatio;
        var projMatrix = new Float32Array([
            2 * zn / (right - left), 0, 0, 0,
            0, 2 * zn / (top - bottom), 0, 0,
            (right + left) / (right - left), 0, -(zf + zn) / (zf - zn), -1,
            0, (top + bottom) / (top - bottom), -2 * zf * zn / (zf - zn), 0
        ]);
        gl.uniformMatrix4fv(this.program.u_projMatrix, false, projMatrix);

        // Setup view matrix

        // TODO: set view matrix
        /*this.camera = {
            distance: 5,
            rotx: 0,
            roty: 0
        };*/
        var viewMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -this.camera.distance * 5, 1
        ]);
        // TODO: rotate x/y
        // TODO: translate by distance
        gl.uniformMatrix4fv(this.program.u_modelViewMatrix, false, viewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBufferTarget);
        gl.vertexAttribPointer(this.program.a_position, ds.position.size, ds.position.type, ds.position.normalized, ds.position.stride, ds.position.offset);

        if (this.elementArrayBufferTarget) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBufferTarget);
            gl.drawElements(ds.mode, ds.count, ds.elementArrayType, ds.offset);
        } else {
            gl.drawArrays(ds.mode, ds.first, ds.count);
        }
    };

    function extractAttribute(gl, buffer, version, attributeIndex) {
        var data = buffer.constructVersion(gl, version);
        if (!data) {
            return null;
        }

        var result = [];

        var datas = version.structure;
        var stride = datas[0].stride;
        if (stride == 0) {
            // Calculate stride from last byte
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                switch (datas[m].type) {
                    case gl.BYTE:
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        break;
                    case gl.SHORT:
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        break;
                }
                stride = Math.max(stride, datas[m].offset + byteAdvance);
            }
        }

        var byteOffset = 0;
        var itemOffset = 0;
        while (byteOffset < data.byteLength) {
            var innerOffset = byteOffset;
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                var readView = null;
                switch (datas[m].type) {
                    case gl.BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Int8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Uint8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Int16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Uint16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        readView = new Float32Array(data.buffer, innerOffset, datas[m].size);
                        break;
                }
                innerOffset += byteAdvance;

                if (m == attributeIndex) {
                    // HACK: this is completely and utterly stupidly slow
                    // TODO: speed up extracting attributes
                    for (var i = 0; i < datas[m].size; i++) {
                        result.push(readView[i]);
                    }
                }
            }

            byteOffset += stride;
            itemOffset++;
        }

        return result;
    }

    // drawState: {
    //     mode: enum
    //     arrayBuffer: [value, version]
    //     position: { size: enum, type: enum, normalized: bool, stride: n, offset: n }
    //     elementArrayBuffer: [value, version]/null
    //     elementArrayType: UNSIGNED_BYTE/UNSIGNED_SHORT/null
    //     first: n (if no elementArrayBuffer)
    //     offset: n bytes (if elementArrayBuffer)
    //     count: n
    // }
    BufferPreview.prototype.setBuffer = function (drawState) {
        var gl = this.gl;
        if (this.arrayBufferTarget) {
            this.arrayBuffer.deleteTarget(gl, this.arrayBufferTarget);
            this.arrayBufferTarget = null;
            this.arrayBuffer = null;
        }
        if (this.elementArrayBufferTarget) {
            this.elementArrayBuffer.deleteTarget(gl, this.elementArrayBufferTarget);
            this.elementArrayBufferTarget = null;
            this.elementArrayBuffer = null;
        }

        if (drawState) {
            if (drawState.arrayBuffer) {
                this.arrayBuffer = drawState.arrayBuffer[0];
                var version = drawState.arrayBuffer[1];
                this.arrayBufferTarget = this.arrayBuffer.createTarget(gl, version);
            }
            if (drawState.elementArrayBuffer) {
                this.elementArrayBuffer = drawState.elementArrayBuffer[0];
                var version = drawState.elementArrayBuffer[1];
                this.elementArrayBufferTarget = this.elementArrayBuffer.createTarget(gl, version);
            }

            // Determine the extents of the interesting region
            var attributeIndex = 0;
            var positionData = extractAttribute(gl, drawState.arrayBuffer[0], drawState.arrayBuffer[1], attributeIndex);

            // TODO: determine actual start/end
            var version = drawState.arrayBuffer[1];
            var attr = version.structure[attributeIndex];
            var startIndex = 0;
            var endIndex = positionData.length / attr.size;

            var minx = Number.MAX_VALUE;
            var miny = Number.MAX_VALUE;
            var minz = Number.MAX_VALUE;
            var maxx = Number.MIN_VALUE;
            var maxy = Number.MIN_VALUE;
            var maxz = Number.MIN_VALUE;
            for (var n = startIndex; n < endIndex; n++) {
                var m = n * attr.size;
                var x = positionData[m + 0];
                var y = positionData[m + 1];
                var z = attr.size >= 3 ? positionData[m + 2] : 0;
                minx = Math.min(minx, x);
                miny = Math.min(miny, y);
                minz = Math.min(minz, z);
                maxx = Math.max(maxx, x);
                maxy = Math.max(maxy, y);
                maxz = Math.max(maxz, z);
            }
            var maxd = 0;
            var extents = [minx, miny, minz, maxx, maxy, maxz];
            for (var n = 0; n < extents.length; n++) {
                maxd = Math.max(maxd, Math.abs(extents[n]));
            }

            // Now have a bounding box for the mesh
            // TODO: set initial view based on bounding box
            this.camera.defaultDistance = maxd;
            this.resetCamera();
        }

        this.drawState = drawState;
        this.draw();
    };

    // TODO: input/etc

    ui.BufferPreview = BufferPreview;
})();
