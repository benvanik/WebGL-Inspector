(function () {
    var ui = glinamespace("gli.ui");

    var BufferPreview = function (canvas) {
        this.document = canvas.ownerDocument;
        this.canvas = canvas;
        this.drawState = null;
        
        var expandLink = this.expandLink = document.createElement("span");
        expandLink.className = "surface-inspector-collapsed";
        expandLink.innerHTML = "Show preview";
        expandLink.style.visibility = "collapse";
        canvas.parentNode.appendChild(expandLink);

        var gl = this.gl = gli.util.getWebGLContext(canvas);
        
        var vsSource =
        'uniform mat4 u_projMatrix;' +
        'uniform mat4 u_modelViewMatrix;' +
        'uniform mat4 u_modelViewInvMatrix;' +
        'uniform bool u_enableLighting;' +
        'attribute vec3 a_position;' +
        'attribute vec3 a_normal;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    gl_Position = u_projMatrix * u_modelViewMatrix * vec4(a_position, 1.0);' +
        '    if (u_enableLighting) {' +
        '        vec3 lightDirection = vec3(0.0, 0.0, 1.0);' +
        '        vec4 normalT = u_modelViewInvMatrix * vec4(a_normal, 1.0);' +
        '        float lighting = max(dot(normalT.xyz, lightDirection), 0.0);' +
        '        v_lighting = vec3(0.2, 0.2, 0.2) + vec3(1.0, 1.0, 1.0) * lighting;' +
        '    } else {' +
        '        v_lighting = vec3(1.0, 1.0, 1.0);' +
        '    }' +
        '    gl_PointSize = 3.0;' +
        '}';
        var fsSource =
        'precision highp float;' +
        'uniform bool u_wireframe;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    vec4 color;' +
        '    if (u_wireframe) {' +
        '        color = vec4(1.0, 1.0, 1.0, 0.4);' +
        '    } else {' +
        '        color = vec4(1.0, 0.0, 0.0, 1.0);' +
        '    }' +
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
        this.program.a_normal = gl.getAttribLocation(this.program, "a_normal");
        this.program.u_projMatrix = gl.getUniformLocation(this.program, "u_projMatrix");
        this.program.u_modelViewMatrix = gl.getUniformLocation(this.program, "u_modelViewMatrix");
        this.program.u_modelViewInvMatrix = gl.getUniformLocation(this.program, "u_modelViewInvMatrix");
        this.program.u_enableLighting = gl.getUniformLocation(this.program, "u_enableLighting");
        this.program.u_wireframe = gl.getUniformLocation(this.program, "u_wireframe");

        // Default state
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.CULL_FACE);

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
        var gl = this.gl;
        
        this.setBuffer(null);

        gl.deleteProgram(this.program);
        this.program = null;

        this.gl = null;
        this.canvas = null;
    };

    BufferPreview.prototype.draw = function () {
        var gl = this.gl;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if (!this.drawState) {
            return;
        }
        var ds = this.drawState;

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
        function transpose(m) {
            var rows = 4, cols = 4;
            var elements = new Array(16), ni = cols, i, nj, j;
            do {
                i = cols - ni;
                nj = rows;
                do {
                    j = rows - nj;
                    elements[i * 4 + j] = m[j * 4 + i];
                } while (--nj);
            } while (--ni);
            return elements;
        };
        modelViewInvMatrix = transpose(modelViewInvMatrix);
        gl.uniformMatrix4fv(this.program.u_modelViewInvMatrix, false, modelViewInvMatrix);

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        if (!this.triBuffer) {
            // No custom buffer, draw raw user stuff
            gl.uniform1i(this.program.u_enableLighting, 0);
            gl.uniform1i(this.program.u_wireframe, 0);
            gl.enableVertexAttribArray(this.program.a_position);
            gl.disableVertexAttribArray(this.program.a_normal);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBufferTarget);
            gl.vertexAttribPointer(this.program.a_position, ds.position.size, ds.position.type, ds.position.normalized, ds.position.stride, ds.position.offset);
            gl.vertexAttribPointer(this.program.a_normal, 3, gl.FLOAT, false, ds.position.stride, 0);
            if (this.elementArrayBufferTarget) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBufferTarget);
                gl.drawElements(ds.mode, ds.count, ds.elementArrayType, ds.offset);
            } else {
                gl.drawArrays(ds.mode, ds.first, ds.count);
            }
        } else {
            // Draw triangles
            if (this.triBuffer) {
                gl.uniform1i(this.program.u_enableLighting, 1);
                gl.uniform1i(this.program.u_wireframe, 0);
                gl.enableVertexAttribArray(this.program.a_position);
                gl.enableVertexAttribArray(this.program.a_normal);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuffer);
                gl.vertexAttribPointer(this.program.a_position, 3, gl.FLOAT, false, 24, 0);
                gl.vertexAttribPointer(this.program.a_normal, 3, gl.FLOAT, false, 24, 12);
                gl.drawArrays(gl.TRIANGLES, 0, this.triBuffer.count);
            }

            // Draw wireframe
            if (this.lineBuffer) {
                gl.enable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
                gl.uniform1i(this.program.u_enableLighting, 0);
                gl.uniform1i(this.program.u_wireframe, 1);
                gl.enableVertexAttribArray(this.program.a_position);
                gl.disableVertexAttribArray(this.program.a_normal);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
                gl.vertexAttribPointer(this.program.a_position, 3, gl.FLOAT, false, 0, 0);
                gl.vertexAttribPointer(this.program.a_normal, 3, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.LINES, 0, this.lineBuffer.count);
            }
        }
    };

    function extractAttribute(gl, buffer, version, attrib) {
        var data = buffer.constructVersion(gl, version);
        if (!data) {
            return null;
        }
        var dataBuffer = data.buffer ? data.buffer : data;

        var result = [];

        var byteAdvance = 0;
        switch (attrib.type) {
            case gl.BYTE:
            case gl.UNSIGNED_BYTE:
                byteAdvance = 1 * attrib.size;
                break;
            case gl.SHORT:
            case gl.UNSIGNED_SHORT:
                byteAdvance = 2 * attrib.size;
                break;
            default:
            case gl.FLOAT:
                byteAdvance = 4 * attrib.size;
                break;
        }
        var stride = attrib.stride ? attrib.stride : byteAdvance;
        var byteOffset = 0;
        while (byteOffset < data.byteLength) {
            var readView = null;
            switch (attrib.type) {
                case gl.BYTE:
                    readView = new Int8Array(dataBuffer, byteOffset, attrib.size);
                    break;
                case gl.UNSIGNED_BYTE:
                    readView = new Uint8Array(dataBuffer, byteOffset, attrib.size);
                    break;
                case gl.SHORT:
                    readView = new Int16Array(dataBuffer, byteOffset, attrib.size);
                    break;
                case gl.UNSIGNED_SHORT:
                    readView = new Uint16Array(dataBuffer, byteOffset, attrib.size);
                    break;
                default:
                case gl.FLOAT:
                    readView = new Float32Array(dataBuffer, byteOffset, attrib.size);
                    break;
            }

            // HACK: this is completely and utterly stupidly slow
            // TODO: speed up extracting attributes
            switch (attrib.size) {
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

            byteOffset += stride;
        }

        return result;
    };

    function buildTriangles(gl, drawState, start, count, positionData, indices) {
        var triangles = [];

        var end = start + count;

        // Emit triangles
        switch (drawState.mode) {
            case gl.TRIANGLES:
                if (indices) {
                    for (var n = start; n < end; n += 3) {
                        triangles.push([indices[n], indices[n + 1], indices[n + 2]]);
                    }
                } else {
                    for (var n = start; n < end; n += 3) {
                        triangles.push([n, n + 1, n + 2]);
                    }
                }
                break;
            case gl.TRIANGLE_FAN:
                if (indices) {
                    triangles.push([indices[start], indices[start + 1], indices[start + 2]]);
                    for (var n = start + 2; n < end; n++) {
                        triangles.push([indices[start], indices[n], indices[n + 1]]);
                    }
                } else {
                    triangles.push([start, start + 1, start + 2]);
                    for (var n = start + 2; n < end; n++) {
                        triangles.push([start, n, n + 1]);
                    }
                }
                break;
            case gl.TRIANGLE_STRIP:
                if (indices) {
                    for (var n = start; n < end - 2; n++) {
                        if (indices[n] == indices[n + 1]) {
                            // Degenerate
                            continue;
                        }
                        if (n % 2 == 0) {
                            triangles.push([indices[n], indices[n + 1], indices[n + 2]]);
                        } else {
                            triangles.push([indices[n + 2], indices[n + 1], indices[n]]);
                        }
                    }
                } else {
                    for (var n = start; n < end - 2; n++) {
                        if (n % 2 == 0) {
                            triangles.push([n, n + 1, n + 2]);
                        } else {
                            triangles.push([n + 2, n + 1, n]);
                        }
                    }
                }
                break;
        }

        return triangles;
    };

    // from tdl
    function normalize(a) {
        var r = [];
        var n = 0.0;
        var aLength = a.length;
        for (var i = 0; i < aLength; i++) {
            n += a[i] * a[i];
        }
        n = Math.sqrt(n);
        if (n > 0.00001) {
            for (var i = 0; i < aLength; i++) {
                r[i] = a[i] / n;
            }
        } else {
            r = [0, 0, 0];
        }
        return r;
    };

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
    BufferPreview.prototype.setBuffer = function (drawState, force) {
        var self = this;
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

        var maxPreviewBytes = 40000;
        if (drawState && !force && drawState.arrayBuffer[1].parameters[gl.BUFFER_SIZE] > maxPreviewBytes) {
            // Buffer is really big - delay populating
            this.expandLink.style.visibility = "visible";
            this.expandLink.onclick = function () {
                self.setBuffer(drawState, true);
                self.expandLink.style.visibility = "collapse";
            };
            this.drawState = null;
            this.draw();
        } else if (drawState) {
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
            var positionData = extractAttribute(gl, drawState.arrayBuffer[0], drawState.arrayBuffer[1], drawState.position);

            // Pull out indices (or null if none)
            var indices = null;
            if (drawState.elementArrayBuffer) {
                indices = drawState.elementArrayBuffer[0].constructVersion(gl, drawState.elementArrayBuffer[1]);
            }

            // Get interested range
            var start;
            var count = drawState.count;
            if (drawState.elementArrayBuffer) {
                // Indexed
                start = drawState.offset;
                switch (drawState.elementArrayType) {
                    case gl.UNSIGNED_BYTE:
                        start /= 1;
                        break;
                    case gl.UNSIGNED_SHORT:
                        start /= 2;
                        break;
                }
            } else {
                // Unindexed
                start = drawState.first;
            }

            // Get all triangles as a list of 3-set [v1,v2,v3] vertex indices
            var areTriangles = false;
            switch (drawState.mode) {
                case gl.TRIANGLES:
                case gl.TRIANGLE_FAN:
                case gl.TRIANGLE_STRIP:
                    areTriangles = true;
                    break;
            }
            if (areTriangles) {
                this.triangles = buildTriangles(gl, drawState, start, count, positionData, indices);
                var i;

                // Generate interleaved position + normal data from triangles as a TRIANGLES list
                var triData = new Float32Array(this.triangles.length * 3 * 3 * 2);
                i = 0;
                for (var n = 0; n < this.triangles.length; n++) {
                    var tri = this.triangles[n];
                    var v1 = positionData[tri[0]];
                    var v2 = positionData[tri[1]];
                    var v3 = positionData[tri[2]];

                    // a = v2 - v1
                    var a = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
                    // b = v3 - v1
                    var b = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
                    // a x b
                    var normal = normalize([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);

                    triData[i++] = v1[0]; triData[i++] = v1[1]; triData[i++] = v1[2];
                    triData[i++] = normal[0]; triData[i++] = normal[1]; triData[i++] = normal[2];
                    triData[i++] = v2[0]; triData[i++] = v2[1]; triData[i++] = v2[2];
                    triData[i++] = normal[0]; triData[i++] = normal[1]; triData[i++] = normal[2];
                    triData[i++] = v3[0]; triData[i++] = v3[1]; triData[i++] = v3[2];
                    triData[i++] = normal[0]; triData[i++] = normal[1]; triData[i++] = normal[2];
                }
                this.triBuffer = gl.createBuffer();
                this.triBuffer.count = this.triangles.length * 3;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, triData, gl.STATIC_DRAW);

                // Generate LINES list for wireframe
                var lineData = new Float32Array(this.triangles.length * 3 * 2 * 3);
                i = 0;
                for (var n = 0; n < this.triangles.length; n++) {
                    var tri = this.triangles[n];
                    var v1 = positionData[tri[0]];
                    var v2 = positionData[tri[1]];
                    var v3 = positionData[tri[2]];
                    lineData[i++] = v1[0]; lineData[i++] = v1[1]; lineData[i++] = v1[2];
                    lineData[i++] = v2[0]; lineData[i++] = v2[1]; lineData[i++] = v2[2];
                    lineData[i++] = v2[0]; lineData[i++] = v2[1]; lineData[i++] = v2[2];
                    lineData[i++] = v3[0]; lineData[i++] = v3[1]; lineData[i++] = v3[2];
                    lineData[i++] = v3[0]; lineData[i++] = v3[1]; lineData[i++] = v3[2];
                    lineData[i++] = v1[0]; lineData[i++] = v1[1]; lineData[i++] = v1[2];
                }
                this.lineBuffer = gl.createBuffer();
                this.lineBuffer.count = this.triangles.length * 3 * 2;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.STATIC_DRAW);
            } else {
                this.triangles = null;
                this.triBuffer = null;
                this.lineBuffer = null;
            }

            // Determine the extents of the interesting region
            var minx = Number.MAX_VALUE; var miny = Number.MAX_VALUE; var minz = Number.MAX_VALUE;
            var maxx = Number.MIN_VALUE; var maxy = Number.MIN_VALUE; var maxz = Number.MIN_VALUE;
            if (indices) {
                for (var n = start; n < start + count; n++) {
                    var vec = positionData[indices[n]];
                    minx = Math.min(minx, vec[0]); maxx = Math.max(maxx, vec[0]);
                    miny = Math.min(miny, vec[1]); maxy = Math.max(maxy, vec[1]);
                    minz = Math.min(minz, vec[2]); maxz = Math.max(maxz, vec[2]);
                }
            } else {
                for (var n = start; n < start + count; n++) {
                    var vec = positionData[n];
                    minx = Math.min(minx, vec[0]); maxx = Math.max(maxx, vec[0]);
                    miny = Math.min(miny, vec[1]); maxy = Math.max(maxy, vec[1]);
                    minz = Math.min(minz, vec[2]); maxz = Math.max(maxz, vec[2]);
                }
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
            
            this.drawState = drawState;
            this.draw();
        } else {
            this.drawState = null;
            this.draw();
        }
    };

    BufferPreview.prototype.setupDefaultInput = function () {
        var self = this;

        // Drag rotate
        var lastValueX = 0;
        var lastValueY = 0;
        function mouseMove(e) {
            var dx = e.screenX - lastValueX;
            var dy = e.screenY - lastValueY;
            lastValueX = e.screenX;
            lastValueY = e.screenY;

            var camera = self.camera;
            camera.rotx += dx * Math.PI / 180;
            camera.roty += dy * Math.PI / 180;
            self.draw();

            e.preventDefault();
            e.stopPropagation();
        };
        function mouseUp(e) {
            endDrag();
            e.preventDefault();
            e.stopPropagation();
        };
        function beginDrag() {
            self.document.addEventListener("mousemove", mouseMove, true);
            self.document.addEventListener("mouseup", mouseUp, true);
            self.canvas.style.cursor = "move";
            self.document.body.style.cursor = "move";
        };
        function endDrag() {
            self.document.removeEventListener("mousemove", mouseMove, true);
            self.document.removeEventListener("mouseup", mouseUp, true);
            self.canvas.style.cursor = "";
            self.document.body.style.cursor = "";
        };
        this.canvas.onmousedown = function (e) {
            beginDrag();
            lastValueX = e.screenX;
            lastValueY = e.screenY;
            e.preventDefault();
            e.stopPropagation();
        };

        // Zoom
        this.canvas.onmousewheel = function (e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = e.wheelDelta / 120;
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                var camera = self.camera;
                camera.distance -= delta * (camera.defaultDistance / 10.0);
                camera.distance = Math.max(camera.defaultDistance / 10.0, camera.distance);
                self.draw();
            }

            e.preventDefault();
            e.stopPropagation();
            e.returnValue = false;
        };
        this.canvas.addEventListener("DOMMouseScroll", this.canvas.onmousewheel, false);
    };

    ui.BufferPreview = BufferPreview;
})();
