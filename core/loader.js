var gliloader = {};

(function () {

    var hasLoadedContent = false;

    function loadContent(pathRoot, callback) {
        if (hasLoadedContent) {
            return;
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

        injectScript("core/dependencies/stacktrace.js");

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
            if (callback) {
                callback();
            }
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
    };

    gliloader.loadContent = loadContent;

})();
