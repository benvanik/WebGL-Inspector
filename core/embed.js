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

    // Load the loader - when it's done loading, use it to bootstrap the rest
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = pathRoot + "core/loader.js";
    script.onload = function () {
        gliloader.loadContent(pathRoot, function () {
        });
    };
    document.head.appendChild(script);

    // Hook canvas.getContext
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
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
            result = gli.inspectContext(this, result, {
                breakOnError: false,
                frameSeparator: null
            });
        }

        return result;
    };

})();
