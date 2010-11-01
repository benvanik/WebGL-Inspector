var hasInjected = false;

// If we're reloading after enabling the inspector, load immediately
if (sessionStorage.WebGLInspectorEnabled == "yes") {
    hasInjected = true;

    // We have the loader.js file ready to help out
    var pathRoot = safari.extension.baseURI;
    gliloader.load(pathRoot, ["host", "replay", "ui"]);
    
    safari.self.tab.dispatchMessage("notifyPresent", {});
}

// Once the DOM is ready, bind to the content event
document.addEventListener("DOMContentLoaded", function () {

    safari.self.addEventListener("message", function (event) {
        if (sessionStorage.WebGLInspectorEnabled == "yes") {
            sessionStorage.WebGLInspectorEnabled = "no";
        } else {
            sessionStorage.WebGLInspectorEnabled = "yes"
        }
        window.location.reload();
    }, false);

    document.body.addEventListener("WebGLEnabledEvent", function () {
        safari.self.tab.dispatchMessage("message", {present: true});
    }, false);
    
}, false);

// Always start absent
safari.self.tab.dispatchMessage("message", {present: false});


// --------- NOTE: THIS FUNCTION IS INJECTED INTO THE PAGE DIRECTLY ---------
// This relies on us being executed before the dom is ready so that we can overwrite any calls
// to canvas.getContext. When a call is made, we fire off an event that is handled in our extension
// above (as safari.extension.* is not available from the page).
function main() {
    // Create enabled event
    function fireEnabledEvent() {
        // If gli exists, then we are already present and shouldn't do anything
        if (!window.gli) {
            var enabledEvent = document.createEvent("Event");
            enabledEvent.initEvent("WebGLEnabledEvent", true, true);
            document.body.dispatchEvent(enabledEvent);
        } else {
            console.log("WebGL Inspector already embedded on the page - disabling extension");
        }
    };

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

        var result = originalGetContext.apply(this, arguments);
        if (result == null) {
            return null;
        }

        var contextNames = ["moz-webgl", "webkit-3d", "experimental-webgl", "webgl"];
        var requestingWebGL = contextNames.indexOf(arguments[0]) != -1;
        if (requestingWebGL) {
            // Page is requesting a WebGL context!
            fireEnabledEvent(this);
        }

        if (requestingWebGL) {
            // If we are injected, inspect this context
            if (window["gli"] !== undefined) {
                if (gli.host.inspectContext) {
                    // TODO: pull options from extension
                    result = gli.host.inspectContext(this, result);

                    // HACK: don't do this
                    var button = document.createElement("a");
                    button.href = "javascript:_captureFrame();";
                    button.innerHTML = "cap";
                    document.body.appendChild(button);
                    document.body.appendChild(document.createElement("br"));

                    window._controller = new gli.replay.Controller();
                    var canvas = document.createElement("canvas");
                    canvas.width = this.width;
                    canvas.height = this.height;
                    document.body.appendChild(canvas);
                    _controller.setOutput(canvas);

                    window._captureFrame = function () {
                        result.requestCapture(function (context, frame) {
                            _controller.runFrame(frame);
                        });
                    };
                }
            }
        }

        return result;
    };
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + main + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);
