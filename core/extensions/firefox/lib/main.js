const { data, uri } = require('sdk/self');
const { PageMod } = require('sdk/page-mod');
const tabs = require('sdk/tabs');

require('menuitems').Menuitem({
  id: 'webgl-inspector',
  label: 'WebGL Inspector',
  onCommand: function () {
    let tab = tabs.activeTab;
    let mod = PageMod({
      include: tab.url,
      contentScriptFile: [data.url('load.js')],
      contentScriptWhen: 'start',
      contentScriptOptions: {
        myJS: [data.url('shim.js'), data.url('gli.all.js')],
        myCSS: [data.url('gli.all.css')]
      }
    });
    tab.once('load', function () {
      mod.destroy();
    });
    tab.reload();
  },
  menuid: 'menuWebDeveloperPopup',
  insertbefore: 'devToolsEndSeparator',
});

