// WebGL Inspector background page
// --
// This manages the page action ('gl' button) in the url bar and injecting the
// inspector onto pages. A list of pages that have been toggled 'on' are stored
// in local storage and lit up on each load. The URLs are matched exactly
// (minus query/hash args).


function getKeyForTab(tab) {

};


function checkEnabledForTab(tab) {
  var key = getKeyForTab(tab);
  return true;
};


function toggleEnabledForTab(tab) {
  var key = getKeyForTab(tab);
};


// Listen for messages from the content script.
// Handles events such as enabling the page action.
chrome.extension.onMessage.addListener(function(data, sender) {
  if ('WebGLUsedEvent' in data) {
    // Tab has used WebGL - show the page action.
    chrome.pageAction.show(sender.tab.id);
  }
});


/**
 * Handles clicks on the page action ('gl') button.
 * @param {!Object} tab Tab the page action was clicked in.
 */
function pageActionClicked(tab) {
  // Toggle enable state.
  toggleEnabledForTab(tab);

  // Reload with the new setting.
  if (checkEnabledForTab(tab)) {
    // Reload and inject.
    injectInspector(tab);
  } else {
    // Reload clean.
  }
};
chrome.pageAction.onClicked.addListener(pageActionClicked);


/**
 * Injects the inspector into a tab.
 * The tab should not have been previously injected. It must be a fresh load
 * of the tab, otherwise context will not be properly captured.
 * @param {!Object} tab Target tab to inject into.
 */
function injectInspector(tab) {
  // Initiate reload.
  chrome.tabs.reload(tab.id, {
  });

  chrome.tabs.executeScript(tab.id,{code:"document.body.style.backgroundColor='red'"})

  // // Inject extension javascript.
  // chrome.tabs.executeScript(tab.id, {
  //   //runAt: 'document_start',
  //   file: 'gli.all.js'
  // });

  // // Inject CSS.
  // chrome.tabs.insertCSS(tab.id, {
  //   //runAt: 'document_start',
  //   file: 'gli.all.css'
  // });
};


// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
// });



// // Called when a message is passed.  We assume that the content script wants to show the page action.
// function onRequest(request, sender, sendResponse) {
//     if (request.present) {
//         // Show the page action for the tab that the sender (content script) was on.
//         chrome.pageAction.show(sender.tab.id);
//     }

//     // Return nothing to let the connection be cleaned up.
//     sendResponse({});
// };
