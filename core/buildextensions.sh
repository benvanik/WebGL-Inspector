mkdir extensions/firefox/data
mkdir lib

cd dependencies
cat stacktrace.js syntaxhighlighter_3.0.83/shCore.js syntaxhighlighter_3.0.83/shBrushGLSL.js > ../cat.dependencies.js
cat reset-context.css syntaxhighlighter_3.0.83/shCore.css syntaxhighlighter_3.0.83/shThemeDefault.css > ../cat.dependencies.css
cd ..

cd shared
cat Utilities.js Hacks.js EventSource.js Info.js Controls.js > ../cat.shared.js
cd ..

cd host
cat CaptureContext.js StateSnapshot.js Frame.js HostUI.js Notifier.js Resource.js ResourceCache.js Statistics.js > ../cat.host.js
cd resources
cat Buffer.js Framebuffer.js Program.js Renderbuffer.js Shader.js Texture.js > ../../cat.host.resources.js
cd ..
cd ..

cd replay
cat Controller.js > ../cat.replay.js
cd ..

cd ui
cat Window.js LeftListing.js SurfaceInspector.js TraceLine.js TexturePreview.js TraceView.js TraceListing.js TimelineView.js StateView.js TextureView.js TexturePicker.js BufferView.js ProgramView.js > ../cat.ui.js
cd ..

cat cat.dependencies.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js > lib/gli.all.js
rm cat.dependencies.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js

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
