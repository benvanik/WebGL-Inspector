webglinspector.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ webglinspector.showFirefoxContextMenu(e); }, false);
};

webglinspector.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-webglinspector").hidden = gContextMenu.onImage;
};

window.addEventListener("load", webglinspector.onFirefoxLoad, false);
