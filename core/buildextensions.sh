cd shared
cat Utilities.js Hacks.js EventSource.js > ../cat.shared.js
cd ..

cd host
cat CaptureContext.js StateSnapshot.js Frame.js Resource.js ResourceCache.js Statistics.js > ../cat.host.js
cd resources
cat Buffer.js Framebuffer.js Program.js Renderbuffer.js Shader.js Texture.js > ../../cat.host.resources.js
cd ..
cd ..

cd replay
cat Controller.js Statistics.js > ../cat.replay.js
cd ..

cd ui
cd ..

cat dependencies/stacktrace.js cat.shared.js cat.host.js cat.host.resources.js cat.replay.js > cat.all.js
rm cat.shared.js cat.host.js cat.host.resources.js cat.replay.js

cp cat.all.js extensions/safari/webglinspector.safariextension/
cp cat.all.js extensions/chrome/

rm cat.all.js

