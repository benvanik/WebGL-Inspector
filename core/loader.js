var gliloader = {};

(function () {

    function injectCSS(filename, injectState) {
        var doc = injectState.window.document;
        var url = injectState.pathRoot + filename;
        if ((url.indexOf("http://") == 0) || (url.indexOf("file://") == 0) || (url.indexOf("chrome-extension://") == 0)) {
            var link = doc.createElement("link");
            link.rel = "stylesheet";
            link.href = url;
            (doc.head || doc.body || doc.documentElement).appendChild(link);
        } else {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        (doc.head || doc.body || doc.documentElement).appendChild(style);
                    }
                }
            };
            xhr.open("GET", url, true);
            xhr.send(null);
        }
    };

    function injectScript(filename, injectState) {
        var doc = injectState.window.document;
        
        injectState.toLoad++;
        function scriptsLoaded() {
            if (injectState.callback) {
                injectState.callback();
            }
            injectState.callback = null; // To prevent future calls
        }

        var url = injectState.pathRoot + filename;

        var script = doc.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        script.onload = function () { 
            if (--injectState.toLoad == 0) {
                scriptsLoaded();
            }
        };
        script.onreadystatechange = function () {
            if ("loaded" === script.readyState || "complete" === script.readyState) {
                if (--injectState.toLoad == 0) {
                    scriptsLoaded();
                }
            }
        };
        (doc.head || doc.body || doc.documentElement).appendChild(script);
    };

    function load(modules, callback, targetWindow) {
        var injectState = {
            window: targetWindow || window,
            pathRoot: gliloader.pathRoot,
            toLoad: 0,
            callback: callback
        };
        
        var hasInjectedShared = false;
        function injectShared() {
            if (hasInjectedShared) {
                return;
            }
            hasInjectedShared = true;
            
            injectScript("dependencies/stacktrace.js", injectState);
            
            injectScript("shared/Utilities.js", injectState);
            injectScript("shared/Hacks.js", injectState);
            injectScript("shared/Extensions.js", injectState);
            injectScript("shared/EventSource.js", injectState);
            injectScript("shared/Info.js", injectState);
            injectScript("shared/Controls.js", injectState);
            injectScript("shared/Settings.js", injectState);
        }

        for (var n = 0; n < modules.length; n++) {
            switch (modules[n]) {
            case "loader":
                injectShared();
                injectScript("loader.js", injectState);
            
                break;
            case "host":
                injectShared();
                injectScript("host/CaptureContext.js", injectState);
                injectScript("host/StateSnapshot.js", injectState);
                injectScript("host/Frame.js", injectState);
                injectScript("host/HostUI.js", injectState);
                injectScript("host/Notifier.js", injectState);
                injectScript("host/Resource.js", injectState);
                injectScript("host/ResourceCache.js", injectState);
                injectScript("host/Statistics.js", injectState);

                injectScript("host/resources/Buffer.js", injectState);
                injectScript("host/resources/Framebuffer.js", injectState);
                injectScript("host/resources/Program.js", injectState);
                injectScript("host/resources/Renderbuffer.js", injectState);
                injectScript("host/resources/Shader.js", injectState);
                injectScript("host/resources/Texture.js", injectState);
                injectScript("host/resources/VertexArrayObjectOES.js", injectState);

                break;
            case "replay":
                injectShared();
                injectScript("replay/Controller.js", injectState);
                injectScript("replay/RedundancyChecker.js", injectState);

                break;
            case "ui":
                injectShared();
                
                injectScript("dependencies/syntaxhighlighter_3.0.83/shCore.js", injectState);
                injectScript("dependencies/syntaxhighlighter_3.0.83/shBrushGLSL.js", injectState);

                injectScript("ui/Window.js", injectState);
                injectScript("ui/Tab.js", injectState);

                injectScript("ui/shared/LeftListing.js", injectState);
                injectScript("ui/shared/SurfaceInspector.js", injectState);
                injectScript("ui/shared/TraceLine.js", injectState);
                injectScript("ui/shared/PopupWindow.js", injectState);
                injectScript("ui/shared/BufferPreview.js", injectState);
                injectScript("ui/shared/TexturePreview.js", injectState);
                
                injectScript("ui/drawinfo/DrawInfo.js", injectState);
                injectScript("ui/pixelhistory/PixelHistory.js", injectState);

                injectScript("ui/tabs/trace/TraceTab.js", injectState);
                injectScript("ui/tabs/trace/TraceView.js", injectState);
                injectScript("ui/tabs/trace/TraceListing.js", injectState);

                injectScript("ui/tabs/timeline/TimelineTab.js", injectState);
                injectScript("ui/tabs/timeline/TimelineView.js", injectState);

                injectScript("ui/tabs/state/StateTab.js", injectState);
                injectScript("ui/tabs/state/StateView.js", injectState);

                injectScript("ui/tabs/textures/TexturesTab.js", injectState);
                injectScript("ui/tabs/textures/TextureView.js", injectState);
                injectScript("ui/tabs/textures/TexturePicker.js", injectState);

                injectScript("ui/tabs/buffers/BuffersTab.js", injectState);
                injectScript("ui/tabs/buffers/BufferView.js", injectState);

                injectScript("ui/tabs/programs/ProgramsTab.js", injectState);
                injectScript("ui/tabs/programs/ProgramView.js", injectState);

                injectScript("ui/tabs/performance/PerformanceTab.js", injectState);
                injectScript("ui/tabs/performance/PerformanceView.js", injectState);

                break;
            case "ui_css":
                injectCSS("dependencies/reset-context.css", injectState);
                injectCSS("dependencies/syntaxhighlighter_3.0.83/shCore.css", injectState);
                injectCSS("dependencies/syntaxhighlighter_3.0.83/shThemeDefault.css", injectState);
                injectCSS("ui/gli.css", injectState);
                break;
            }
        }
    };

    gliloader.pathRoot = null;
    gliloader.load = load;

})();
