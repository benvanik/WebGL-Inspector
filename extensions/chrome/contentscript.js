// Once the DOM is ready, bind to the content event
document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("WebGLEnabledEvent", function () {
        chrome.extension.sendRequest({}, function (response) { });
    }, false);
}, false);


// --------- NOTE: THIS FUNCTION IS INJECTED INTO THE PAGE DIRECTLY ---------
// This relies on us being executed before the dom is ready so that we can overwrite any calls
// to canvas.getContext. When a call is made, we fire off an event that is handled in our extension
// above (as chrome.extension.* is not available from the page).
function main() {
    // Create enabled event
    var enabledEvent = document.createEvent("Event");
    enabledEvent.initEvent("WebGLEnabledEvent", true, true);
    function fireEnabledEvent() {
        var eventHost = document.body;
        eventHost.dispatchEvent(enabledEvent);
    };

    // Rewrite getContext to snoop for webgl
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
        if (arguments[0] == "experimental-webgl") {
            // Page is requesting a WebGL context!
            fireEnabledEvent();
        }

        return originalGetContext.apply(this, arguments);
    };
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + main + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);
