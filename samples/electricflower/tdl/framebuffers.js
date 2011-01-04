/*
 * Copyright 2009, Google Inc.
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


/**
 * @fileoverview This file contains objects to manage
 *               framebuffers.
 */

tdl.provide('tdl.framebuffers');

tdl.require('tdl.textures');

/**
 * A module for textures.
 * @namespace
 */
tdl.framebuffers = tdl.framebuffers || {};

tdl.framebuffers.createFramebuffer = function(width, height, opt_depth) {
  return new tdl.framebuffers.Framebuffer(width, height, opt_depth);
}

tdl.framebuffers.BackBuffer = function(canvas) {
  this.depth = true;
  this.buffer = null;
}

tdl.framebuffers.BackBuffer.prototype.bind = function() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
}

if (Object.prototype.__defineSetter__) {
tdl.framebuffers.BackBuffer.prototype.__defineGetter__(
    'width',
    function () {
      return gl.canvas.width;
    }
);

tdl.framebuffers.BackBuffer.prototype.__defineGetter__(
    'height',
    function () {
      return gl.canvas.height;
    }
);
}

// Use this where you need to pass in a framebuffer, but you really
// mean the backbuffer, so that binding it works as expected.
tdl.framebuffers.getBackBuffer = function(canvas) {
  return new tdl.framebuffers.BackBuffer(canvas)
}

tdl.framebuffers.Framebuffer = function(width, height, opt_depth) {
  this.width = width;
  this.height = height;
  this.depth = opt_depth;
  this.recoverFromLostContext();
};

tdl.framebuffers.Framebuffer.prototype.bind = function() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  gl.viewport(0, 0, this.width, this.height);
};

tdl.framebuffers.Framebuffer.unbind = function() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

tdl.framebuffers.Framebuffer.prototype.unbind = function() {
  tdl.framebuffers.Framebuffer.unbind();
};

tdl.framebuffers.Framebuffer.prototype.recoverFromLostContext = function() {
  var tex = new tdl.textures.SolidTexture([0,0,0,0]);
  gl.bindTexture(gl.TEXTURE_2D, tex.texture);
  tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,
                0,                 // level
                gl.RGBA,           // internalFormat
                this.width,        // width
                this.height,       // height
                0,                 // border
                gl.RGBA,           // format
                gl.UNSIGNED_BYTE,  // type
                null);             // data
  if (this.depth) {
    var db = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, db);
    gl.renderbufferStorage(
        gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex.texture,
      0);
  if (this.depth) {
    gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        db);
  }
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    throw("gl.checkFramebufferStatus() returned " + WebGLDebugUtils.glEnumToString(status));
  }
  this.framebuffer = fb;
  this.texture = tex;
}

