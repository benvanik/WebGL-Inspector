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
        script.async = false;
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
            
            injectScript("src/util/Base.js", injectState);
            injectScript("src/util/Utilities.js", injectState);
            injectScript("src/util/EventSource.js", injectState);
            injectScript("src/util/TimerController.js", injectState);
            injectScript("src/util/WebGLHacks.js", injectState);
        }

        for (var n = 0; n < modules.length; n++) {
            switch (modules[n]) {
            case "loader":
                injectShared();
                injectScript("loader.js", injectState);
            
                break;
            case "capture":
                injectShared();
                
                injectScript("src/capture/DebuggerContext.js", injectState);
                injectScript("src/capture/DebuggerImpl.js", injectState);
                injectScript("src/capture/ResourceCache.js", injectState);
                injectScript("src/capture/CaptureSession.js", injectState);
                
                injectScript("src/capture/extensions/GLI_debugger.js", injectState);
                
                injectScript("src/capture/data/Call.js", injectState);
                injectScript("src/capture/data/CaptureFrame.js", injectState);
                injectScript("src/capture/data/TimingFrame.js", injectState);
                
                injectScript("src/capture/resources/ResourceVersion.js", injectState);
                injectScript("src/capture/resources/Resource.js", injectState);
                injectScript("src/capture/resources/Buffer.js", injectState);
                injectScript("src/capture/resources/Framebuffer.js", injectState);
                injectScript("src/capture/resources/Program.js", injectState);
                injectScript("src/capture/resources/Renderbuffer.js", injectState);
                injectScript("src/capture/resources/Shader.js", injectState);
                injectScript("src/capture/resources/Texture.js", injectState);
                
                injectScript("src/capture/modes/Mode.js", injectState);
                injectScript("src/capture/modes/CaptureMode.js", injectState);
                injectScript("src/capture/modes/TimingMode.js", injectState);
                
                injectScript("src/capture/transports/Transport.js", injectState);
                injectScript("src/capture/transports/DebugTransport.js", injectState);
                injectScript("src/capture/transports/JsonTransport.js", injectState);
                injectScript("src/capture/transports/LocalTransport.js", injectState);
                
                break;
            case "playback":
                injectShared();
                
                injectScript("src/playback/PlaybackSession.js", injectState);
                
                injectScript("src/playback/data/Call.js", injectState);
                injectScript("src/playback/data/CaptureFrame.js", injectState);
                injectScript("src/playback/data/TimingFrame.js", injectState);
                
                injectScript("src/playback/resources/ResourceVersion.js", injectState);
                injectScript("src/playback/resources/Resource.js", injectState);
                injectScript("src/playback/resources/Buffer.js", injectState);
                injectScript("src/playback/resources/Framebuffer.js", injectState);
                injectScript("src/playback/resources/Program.js", injectState);
                injectScript("src/playback/resources/Renderbuffer.js", injectState);
                injectScript("src/playback/resources/Shader.js", injectState);
                injectScript("src/playback/resources/Texture.js", injectState);
                
                injectScript("src/playback/tools/Tool.js", injectState);
                injectScript("src/playback/tools/RedundancyChecker.js", injectState);
                
                break;
                /*
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

                break;*/
            case "ui":
                injectShared();

                injectScript("dependencies/syntaxhighlighter_3.0.83/shCore.js", injectState);
                injectScript("dependencies/syntaxhighlighter_3.0.83/shBrushGLSL.js", injectState);

                injectScript("src/shared/Info.js", injectState);
                injectScript("src/shared/Controls.js", injectState);
                injectScript("src/shared/Settings.js", injectState);
                
                injectScript("src/ui/Window.js", injectState);
                injectScript("src/ui/Tab.js", injectState);

                injectScript("src/ui/shared/LeftListing.js", injectState);
                injectScript("src/ui/shared/SurfaceInspector.js", injectState);
                injectScript("src/ui/shared/TraceLine.js", injectState);
                injectScript("src/ui/shared/PopupWindow.js", injectState);
                injectScript("src/ui/shared/BufferPreview.js", injectState);
                injectScript("src/ui/shared/TexturePreview.js", injectState);
                
                injectScript("src/ui/drawinfo/DrawInfo.js", injectState);
                injectScript("src/ui/pixelhistory/PixelHistory.js", injectState);

                injectScript("src/ui/tabs/trace/TraceTab.js", injectState);
                injectScript("src/ui/tabs/trace/TraceView.js", injectState);
                injectScript("src/ui/tabs/trace/TraceListing.js", injectState);

                injectScript("src/ui/tabs/timeline/TimelineTab.js", injectState);
                injectScript("src/ui/tabs/timeline/TimelineView.js", injectState);

                injectScript("src/ui/tabs/state/StateTab.js", injectState);
                injectScript("src/ui/tabs/state/StateView.js", injectState);

                injectScript("src/ui/tabs/textures/TexturesTab.js", injectState);
                injectScript("src/ui/tabs/textures/TextureView.js", injectState);
                injectScript("src/ui/tabs/textures/TexturePicker.js", injectState);

                injectScript("src/ui/tabs/buffers/BuffersTab.js", injectState);
                injectScript("src/ui/tabs/buffers/BufferView.js", injectState);

                injectScript("src/ui/tabs/programs/ProgramsTab.js", injectState);
                injectScript("src/ui/tabs/programs/ProgramView.js", injectState);

                injectScript("src/ui/tabs/performance/PerformanceTab.js", injectState);
                injectScript("src/ui/tabs/performance/PerformanceView.js", injectState);

                break;
            case "ui_css":
                injectCSS("dependencies/reset-context.css", injectState);
                injectCSS("dependencies/syntaxhighlighter_3.0.83/shCore.css", injectState);
                injectCSS("dependencies/syntaxhighlighter_3.0.83/shThemeDefault.css", injectState);
                injectCSS("src/ui/gli.css", injectState);
                break;
            }
        }
    };

    gliloader.pathRoot = null;
    gliloader.load = load;

})();
