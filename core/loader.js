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
            
            injectScript("dependencies/parseuri.js", injectState);
            injectScript("dependencies/stacktrace.js", injectState);
            
            injectScript("src/util/Base.js", injectState);
            injectScript("src/util/Utilities.js", injectState);
            injectScript("src/util/Interval.js", injectState);
            injectScript("src/util/EventSource.js", injectState);
            injectScript("src/util/Promise.js", injectState);
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
                
                injectScript("src/capture/CaptureHost.js", injectState);
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
                injectScript("src/capture/transports/NetworkTransport.js", injectState);
                
                injectScript("src/capture/ui/Notifier.js", injectState);
                injectScript("src/capture/ui/CanvasOverlay.js", injectState);
                
                break;
            case "playback":
                injectShared();
                
                injectScript("src/playback/Debugging.js", injectState);
                injectScript("src/playback/PlaybackHost.js", injectState);
                injectScript("src/playback/PlaybackSession.js", injectState);
                injectScript("src/playback/ResourceStore.js", injectState);
                injectScript("src/playback/ResourcePool.js", injectState);
                injectScript("src/playback/ResourceTarget.js", injectState);
                injectScript("src/playback/PlaybackContext.js", injectState);
                
                injectScript("src/playback/data/Converter.js", injectState);
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
                
                injectScript("src/playback/mutators/Mutator.js", injectState);
                injectScript("src/playback/mutators/CallHookMutator.js", injectState);
                injectScript("src/playback/mutators/DepthOutputMutator.js", injectState);
                injectScript("src/playback/mutators/ShaderOverrideMutator.js", injectState);

                injectScript("src/playback/tools/Tool.js", injectState);
                injectScript("src/playback/tools/BufferChecker.js", injectState);
                injectScript("src/playback/tools/RedundancyChecker.js", injectState);
                injectScript("src/playback/tools/StallChecker.js", injectState);
                injectScript("src/playback/tools/TextureChecker.js", injectState);
                injectScript("src/playback/tools/VertexFormatChecker.js", injectState);

                injectScript("src/playback/transports/Transport.js", injectState);
                injectScript("src/playback/transports/JsonTransport.js", injectState);
                injectScript("src/playback/transports/LocalTransport.js", injectState);
                injectScript("src/playback/transports/NetworkTransport.js", injectState);
                
                break;
            case "ui":
                injectShared();

                injectScript("dependencies/ui/syntaxhighlighter_3.0.83/shCore.js", injectState);
                injectScript("dependencies/ui/syntaxhighlighter_3.0.83/shBrushGLSL.js", injectState);

                injectScript("src/ui/Info.js", injectState);
                injectScript("src/ui/Popup.js", injectState);
                injectScript("src/ui/Settings.js", injectState);
                injectScript("src/ui/Utilities.js", injectState);
                
                injectScript("src/ui/controls/ListBox.js", injectState);
                injectScript("src/ui/controls/MiniBar.js", injectState);
                injectScript("src/ui/controls/SplitPanel.js", injectState);
                injectScript("src/ui/controls/Splitter.js", injectState);
                injectScript("src/ui/controls/StatusBar.js", injectState);
                injectScript("src/ui/controls/SurfaceView.js", injectState);
                injectScript("src/ui/controls/TabBar.js", injectState);
                injectScript("src/ui/controls/ZoomView.js", injectState);
                
                injectScript("src/ui/Window.js", injectState);
                injectScript("src/ui/Tab.js", injectState);
                injectScript("src/ui/Scrubber.js", injectState);
                injectScript("src/ui/ContextController.js", injectState);

                injectScript("src/ui/tabs/trace/TraceTab.js", injectState);
                injectScript("src/ui/tabs/trace/ListingPane.js", injectState);
                injectScript("src/ui/tabs/trace/PreviewPane.js", injectState);
                injectScript("src/ui/tabs/trace/TraceListing.js", injectState);
                
                /*injectScript("src/shared/Info.js", injectState);
                injectScript("src/shared/Controls.js", injectState);
                injectScript("src/shared/Settings.js", injectState);
                
                injectScript("src/ui/UI.js", injectState);
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
                */
                break;
            case "ui_css":
                injectCSS("dependencies/ui/reset-context.css", injectState);
                injectCSS("dependencies/ui/syntaxhighlighter_3.0.83/shCore.css", injectState);
                injectCSS("dependencies/ui/syntaxhighlighter_3.0.83/shThemeDefault.css", injectState);
                injectCSS("src/ui/assets/gli.ui.css", injectState);
                break;
            }
        }
    };

    gliloader.pathRoot = null;
    gliloader.load = load;

})();
