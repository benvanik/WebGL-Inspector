// WebGL Inspector injection script
// --
// This runs half in a content script and half injected on the page. It hooks
// the canvas to watch for WebGL use and light up the 'gl' page action icon,
// and when the inspector is injected will handle passing off control upon
// context creation.


/**
 * Hooks the <canvas> getContext call.
 * This function is directly injected into the page and runs in the page
 * context. This relies on us being executed before the dom is ready so that we
 * can overwrite any calls to canvas.getContext. When a call is made, we fire
 * off an event that is handled in our extension above (as chrome.extension.*
 * is not available from the page).
 *
 * @param {string} gliCssUrl gli.all.css URL.
 */
function pageExecutionFn(gliCssUrl) {
  // Drop the CSS URL on the window for later.
  // Popups will use this to get the right CSS.
  window['gliCssUrl'] = gliCssUrl;

  // Rewrite getContext to snoop for WebGL.
  var originalGetContext = HTMLCanvasElement.prototype.getContext;
  if (!HTMLCanvasElement.prototype.getContextRaw) {
    HTMLCanvasElement.prototype.getContextRaw = originalGetContext;
  }
  HTMLCanvasElement.prototype.getContext = function () {
    console.log('has gli: ', !!window.gli);
    // Ignore WebGL Inspector canvases (no cycles!).
    if (this.internalInspectorSurface) {
      return originalGetContext.apply(this, arguments);
    }

    // Get the underlying context.
    var result = originalGetContext.apply(this, arguments);
    if (!result) {
      return null;
    }

    // If the context requested was a WebGL one, do the interesting work.
    var contextNames = ['moz-webgl', 'experimental-webgl', 'webgl'];
    var requestingWebGL = contextNames.indexOf(arguments[0]) != -1;
    if (requestingWebGL) {
      // Page is requesting a WebGL context!
      // Let the background page know so that it can light up the 'gl' icon.
      // If gli exists, then we are already present and shouldn't do anything
      if (!window.gli) {
        //setTimeout(function () {
          var enabledEvent = document.createEvent('Event');
          enabledEvent.initEvent('WebGLUsedEvent', true, true);
          document.dispatchEvent(enabledEvent);
        //}, 0);
      } else {
        //console.log("WebGL Inspector already embedded on the page - disabling extension");
      }

      // If we are injected, inspect this context.
      if (window.gli && gli.host.inspectContext) {
        // TODO: pull options from extension
        result = gli.host.inspectContext(this, result);
        var hostUI = new gli.host.HostUI(result);
        result.hostUI = hostUI; // just so we can access it later for debugging
      }
    }

    return result;
  };
}


/**
 * Attempts to determine if the page is an HTML document.
 * This method is imprecise and should be considered a blacklist.
 * @return {boolean} True if the page is likely HTML.
 */
function isLikelyHTML() {
  var likelyHTML = true;
  // TODO: better content type checks (if possible?)
  if (document.xmlVersion) {
    likelyHTML = false;
  }
  return likelyHTML;
};


/**
 * Handles WebGLUsedEvent that indicate WebGL is used on the page.
 * This may be fired multiple times by a page.
 */
function onWebGLUsed() {
  chrome.extension.sendMessage({
    WebGLUsedEvent: true
  });
};
document.addEventListener('WebGLUsedEvent', onWebGLUsed, false);


// Inject the pageExecutionFn into the page itself.
// This is nasty, as it creates some issues with the dev tools showing two
// entries for the page.
if (isLikelyHTML()) {
  // Arguments for the script function. These must be string-like.
  var gliCssUrl = '"' + chrome.extension.getURL('gli.all.css') + '"';
  var args = gliCssUrl;

  // Create script node with pageExecutionFn as the source.
  var script = document.createElement('script');
  script.appendChild(document.createTextNode('(' + pageExecutionFn + ')(' +
      args + ');'));

  // Get some kind of target to put the script in.
  // Only valid documents get body/head, so this is a nice way to ignore bad
  // ones.
  var targetElement =
      document.body || document.head || document.documentElement;
  if (targetElement) {
    targetElement.appendChild(script);
    script.parentNode.removeChild(script);
  }
}







//var debugMode = true;
if (!window["debugMode"]) {
    window["debugMode"] = false;
}


function insertHeaderNode(node) {
  var targetElement =
      document.body || document.head || document.documentElement;
  if (targetElement.firstElementChild) {
      targetElement.insertBefore(node, targetElement.firstElementChild);
  } else {
      targetElement.appendChild(node);
  }
};

function insertStylesheet(url) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    insertHeaderNode(link);
    return link;
};

function insertScript(url) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    //script.src = url;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send('');
    script.text = xhr.responseText;
    insertHeaderNode(script);
    return script;
};

if (debugMode) {
  // We have the loader.js file ready to help out.
  // Note that because this loads files dynamically any pages requesting a
  // context early will not get inspected. They should wait until DOM loaded.
  gliloader.pathRoot = chrome.extension.getURL('');
  gliloader.load(["loader", "host", "replay", "ui"], function () {
    // ?
  });
} else {
  // Insert script and stylesheets.
  insertStylesheet(chrome.extension.getURL('gli.all.css'));
  insertScript(chrome.extension.getURL('gli.all.js'));
}
