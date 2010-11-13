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
cat Controller.js Statistics.js > ../cat.replay.js
cd ..

cd ui
cat Window.js LeftListing.js TraceView.js TraceListing.js TraceInspector.js TextureView.js BufferView.js ProgramView.js > ../cat.ui.js
cd ..

cat cat.dependencies.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js > cat.all.js
rm cat.dependencies.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js cat.ui.js

cat cat.dependencies.css ui/gli.css > cat.all.css
rm cat.dependencies.css

cp cat.all.js extensions/safari/webglinspector.safariextension/gli.all.js
cp cat.all.js extensions/chrome/gli.all.js

cp cat.all.css extensions/safari/webglinspector.safariextension/gli.all.css
cp cat.all.css extensions/chrome/gli.all.css

rm cat.all.js
rm cat.all.css

cp -R ui/assets extensions/safari/webglinspector.safariextension/
cp -R ui/assets extensions/chrome/
