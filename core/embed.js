// NOTE: this file should only be included when embedding the inspector - no other files should be included (this will do everything)

// If gliEmbedDebug == true, split files will be used, otherwise the cat'ed scripts will be inserted

(function () {

    var pathRoot = "";

    var useDebug = window.gliEmbedDebug;

    // Find self in the <script> tags
    var scripts = document.head.getElementsByTagName("script");
    for (var n = 0; n < scripts.length; n++) {
        var scriptTag = scripts[n];
        var src = scriptTag.src.toLowerCase();
        if (/core\/embed.js$/.test(src)) {
            // Found ourself - strip our name and set the root
            var index = src.lastIndexOf("embed.js");
            pathRoot = scriptTag.src.substring(0, index);
            break;
        }
    }

    function insertHeaderNode(node) {
        var targets = [document.body, document.head, document.documentElement];
        for (var n = 0; n < targets.length; n++) {
            var target = targets[n];
            if (target) {
                if (target.firstElementChild) {
                    target.insertBefore(node, target.firstElementChild);
                } else {
                    target.appendChild(node);
                }
                break;
            }
        }
    };

    function insertStylesheet(url) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        insertHeaderNode(link);
        return link;
    };

    function insertScript(url) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        insertHeaderNode(script);
        return script;
    };

    if (useDebug) {
        // Fall through below and use the loader to get things
    } else {
        var jsurl = pathRoot + "lib/gli.all.js";
        var cssurl = pathRoot + "lib/gli.all.css";

        window.gliCssUrl = cssurl;

        insertStylesheet(cssurl);
        insertScript(jsurl);
    }

    // Always load the loader
    if (useDebug) {
        var script = insertScript(pathRoot + "loader.js");
        function scriptLoaded() {
            gliloader.pathRoot = pathRoot;
            if (useDebug) {
                // In debug mode load all the scripts
                gliloader.load(["capture", "playback", "ui"]);
            }
        };
        script.onreadystatechange = function () {
            if (("loaded" === script.readyState || "complete" === script.readyState) && !script.loadCalled) {
                this.loadCalled = true;
                scriptLoaded();
            }
        };
        script.onload = function () {
            if (!script.loadCalled) {
                this.loadCalled = true;
                scriptLoaded();
            }
        };
    }

    // Hook canvas.getContext
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    if (!HTMLCanvasElement.prototype.getContextRaw) {
        HTMLCanvasElement.prototype.getContextRaw = originalGetContext;
    }
    HTMLCanvasElement.prototype.getContext = function () {
        var ignoreCanvas = this.internalInspectorSurface;
        if (ignoreCanvas) {
            return originalGetContext.apply(this, arguments);
        }
        
        var contextNames = ["experimental-webgl", "webgl"];
        var requestingWebGL = contextNames.indexOf(arguments[0]) != -1;

        if (requestingWebGL) {
            // Page is requesting a WebGL context!
        }

        var result = originalGetContext.apply(this, arguments);
        if (result === null) {
            return null;
        }

        if (requestingWebGL) {
            // TODO: pull transport from somewhere
            //var transport = new gli.capture.transports.DebugTransport();
            //var transport = new gli.capture.transports.JsonTransport();
            var transport = new gli.capture.transports.LocalTransport();
            
            // TODO: pull options from somewhere
            var options = {};
            
            // Do injection
            result = gli.capture.debugContext(result, transport, options);
            
            // Setup shared host (if needed)
            if (!window.gliCaptureHost) {
                window.gliCaptureHost = new gli.capture.CaptureHost();
            }
            window.gliCaptureHost.registerContext(result);
            
            if (gli.ui) {
                // TODO: remove from here?
                result.hostUI = new gli.ui.HostUI(result);
            }
        }

        return result;
    };

})();
