// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.Transport');

goog.require('goog.Disposable');



/**
 * Capture output transport interface.
 * Transports
 *
 * @constructor
 * @extends {goog.Disposable}
 */
gli.capture.Transport = function() {
  goog.base(this);
};
goog.inherits(gli.capture.Transport, goog.Disposable);


/**
 * Creates a new session.
 * @param {number} sessionId Session ID.
 */
gli.capture.Transport.prototype.createSession = goog.abstractMethod;


/**
 * Appends a session information blob to the transport buffer.
 * @param {number} sessionId Session ID.
 * @param {!gli.data.SessionInfo} sessionInfo Session information blob.
 */
gli.capture.Transport.prototype.appendSessionInfo = goog.abstractMethod;


/**
 * Appends a resource information blob to the transport buffer.
 * @param {number} sessionId Session ID.
 * @param {number} resourceId The ID of the resource to update.
 * @param {!gli.data.ResourceInfo} resourceInfo Resource information blob.
 */
gli.capture.Transport.prototype.appendResourceInfo = goog.abstractMethod;


/**
 * Appends a resource version to the transport buffer.
 * @param {number} sessionId Session ID.
 * @param {number} resourceId The ID of the resource to update.
 * @param {!gli.data.ResourceVersion} resourceVersion The new resource
 *     version data.
 */
gli.capture.Transport.prototype.appendResourceVersion = goog.abstractMethod;


/**
 * Appends a frame to the transport buffer.
 * @param {number} sessionId Session ID.
 * @param {!gli.data.Frame} frame Frame to append.
 */
gli.capture.Transport.prototype.appendFrame = goog.abstractMethod;
