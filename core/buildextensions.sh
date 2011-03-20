mkdir lib

cd dependencies
    cat stacktrace.js syntaxhighlighter_3.0.83/shCore.js syntaxhighlighter_3.0.83/shBrushGLSL.js > ../cat.dependencies.js
    cat reset-context.css syntaxhighlighter_3.0.83/shCore.css syntaxhighlighter_3.0.83/shThemeDefault.css > ../cat.dependencies.css
cd ..

cd src

cd util
    cat Base.js Utilities.js EventSource.js TimerController.js WebGLHacks.js > ../../cat.util.js
cd ..

cd capture
    cat DebuggerContext.js DebuggerImpl.js ResourceCache.js CaptureSession.js > ../../cat.capture.js
    cd extensions
        cat GLI_debugger.js > ../../../cat.capture.extensions.js
    cd ..
    cd data
        cat Call.js CaptureFrame.js TimingFrame.js > ../../../cat.capture.data.js
    cd ..
    cd resources
        cat ResourceVersion.js Resource.js Buffer.js Framebuffer.js Program.js Renderbuffer.js Shader.js Texture.js > ../../../cat.capture.data.resources.js
    cd ..
    cd modes
        cat Mode.js CaptureMode.js TimingMode.js > ../../../cat.capture.modes.js
    cd ..
    cd transports
        cat Transport.js DebugTransport.js JsonTransport.js LocalTransport.js NetworkTransport.js > ../../../cat.capture.transports.js
    cd ..
cd ..

cd playback
    cd PlaybackHost.js PlaybackSession.js ResourceCache.js > ../../cat.playback.js
    cd data
        cat Call.js CaptureFrame.js TimingFrame.js > ../../../cat.playback.data.js
    cd ..
    cd resources
        cat ResourceVersion.js Resource.js Buffer.js Framebuffer.js Program.js Renderbuffer.js Shader.js Texture.js > ../../../cat.playback.resources.js
    cd ..
    cd tools
        cat Tools.js RedundancyChecker.js > ../../../cat.playback.tools.js
    cd ..
    cd transports
        cat Transport.js JsonTransport.js NetworkTransport.js > ../../../cat.playback.transports.js
    cd ..
cd ..

#cd host
#cat CaptureContext.js StateSnapshot.js Frame.js HostUI.js Notifier.js Resource.js ResourceCache.js Statistics.js > ../../cat.host.js
#cd resources
#cat Buffer.js Framebuffer.js Program.js Renderbuffer.js Shader.js Texture.js VertexArrayObjectOES.js > ../../../cat.host.resources.js
#cd ..
#cd ..

#cd replay
#cat Controller.js RedundancyChecker.js > ../../cat.replay.js
#cd ..

cd shared
    cat Info.js Controls.js Settings.js > ../../cat.shared.js
cd ..

cd ui
    cat Window.js Tab.js > ../../cat.ui.js
    cd shared
        cat LeftListing.js SurfaceInspector.js TraceLine.js PopupWindow.js BufferPreview.js TexturePreview.js > ../../../cat.ui.shared.js
    cd ..
    cd drawinfo
        cat DrawInfo.js > ../../../cat.ui.drawinfo.js
    cd ..
    cd pixelhistory
        cat PixelHistory.js > ../../../cat.ui.pixelhistory.js
    cd ..
    cd tabs
        cd trace
            cat TraceTab.js TraceView.js TraceListing.js > ../cat.ui.tabs.trace.js
        cd ..
        cd timeline
            cat TimelineTab.js TimelineView.js > ../cat.ui.tabs.timeline.js
        cd ..
        cd state
            cat StateTab.js StateView.js > ../cat.ui.tabs.state.js
        cd ..
        cd textures
            cat TexturesTab.js TextureView.js TexturePicker.js > ../cat.ui.tabs.textures.js
        cd ..
        cd buffers
            cat BuffersTab.js BufferView.js > ../cat.ui.tabs.buffers.js
        cd ..
        cd programs
            cat ProgramsTab.js ProgramView.js > ../cat.ui.tabs.programs.js
        cd ..
        cd performance
            cat PerformanceTab.js PerformanceView.js > ../cat.ui.tabs.performance.js
        cd ..
        cat cat.ui.tabs.trace.js cat.ui.tabs.timeline.js cat.ui.tabs.state.js cat.ui.tabs.textures.js cat.ui.tabs.buffers.js cat.ui.tabs.programs.js cat.ui.tabs.performance.js > ../../../cat.ui.tabs.js
        rm cat.ui.tabs.trace.js cat.ui.tabs.timeline.js cat.ui.tabs.state.js cat.ui.tabs.textures.js cat.ui.tabs.buffers.js cat.ui.tabs.programs.js cat.ui.tabs.performance.js
    cd ..
cd ..

cd ..

cat cat.dependencies.js cat.util.js > cat.core.js
rm cat.dependencies.js cat.util.js

cat cat.capture.js cat.capture.extensions.js cat.capture.data.js cat.capture.data.resources.js cat.capture.modes.js cat.capture.transports.js > cat.capture.all.js
rm cat.capture.js cat.capture.extensions.js cat.capture.data.js cat.capture.data.resources.js cat.capture.modes.js cat.capture.transports.js
cat cat.core.js cat.capture.all.js > lib/gli.capture.js

cat cat.playback.js cat.playback.data.js cat.playback.resources.js cat.playback.tools.js cat.playback.transports.js > cat.playback.all.js
rm cat.playback.js cat.playback.data.js cat.playback.resources.js cat.playback.tools.js cat.playback.transports.js
cat cat.core.js cat.playback.all.js > lib/gli.playback.js

cat cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js cat.ui.shared.js cat.ui.tabs.js cat.ui.drawinfo.js cat.ui.pixelhistory.js > cat.ui.all.js
rm cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js cat.ui.shared.js cat.ui.tabs.js cat.ui.drawinfo.js cat.ui.pixelhistory.js
cat cat.core.js cat.ui.all.js > lib/gli.ui.js

cat cat.core.js cat.capture.all.js cat.playback.all.js cat.ui.all.js > lib/gli.all.js
rm cat.capture.all.js
rm cat.playback.all.js
rm cat.ui.all.js

rm cat.core.js

cat cat.dependencies.css src/ui/gli.css > lib/gli.all.css
rm cat.dependencies.css

# Copy assets
cp -R src/ui/assets lib/

# Copy the lib/ directory to all the extension paths
cp -R lib/* extensions/safari/webglinspector.safariextension/
cp -R lib/* extensions/chrome/
cp -R lib/* extensions/firefox/chrome/content/

# Safari uses the chrome contentscript.js - nasty, but meh
cp extensions/chrome/contentscript.js extensions/safari/webglinspector.safariextension/
