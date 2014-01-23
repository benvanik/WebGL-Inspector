// Rewrite getContext to snoop for webgl
var originalGetContext = HTMLCanvasElement.prototype.getContext;
if (!HTMLCanvasElement.prototype.getContextRaw) {
  HTMLCanvasElement.prototype.getContextRaw = originalGetContext;
}
HTMLCanvasElement.prototype.getContext = function () {
  var ignoreCanvas = this.internalInspectorSurface;
  if (ignoreCanvas) {
    return originalGetContext.apply(this, arguments);
  }

  var contextNames = ["moz-webgl", "webkit-3d", "experimental-webgl", "webgl"];
  var requestingWebGL = contextNames.indexOf(arguments[0]) != -1;

  if (requestingWebGL) {
    // Page is requesting a WebGL context!
    // TODO: something
  }

  var result = originalGetContext.apply(this, arguments);
  if (result == null) {
    return null;
  }

  if (requestingWebGL) {
    // TODO: pull options from somewhere?
    result = gli.host.inspectContext(this, result);
    var hostUI = new gli.host.HostUI(result);
    result.hostUI = hostUI; // just so we can access it later for debugging
  }

  return result;
};

