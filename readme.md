Getting Started
====================

Running the Inspector
---------------------
There are currently two ways to use the inspector - one is to directly embed it in your GL application (should work in all browsers that
support WebGL), and the other is to use one of the supported extensions.

### Directly Embedding
**NOTE**: this will eventually get prettier (a single js file and a single initialize call)

* include all .js files under core/
* link in style sheet core/ui/gli.css
* after you getContext on your canvas, call:
        gl = gli.inspectContext(canvas, rawgl, {
            breakOnError: false,
            frameSeparator: null
        });
* if capture is not working, add a call to `gl.finish()` at the end of your frame loop and set `frameSeparator: 'finish'` in options

### Chrome Extension
* create a symlink from core/ to extensions/chrome/core/ (`ln -s` on unix or `mklink /D` on Windows)
* navigate to chrome://extensions
* click 'load unpacked extension...' and select the extensions/chrome/ directory
* open a page with WebGL content and click the 'GL' icon in the top right of the address bar
* see below for instructions on how to get sites working

Supported Content
---------------------
**NOTE**: if you know of any good ways to get around these, let me know! :)

Due to the WebGL API some minor changes are usually required to get the inspector working.

In all cases, a frame separation call is required to let the inspector know when a frame ends. The default is to try to guess when a frame ends but
this is not always accurate. If you are having issues, add a call to `gl.finish()` at the end of your frame loop and when you call `gli.inspectContext`
set `frameSeparator` to `finish`. If it's not possible to modify the code you can change the call to something you know happens first every frame,
such as a call to `gl.viewport()` or `gl.clear()`, however this can be unreliable.

When using the extensions it is required that the page implement WebGL context loss/restoration logic with a special rule: in the webglcontextrestored
you must throw out the existing WebGLRenderingContext returned from the `canvas.getContext()` call and request a new one. 
For example:
    canvas.addEventListener("webglcontextrestored", function () {
        gl = canvas.getContext("experimental-webgl");
        // ... reload the rest of the resources as normal
    }, false);
**NOTE**: I'd like to find a way to remove this restriction, but am not sure it's possible with the Chrome/Safari security restrictions - ideas welcome

Samples
====================

Included in the repository is the [Learning WebGL](http://learningwebl.com) Lesson 05 under `samples/lesson05/`. `embedded.html` shows the inspector
inlined on the page and `extension.html` enables usage via the extension. Diff either file against `original.html` (or look for 'WebGL Inspector'
comments) to see what was changed in each.
