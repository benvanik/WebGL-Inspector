About
====================
WebGL Inspector is a tool inspired by [gDEBugger](http://www.gremedy.com/) and [PIX](http://msdn.microsoft.com/en-us/library/ee417062.aspx)
with the goal of making the development of advanced WebGL applications easier. What Firebug and Developer Tools are to HTML/JS, WebGL Inspector
is to WebGL.

Features
---------------------
* Embed in an existing application with a single `<script>` include
* Use as an extension without changing target code
* Capture entire frames of GL activity
* Annotated call log with redundant call warnings
* Ability to step through all calls in a frame incrementally (back/forward/jump/etc)
* Pixel history - see all draw calls that contributed to a pixel + blending information
* Non-destructive to host page - everything happens in a separate GL context
* Internal GL state display
* Resource information (textures/buffers/programs/shaders)
* Performance tuning options and statistics

More to come!

Credits
---------------------
* Ben Vanik (ben.vanik@gmail.com) - [follow on Twitter](http://twitter.com/benvanik/)
* James Darpinian
* Samples and demo code from Giles Thomas at [Learning WebGL](http://learningwebgl.com)

Getting Started
====================

Running the Inspector
---------------------
There are currently two ways to use the inspector - one is to directly embed it in your GL application (should work in all browsers that
support WebGL), and the other is to use one of the supported extensions.

Before starting, run `core/buildextensions.sh` - this will cat all required files together and copy them into the right places. Note that
this is not required when using the debug variants.

### Directly Embedding
Include a single script:
    <script type="text/javascript" src="core/embed.js"></script>
No other changes should be required!

If you want to debug the inspector, before the script include set `gliEmbedDebug = true;`:
    <script type="text/javascript">
        var gliEmbedDebug = true;
    </script>
    <script type="text/javascript" src="core/embed.js"></script>
This will use the un-cat'ed script/css files, making debugging easier.

**LIVE**: Instead of grabbing the code, building, and embedding, you can include the script directly from the sample site. This version
will change whenever I release a new version.
    <script type="text/javascript" src="http://benvanik.github.com/WebGL-Inspector/core/embed.js"></script>

### Extensions

#### Chromium
* Navigate to chrome://extensions
* Click 'load unpacked extension...' and select the extensions/chrome/ directory
* If you will be trying to inspect file:// pages, make sure to check 'Allow access to file URLs'
* Open a page with WebGL content and click the 'GL' icon in the top right of the address bar (click again to disable)

**DEBUGGING**: If you want to debug the inspector code, instead load the extension from core/ - this will use the non-cat'ed files
and makes things much easier when navigating source. You'll also be able to just reload pages when you make changes to the extension
(although sometimes the CSS requires a full browser restart to update).

#### Firefox
There's a stubbed out extension under extensions/firefox/, but nothing has been implemented. The embed works (minus a few CSS bugs)
so it really just needs someone who knows the Firefox APIs... hint hint!

#### WebKit
* Open the Extension Builder
* Add existing extension
* Select extensions/safari/webglinspector.safariextension
* Open a page with WebGL content and click the 'GL' icon in the top left of the toolbar (click again to disable)

**DEBUGGING**: There is currently no debug version of the extension - since Chromium is so similar it's best to just use that.

Known Issues
---------------------
This list is not exhaustive!

* You cannot inspect pages on file:// in WebKit (possible with security settings?)
* When using the embed sometimes loading will fail - just reload until it works (needs a better loader)
* Crazy page CSS will mess with the UI (need more overrides/reset?)
* Offscreen rendering not supported across frames (framebuffers with renderbuffers attached that are not backed by textures)
* RGBA values in the pixel inspector/pixel history will not be displayed if cross-origin textures are drawn - a limitation of WebGL
* Multiple WebGL contexts will cause multiple inspectors - they will overlap - resize to find others!

Supported Content
---------------------
**NOTE**: if you know of any good ways to get around these, let me know! :)

[Issue 8](https://github.com/benvanik/WebGL-Inspector/issues#issue/8) Currently multiple framebuffers are not nicely supported. If you are using RTT and other
framebuffer tricks (postprocessing, etc) then you may not see correct final results in the replay. You should, however, see the correct results inside the trace
while in areas where a valid framebuffer is bound. Play around with moving through the trace and you should see your scene at some point.

Frame Termination
--------------------
Due to the way WebGL implicitly ends frames, accurately determining when a host application has finished is tricky. To ensure frame captures are exactly what
they should be there is an extension that can be used to tell the inspector when you are done.

Query the extension - it will only exist when the inspector is attached:
    var glext_ft = gl.getExtension("GLI_frame_terminator");

At the end of your frame, call the termination method:
    if (glext_ft) {
        glext_ft.frameTerminator();
    }

Do this if you are consistently seeing multiple frames getting captured at the same time.

Samples
====================

Included in the repository is the [Learning WebGL](http://learningwebgl.com) Lesson 05 under `samples/lesson05/`. `embedded.html` shows the inspector
inlined on the page using the single `<script>` include. Diff the file against `original.html` (or look for 'WebGL Inspector' comments) to see what was changed.

Once you have an extension installed, here are some fun demos to test it with:

* [Quake 2 Map Renderer](http://media.tojicode.com/q2bsp/)
* [Quake 3 Map Renderer](http://media.tojicode.com/q3bsp/)
* [Aquarium](http://webglsamples.googlecode.com/hg/aquarium/aquarium.html)
* [Fishtank](http://webglsamples.googlecode.com/hg/fishtank/fishtank.html)
* [Imagesphere](http://webglsamples.googlecode.com/hg/imagesphere/imagesphere.html)
* [Spacerocks](http://webglsamples.googlecode.com/hg/spacerocks/spacerocks.html)

TODO
====================
In no particular order, here are some of the major features I'd like to see added:

* Call statistics (with pretty graphs/etc)
* Save traces/resources/buffer snapshots/etc
* Serialization of call stream (could do remote debugging/save and replay/etc)
* Editing of buffers/shaders in replay
* Editing of state/call history (tweak arguments/etc)

On top of those there are plenty of little things (UI tweaks, etc) that would be helpful. For example, global key bindings would make stepping better.

Some crazier things may be possible in the future, too. For example, if the serialization was implemented it'd be possible to do remote debugging/playback
of scenes from Android/iOS/etc devices (once they support WebGL), as well as build test frameworks for WebGL content.
