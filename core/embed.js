// NOTE: this file should only be included when embedding the inspector - no other files should be included (this will do everything)

(function () {

    var pathRoot = "";

    // Find self in the <script> tags
    for (var n = 0; n < document.scripts.length; n++) {
        var scriptTag = document.scripts[n];
        if (/core\/embed.js$/.test(scriptTag.src)) {
            // Found ourself - strip our name and set the root
            var index = scriptTag.src.lastIndexOf("core/embed.js");
            pathRoot = scriptTag.src.substring(0, index);
            break;
        }
    }

    // Load all scripts/css
    function injectCSS(filename) {
        var url = pathRoot + filename;
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
    };

    injectCSS("core/ui/gli.css");

    var jsqueue = [];
    function injectScript(filename) {
        var url = pathRoot + filename;
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
        // ??
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

    // Hook canvas.getContext
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
        var ignoreCanvas = this.internalInspectorSurface;
        if (ignoreCanvas) {
            return originalGetContext.apply(this, arguments);
        }

        if (arguments[0] == "experimental-webgl") {
            // Page is requesting a WebGL context!
            // TODO: something
        }

        var result = originalGetContext.apply(this, arguments);

        if (arguments[0] == "experimental-webgl") {
            // TODO: pull options from somewhere?
            result = gli.inspectContext(this, result, {
                breakOnError: false,
                frameSeparator: null
            });
        }

        return result;
    };

})();
