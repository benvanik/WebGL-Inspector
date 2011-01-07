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
        gli.enableAllExtensions(this.gl);
        gli.hacks.installAll(this.gl);
        var gl = this.gl;

        var vsSource =
        'uniform mat4 u_projMatrix;' +
        'uniform mat4 u_modelViewMatrix;' +
        'uniform mat4 u_modelViewInvMatrix;' +
        'uniform bool u_enableLighting;' +
        'attribute vec3 a_position;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    gl_Position = u_projMatrix * u_modelViewMatrix * vec4(a_position, 1.0);' +
        '    if (u_enableLighting) {' +
        '        vec3 lightDirection = vec3(-1.0, 0.0, 0.0);' +
        '        vec3 normal = vec3(0.0, 0.0, 1.0);' +
        '        vec4 normalT = u_modelViewInvMatrix * vec4(normal, 1.0);' +
        '        float lighting = max(dot(normalT.xyz, lightDirection), 0.0);' +
        '        v_lighting = vec3(1.0, 1.0, 1.0) * lighting;' +
        '    } else {' +
        '        v_lighting = vec3(1.0, 1.0, 1.0);' +
        '    }' +
        '    gl_PointSize = 3.0;' +
        '}';
        var fsSource =
        'precision highp float;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    vec4 color = vec4(1.0, 0.0, 0.0, 1.0);' +
        '    gl_FragColor = vec4(color.rgb * v_lighting, color.a);' +
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
        this.program.u_modelViewInvMatrix = gl.getUniformLocation(this.program, "u_modelViewInvMatrix");
        this.program.u_enableLighting = gl.getUniformLocation(this.program, "u_enableLighting");

        gl.enableVertexAttribArray(this.program.a_position);

        // Default state
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
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

        // Lighting
        var enableLighting;
        switch (ds.mode) {
            case gl.POINTS:
            case gl.LINE_LOOP:
            case gl.LINE_STRIP:
            case gl.LINES:
                enableLighting = false;
                break;
            default:
                enableLighting = true;
                break;
        }
        // TODO: forced off for now because I need normal generation
        enableLighting = false;
        gl.uniform1i(this.program.u_enableLighting, enableLighting ? 1 : 0);

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

        var M = {
            m00: 0, m01: 1, m02: 2, m03: 3,
            m10: 4, m11: 5, m12: 6, m13: 7,
            m20: 8, m21: 9, m22: 10, m23: 11,
            m30: 12, m31: 13, m32: 14, m33: 15
        };
        function matrixMult(a, b) {
            var c = new Float32Array(16);
            c[M.m00] = a[M.m00] * b[M.m00] + a[M.m01] * b[M.m10] + a[M.m02] * b[M.m20] + a[M.m03] * b[M.m30];
            c[M.m01] = a[M.m00] * b[M.m01] + a[M.m01] * b[M.m11] + a[M.m02] * b[M.m21] + a[M.m03] * b[M.m31];
            c[M.m02] = a[M.m00] * b[M.m02] + a[M.m01] * b[M.m12] + a[M.m02] * b[M.m22] + a[M.m03] * b[M.m32];
            c[M.m03] = a[M.m00] * b[M.m03] + a[M.m01] * b[M.m13] + a[M.m02] * b[M.m23] + a[M.m03] * b[M.m33];
            c[M.m10] = a[M.m10] * b[M.m00] + a[M.m11] * b[M.m10] + a[M.m12] * b[M.m20] + a[M.m13] * b[M.m30];
            c[M.m11] = a[M.m10] * b[M.m01] + a[M.m11] * b[M.m11] + a[M.m12] * b[M.m21] + a[M.m13] * b[M.m31];
            c[M.m12] = a[M.m10] * b[M.m02] + a[M.m11] * b[M.m12] + a[M.m12] * b[M.m22] + a[M.m13] * b[M.m32];
            c[M.m13] = a[M.m10] * b[M.m03] + a[M.m11] * b[M.m13] + a[M.m12] * b[M.m23] + a[M.m13] * b[M.m33];
            c[M.m20] = a[M.m20] * b[M.m00] + a[M.m21] * b[M.m10] + a[M.m22] * b[M.m20] + a[M.m23] * b[M.m30];
            c[M.m21] = a[M.m20] * b[M.m01] + a[M.m21] * b[M.m11] + a[M.m22] * b[M.m21] + a[M.m23] * b[M.m31];
            c[M.m22] = a[M.m20] * b[M.m02] + a[M.m21] * b[M.m12] + a[M.m22] * b[M.m22] + a[M.m23] * b[M.m32];
            c[M.m23] = a[M.m20] * b[M.m03] + a[M.m21] * b[M.m13] + a[M.m22] * b[M.m23] + a[M.m23] * b[M.m33];
            c[M.m30] = a[M.m30] * b[M.m00] + a[M.m31] * b[M.m10] + a[M.m32] * b[M.m20] + a[M.m33] * b[M.m30];
            c[M.m31] = a[M.m30] * b[M.m01] + a[M.m31] * b[M.m11] + a[M.m32] * b[M.m21] + a[M.m33] * b[M.m31];
            c[M.m32] = a[M.m30] * b[M.m02] + a[M.m31] * b[M.m12] + a[M.m32] * b[M.m22] + a[M.m33] * b[M.m32];
            c[M.m33] = a[M.m30] * b[M.m03] + a[M.m31] * b[M.m13] + a[M.m32] * b[M.m23] + a[M.m33] * b[M.m33];
            return c;
        };
        function matrixInverse(m) {
            var inv = new Float32Array(16);
            inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
            inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
            inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
            inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
            inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
            inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
            inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
            inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
            inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
            inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
            inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
            inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
            inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
            inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
            inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
            inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
            var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
            if (det == 0.0)
                return null;
            det = 1.0 / det;
            for (var i = 0; i < 16; i++)
                inv[i] = inv[i] * det;
            return inv;
        };

        // Build the view matrix
        /*this.camera = {
        distance: 5,
        rotx: 0,
        roty: 0
        };*/
        var cx = Math.cos(-this.camera.roty);
        var sx = Math.sin(-this.camera.roty);
        var xrotMatrix = new Float32Array([
            1, 0, 0, 0,
            0, cx, -sx, 0,
            0, sx, cx, 0,
            0, 0, 0, 1
        ]);
        var cy = Math.cos(-this.camera.rotx);
        var sy = Math.sin(-this.camera.rotx);
        var yrotMatrix = new Float32Array([
            cy, 0, sy, 0,
            0, 1, 0, 0,
            -sy, 0, cy, 0,
            0, 0, 0, 1
        ]);
        var zoomMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -this.camera.distance * 5, 1
        ]);
        var rotationMatrix = matrixMult(yrotMatrix, xrotMatrix);
        var modelViewMatrix = matrixMult(rotationMatrix, zoomMatrix);
        gl.uniformMatrix4fv(this.program.u_modelViewMatrix, false, modelViewMatrix);

        // Inverse view matrix (for lighting)
        var modelViewInvMatrix = matrixInverse(modelViewMatrix);
        gl.uniformMatrix4fv(this.program.u_modelViewInvMatrix, true, modelViewInvMatrix);

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
                switch (datas[m].type) {
                    case gl.BYTE:
                        byteAdvance = 1 * datas[m].size;
                        break;
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        break;
                    case gl.SHORT:
                        byteAdvance = 2 * datas[m].size;
                        break;
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        break;
                }

                if (m == attributeIndex) {
                    var readView = null;
                    switch (datas[m].type) {
                        case gl.BYTE:
                            readView = new Int8Array(data.buffer, innerOffset, datas[m].size);
                            break;
                        case gl.UNSIGNED_BYTE:
                            readView = new Uint8Array(data.buffer, innerOffset, datas[m].size);
                            break;
                        case gl.SHORT:
                            readView = new Int16Array(data.buffer, innerOffset, datas[m].size);
                            break;
                        case gl.UNSIGNED_SHORT:
                            readView = new Uint16Array(data.buffer, innerOffset, datas[m].size);
                            break;
                        default:
                        case gl.FLOAT:
                            readView = new Float32Array(data.buffer, innerOffset, datas[m].size);
                            break;
                    }

                    // HACK: this is completely and utterly stupidly slow
                    // TODO: speed up extracting attributes
                    switch (datas[m].size) {
                        case 1:
                            result.push([readView[0], 0, 0, 0]);
                            break;
                        case 2:
                            result.push([readView[0], readView[1], 0, 0]);
                            break;
                        case 3:
                            result.push([readView[0], readView[1], readView[2], 0]);
                            break;
                        case 4:
                            result.push([readView[0], readView[1], readView[2], readView[3]]);
                            break;
                    }
                }

                innerOffset += byteAdvance;
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

            // Grab all position data as a list of vec4
            var positionIndex = drawState.positionIndex;
            var positionData = extractAttribute(gl, drawState.arrayBuffer[0], drawState.arrayBuffer[1], positionIndex);



            // TODO: determine actual start/end
            var version = drawState.arrayBuffer[1];
            var attr = version.structure[positionIndex];
            var startIndex = 0;
            var endIndex = positionData.length;

            // Determine the extents of the interesting region
            var minx = Number.MAX_VALUE;
            var miny = Number.MAX_VALUE;
            var minz = Number.MAX_VALUE;
            var maxx = Number.MIN_VALUE;
            var maxy = Number.MIN_VALUE;
            var maxz = Number.MIN_VALUE;
            for (var n = startIndex; n < endIndex; n++) {
                var vec = positionData[n];
                var x = vec[0];
                var y = vec[1];
                var z = vec[2];
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
