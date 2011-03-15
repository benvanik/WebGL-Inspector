mkdir lib

cd dependencies
cat stacktrace.js syntaxhighlighter_3.0.83/shCore.js syntaxhighlighter_3.0.83/shBrushGLSL.js > ../cat.dependencies.js
cat reset-context.css syntaxhighlighter_3.0.83/shCore.css syntaxhighlighter_3.0.83/shThemeDefault.css > ../cat.dependencies.css
cd ..

cd shared
cat Utilities.js Hacks.js Extensions.js EventSource.js Info.js Controls.js Settings.js > ../cat.shared.js
cd ..

cd host
cat CaptureContext.js StateSnapshot.js Frame.js HostUI.js Notifier.js Resource.js ResourceCache.js Statistics.js > ../cat.host.js
cd resources
cat Buffer.js Framebuffer.js Program.js Renderbuffer.js Shader.js Texture.js VertexArrayObjectOES.js > ../../cat.host.resources.js
cd ..
cd ..

cd replay
cat Controller.js RedundancyChecker.js > ../cat.replay.js
cd ..

cd ui
cat Window.js Tab.js > ../cat.ui.js
cd shared
cat LeftListing.js SurfaceInspector.js TraceLine.js PopupWindow.js BufferPreview.js TexturePreview.js > ../../cat.ui.shared.js
cd ..
cd drawinfo
cat DrawInfo.js > ../../cat.ui.drawinfo.js
cd ..
cd pixelhistory
cat PixelHistory.js > ../../cat.ui.pixelhistory.js
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
cat cat.ui.tabs.trace.js cat.ui.tabs.timeline.js cat.ui.tabs.state.js cat.ui.tabs.textures.js cat.ui.tabs.buffers.js cat.ui.tabs.programs.js cat.ui.tabs.performance.js > ../../cat.ui.tabs.js
rm cat.ui.tabs.trace.js cat.ui.tabs.timeline.js cat.ui.tabs.state.js cat.ui.tabs.textures.js cat.ui.tabs.buffers.js cat.ui.tabs.programs.js cat.ui.tabs.performance.js
cd ..
cd ..

cat cat.dependencies.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js cat.ui.shared.js cat.ui.tabs.js cat.ui.drawinfo.js cat.ui.pixelhistory.js > lib/gli.all.js
rm cat.dependencies.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js cat.ui.shared.js cat.ui.tabs.js cat.ui.drawinfo.js cat.ui.pixelhistory.js

cat cat.dependencies.css ui/gli.css > lib/gli.all.css
rm cat.dependencies.css

# Copy assets
cp -R ui/assets lib/

# Copy the lib/ directory to all the extension paths
cp -R lib/* extensions/safari/webglinspector.safariextension/
cp -R lib/* extensions/chrome/
cp -R lib/* extensions/firefox/chrome/content/

# Safari uses the chrome contentscript.js - nasty, but meh
cp extensions/chrome/contentscript.js extensions/safari/webglinspector.safariextension/
