// Once the DOM is ready, bind to the content event
document.addEventListener("DOMContentLoaded", function () {

    var hasInjected = false;
    function performInjection() {
        if (hasInjected == false) {
            hasInjected = true;

            function injectCSS(filename) {
                var url = chrome.extension.getURL(filename);
                var link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = url;
                document.head.appendChild(link);
            };

            injectCSS("core/ui/gli.css");

            var jsqueue = [];
            function injectScript(filename) {
                var url = chrome.extension.getURL(filename);
                jsqueue.push(url);
            };

            injectScript("core/inspector.js");
            injectScript("core/utilities.js");
            injectScript("core/info.js");
            injectScript("core/context.js");
            injectScript("core/stream.js");
            injectScript("core/replay.js");

            injectScript("core/resources/resource.js");
            injectScript("core/resources/buffer.js");
            injectScript("core/resources/framebuffer.js");
            injectScript("core/resources/program.js");
            injectScript("core/resources/renderbuffer.js");
            injectScript("core/resources/shader.js");
            injectScript("core/resources/texture.js");

            injectScript("core/ui/dom.js");
            injectScript("core/ui/window.js");
            injectScript("core/ui/framelisting.js");
            injectScript("core/ui/traceview.js");
            injectScript("core/ui/tracelisting.js");
            injectScript("core/ui/traceinspector.js");
            injectScript("core/ui/statehud.js");
            injectScript("core/ui/outputhud.js");

            function scriptsLoaded() {
                // Fake a context loss/restore
                var resetEvent = document.createEvent("Event");
                resetEvent.initEvent("WebGLForceResetEvent", true, true);
                document.body.dispatchEvent(resetEvent);
            }

            function processScript() {
                if (jsqueue.length == 0) {
                    scriptsLoaded();
                    return;
                }
                var url = jsqueue[0];
                jsqueue = jsqueue.slice(1);
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = url;
                script.onload = function () { processScript(); };
                document.head.appendChild(script);
            };
            processScript();
        }
    }

    chrome.extension.onRequest.addListener(function (msg) {
        if (msg.inject == true) {
            performInjection();
        }
        //sendResponse({});
    });

    document.body.addEventListener("WebGLEnabledEvent", function () {
        chrome.extension.sendRequest({}, function (response) { });
    }, false);
}, false);


// --------- NOTE: THIS FUNCTION IS INJECTED INTO THE PAGE DIRECTLY ---------
// This relies on us being executed before the dom is ready so that we can overwrite any calls
// to canvas.getContext. When a call is made, we fire off an event that is handled in our extension
// above (as chrome.extension.* is not available from the page).
function main() {
    var webglcanvases = null;

    // Create enabled event
    function fireEnabledEvent() {
        if (webglcanvases == null) {
            // Only setup events/etc on first enable
            webglcanvases = [];

            // Setup handling for reset
            function resetCanvas(canvas) {
                var lostEvent = document.createEvent("Event");
                lostEvent.initEvent("webglcontextlost", true, true);
                canvas.dispatchEvent(lostEvent);
                var restoreEvent = document.createEvent("Event");
                restoreEvent.initEvent("webglcontextrestored", true, true);
                canvas.dispatchEvent(restoreEvent);
            };

            // Listen for reset events
            document.body.addEventListener("WebGLForceResetEvent", function () {
                for (var n = 0; n < webglcanvases.length; n++) {
                    resetCanvas(webglcanvases[n]);
                }
            }, false);
        }

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
    HTMLCanvasElement.prototype.getContext = function () {
        var ignoreCanvas = this.internalInspectorSurface;
        if (ignoreCanvas) {
            return originalGetContext.apply(this, arguments);
        }

        if (arguments[0] == "experimental-webgl") {
            // Page is requesting a WebGL context!
            fireEnabledEvent(this);
            if (webglcanvases.indexOf(this) == -1) {
                webglcanvases.push(this);
            }
        }

        var result = originalGetContext.apply(this, arguments);

        if (arguments[0] == "experimental-webgl") {
            // If we are injected, inspect this context
            var hasgli = false;
            try {
                if (gli) {
                    hasgli = true;
                }
            } catch (e) {
            }
            if (hasgli) {
                if (gli.inspectContext) {
                    // TODO: pull options from extension
                    result = gli.inspectContext(this, result, {
                        breakOnError: false,
                        frameSeparator: 'finish'
                    });
                }
            }
        }

        return result;
    };
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + main + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);
