//var debugMode = true;
if (!window["debugMode"]) {
    window["debugMode"] = false;
}
var hasInjected = false;
var sessionKey = "WebGLInspectorEnabled" + (debugMode ? "Debug" : "");

// If we're reloading after enabling the inspector, load immediately
if (sessionStorage[sessionKey] == "yes") {
    hasInjected = true;

    var pathRoot = chrome.extension.getURL("");

    if (debugMode) {
        // We have the loader.js file ready to help out
        gliloader.pathRoot = pathRoot;
        gliloader.load(["loader", "host", "replay", "ui"], function () {
            // ?
        });
    } else {
        var jsurl = pathRoot + "gli.all.js";
        var cssurl = pathRoot + "gli.all.css";

        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssurl;
        (document.body || document.head || document.documentElement).appendChild(link);

        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = jsurl;
        (document.body || document.head || document.documentElement).appendChild(script);
    }

    // Show icon
    chrome.extension.sendRequest({}, function (response) { });
}

// Once the DOM is ready, bind to the content event
document.addEventListener("DOMContentLoaded", function () {

    chrome.extension.onRequest.addListener(function (msg) {
        if (msg.reload == true) {
            if (sessionStorage[sessionKey] == "yes") {
                sessionStorage[sessionKey] = "no";
            } else {
                sessionStorage[sessionKey] = "yes"
            }
            window.location.reload();
        }
        //sendResponse({});
    });

    if (document.body) {
        document.body.addEventListener("WebGLEnabledEvent", function () {
            chrome.extension.sendRequest({}, function (response) { });
        }, false);
    }

    if (debugMode) {
        // Setup message passing for path root interchange
        if (sessionStorage[sessionKey] == "yes") {
            var pathElement = document.createElement("div");
            pathElement.id = "__webglpathroot";
            pathElement.style.display = "none";
            document.body.appendChild(pathElement);

            setTimeout(function () {
                var readyEvent = document.createEvent("Event");
                readyEvent.initEvent("WebGLInspectorReadyEvent", true, true);
                var pathElement = document.getElementById("__webglpathroot");
                pathElement.innerText = gliloader.pathRoot;
                document.body.dispatchEvent(readyEvent);
            }, 0);
        }
    }
}, false);


// --------- NOTE: THIS FUNCTION IS INJECTED INTO THE PAGE DIRECTLY ---------
// This relies on us being executed before the dom is ready so that we can overwrite any calls
// to canvas.getContext. When a call is made, we fire off an event that is handled in our extension
// above (as chrome.extension.* is not available from the page).
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

    // Grab the path root from the extension
    document.addEventListener("WebGLInspectorReadyEvent", function (e) {
        var pathElement = document.getElementById("__webglpathroot");
        gliloader.pathRoot = pathElement.innerText;
    }, false);

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
                    var hostUI = new gli.host.HostUI(result);
                    result.hostUI = hostUI; // just so we can access it later for debugging
                }
            }
        }

        return result;
    };
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + main + ')();'));
if (document.body || document.head || document.documentElement) {
    // NOTE: only valid html documents get body/head, so this is a nice way to not inject on them
    (document.body || document.head || document.documentElement).appendChild(script);
}
