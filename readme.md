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
* Annotated call log with call durations
* Ability to step through all calls in a frame incrementally (back/forward/jump/etc)
* Non-destructive to host page - everything happens in a separate GL context
* Internal GL state display
* Resource information (textures/buffers/programs/shaders)
More to come!

Credits
---------------------
* Ben Vanik (ben.vanik@gmail.com)
* James Darpinian
* Samples and demo code from Giles Thomas at [Learning WebGL](http://learningwebl.com)

Getting Started
====================

Running the Inspector
---------------------
There are currently two ways to use the inspector - one is to directly embed it in your GL application (should work in all browsers that
support WebGL), and the other is to use one of the supported extensions.

### Directly Embedding
* Include a single script:
    <script type="text/javascript" src="core/embed.js"></script>
No other changes should be required!

### Extensions
* Run core/buildextensions.sh - this will cat all required files together and copy them into the right place
* Follow the steps below for each browser:

#### Chromium
* Navigate to chrome://extensions
* Click 'load unpacked extension...' and select the extensions/chrome/ directory
* Open a page with WebGL content and click the 'GL' icon in the top right of the address bar (click again to disable)

**DEBUGGING**: If you want to debug the inspector code, instead load the extension from core/ - this will use the non-cat'ed files
and makes things much easier when navigating source. You'll also be able to just reload pages when you make changes to the extension
(although sometimes the CSS requires a full browser restart to update).

#### Firefox
Currently working on a Jetpack version, but am having some issues. Will come at a later date.

#### WebKit
Instructions coming soon (essentially add an existing extension and select extensions/safari/webglinspector.safariextension)

Known Issues
---------------------
This list is not exhaustive!

* You cannot inspect pages on file:// in WebKit
* When using the embed sometimes loading will fail - just reload until it doesn't
* Crazy page CSS will mess with the UI
* Fonts are a bit weird on OS X

Supported Content
---------------------
**NOTE**: if you know of any good ways to get around these, let me know! :)

Due to the WebGL API some minor changes are usually required to get the inspector working.

In all cases, a frame separation call is required to let the inspector know when a frame ends. The default is to try to guess when a frame ends but
this is not always accurate. If you are having issues, add a call to `gl.finish()` at the end of your frame loop and when you call `gli.inspectContext`
set `frameSeparator` to `finish`. If it's not possible to modify the code you can change the call to something you know happens first every frame,
such as a call to `gl.viewport()` or `gl.clear()`, however this can be unreliable.

Samples
====================

Included in the repository is the [Learning WebGL](http://learningwebl.com) Lesson 05 under `samples/lesson05/`. `embedded.html` shows the inspector
inlined on the page using the single `<script>` include. Diff the file against `original.html` (or look for 'WebGL Inspector' comments) to see what was changed.

TODO
====================
In no particular order, here are some of the major features I'd like to see added:

* Call statistics (with pretty graphs/etc)
* Multiple framebuffer/renderbuffer/render-to-texture support
* Save traces/resources/buffer snapshots/etc
* Serialization of call stream (could do remote debugging/save and replay/etc)
* Pixel history (may be difficult, but would be awesome)
* Editing of buffers/shaders in replay
* Editing of state/call history (tweak arguments/etc)

On top of those there are plenty of little things (UI tweaks, etc) that would be helpful. For example, global key bindings would make stepping better.

Some crazier things may be possible in the future, too. For example, if the serialization was implemented it'd be possible to do remote debugging/playback
of scenes from Android/iOS/etc devices (once they support WebGL), as well as build test frameworks for WebGL content.
