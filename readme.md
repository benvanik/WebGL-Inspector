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
    <script src="core/embed.js"></script>
No other changes should be required!

If you want to debug the inspector, before the script include set `gliEmbedDebug = true;`:
    <script>
        var gliEmbedDebug = true;
    </script>
    <script src="core/embed.js"></script>
This will use the un-cat'ed script/css files, making debugging easier.

**LIVE**: Instead of grabbing the code, building, and embedding, you can include the script directly from the sample site. This version
will change whenever I release a new version.
    <script src="http://benvanik.github.com/WebGL-Inspector/core/embed.js"></script>

Note: when running the debug version [require.js](http://requirejs.org) is used to load the inspector. This can have
issues for when the inspector gets a chance to wrap `HTMLCanvasContext.getContext` and when code tries to use it.

The first thing to try is make sure you code waits for `window.onload` before creating a webgl context. If that doesn't work
you can also wait for `gliready`

    window.addEventListener('gliready', runYourWebGLCode);

If your app also uses require.js you need to make your app dependent on the inspector like
this. One example would be to do this. Assume your program before used `data-main` as in

    <script data-main="myApp.js" src="require.js">

Remove the `data-main` part and change it to something like

    <script "myApp.js" src="require.js">
    <script>
    require(['../../core/gli'], function() {
      require.config({
        baseUrl: "/path/to/appfolder",
      });
      require(['twgl-amd'], function() {
      });
    });
    </script>

Note: This is only needed for running the inspector in debug mode to debug the inspector
itself.

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
[Download WebGL Inspector from Mozilla AMO](https://addons.mozilla.org/en-US/firefox/addon/webgl-inspector/)
or build manually:
* `cd core && ./buildextensions.sh`
* Open `core/extensions/firefox/webglinspector.xpi` in Firefox.

**DEBUGGING**
* `cd core/extensions/firefox`
* `make run`
or
* `PROFILE=/path/to/dev/profile make run`

#### WebKit
* Open the Extension Builder
* Add existing extension
* Select extensions/safari/webglinspector.safariextension
* Open a page with WebGL content and click the 'GL' icon in the top left of the toolbar (click again to disable)

**DEBUGGING**: There is currently no debug version of the extension - since Chromium is so similar it's best to just use that.

Frame Termination
--------------------
Due to the way WebGL implicitly ends frames, accurately determining when a host application has finished is tricky. To ensure frame captures are exactly what
they should be there is an extension that can be used to tell the inspector when you are done.

Query the extension - it will only exist when the inspector is attached:
    var glext_ft = gl.getExtension("GLI_frame_terminator");

At the end of your frame, call the termination method:
```javascript
if (glext_ft) {
    glext_ft.frameTerminator();
}
```

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
