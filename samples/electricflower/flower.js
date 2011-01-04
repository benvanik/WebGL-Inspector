/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function FlowerEffect() {
  var arrays = tdl.primitives.createFlaredCube(0.01, 3.0, 1400)
  var program = createProgramFromTags("flower_vs", "flower_fs")
  var textures = []

  var proj = new Float32Array(16)
  var view = new Float32Array(16)
  var world = new Float32Array(16)

  var viewproj = new Float32Array(16)
  var worldviewproj = new Float32Array(16)

  var model = new tdl.models.Model(program, arrays, textures);

  var eyePosition = new Float32Array([0, 0, 3])
  var target = new Float32Array([-0.3, 0, 0])

  var m4 = tdl.fast.matrix4

  m4.lookAt(view, eyePosition, target, up);

  // Returns RGBA quad as array.
  function hsv2rgb(h, s, v, a) {
    h *= 6
    var i = Math.floor(h);
    var f = h - i;
    if (!(i & 1)) f = 1 - f; // if i is even
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    switch (i) {
      case 6:
      case 0: return [v, n, m, a]
      case 1: return [n, v, m, a]
      case 2: return [m, v, n, a]
      case 3: return [m, n, v, a]
      case 4: return [n, m, v, a]
      case 5: return [v, m, n, a]
    }
  }

  this.render = function(framebuffer, time, postproc) {
    m4.perspective(proj, tdl.math.degToRad(60), aspect, 0.1, 500);
    m4.rotationY(world, time*0.2)
    m4.mul(viewproj, view, proj)
    m4.mul(worldviewproj, world, viewproj)

    if (postproc != 0) post.begin()

    gl.clearColor(0.1, 0.2, 0.3, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    var boom = 0.0 //0.5 + Math.sin(time)*0.5
    var uniformsConst = {
      u_time: time,
      u_color: hsv2rgb((time * 0.1) % 1.0, 0.8, 0.1, 1),
      u_color2: hsv2rgb((time * 0.22124) % 1.0, 0.7, 0.1, 0),
    }
    var uniformsPer = {
      u_worldviewproj: worldviewproj
    }
    model.drawPrep(uniformsConst)
    model.draw(uniformsPer)
    gl.disable(gl.BLEND);

    switch (postproc) {
      case 1:
        post.end(framebuffer, post.hypnoGlow, {x: 3, y: 3, sub: 0.2});
        break;
      case 2:
        post.end(framebuffer, post.focusBlur, {x: 2, y: 2});
        break;
      case 3:
        post.end(framebuffer, post.radialBlur, {strength: 0.3, glow: 1.0});
        break;
    }
  }
}