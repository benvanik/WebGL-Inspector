var tabs = require("tabs");
var contextMenu = require("context-menu");

exports.main = function (options, callbacks) {
};

exports.onUnload = function (reason) {
};

// --------- NOTE: THIS FUNCTION IS INJECTED INTO THE PAGE DIRECTLY ---------
// This relies on us being executed before the dom is ready so that we can overwrite any calls
// to canvas.getContext.
function contentScript() {
    
    var hasAnyWebGL = true;
    
    // Validation status
    on("context", function () {
        return hasAnyWebGL;
    });
    
    on("click", function () {
        postMessage({});
    });
    
    // Create enabled event
    function fireEnabledEvent() {
        // If gli exists, then we are already present and shouldn't do anything
        if (!window.gli) {
            hasAnyWebGL = true;
        } else {
            if (window.console) {
                console.log("WebGL Inspector already embedded on the page - disabling extension");
            }
        }
    };
/*
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
    };*/
}

var debugMode = false;
var sessionKey = "WebGLInspectorEnabled" + (debugMode ? "Debug" : "");

var inspectItem = contextMenu.Item({
    label: "Inspect WebGL",
    context: contextMenu.PageContext(),
    contentScript: '(' + contentScript + ')();',
    onMessage: function () {
        var tab = tabs.activeTab;
        var sessionStorage = tab.contentWindow.sessionStorage;
        if (sessionStorage[sessionKey] == "yes") {
            sessionStorage[sessionKey] = "no";
        } else {
            sessionStorage[sessionKey] = "yes"
        }
        tab.contentWindow.location.reload();
    }
});

tabs.onOpen.add(function (tab) {
    var sessionStorage = tab.contentWindow.sessionStorage;
    if (sessionStorage[sessionKey] == "yes") {
        var tab = tabs.activeTab;
        var document = tab.contentDocument;

        var pathRoot = packaging.getURLForData("/");

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
    }
});
