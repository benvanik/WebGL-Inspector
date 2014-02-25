const { data, uri } = require('sdk/self');
const { PageMod } = require('sdk/page-mod');
const tabs = require('sdk/tabs');

function attach(tab) {
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
}

require('menuitems').Menuitem({
  id: 'webgl-inspector',
  label: 'WebGL Inspector',
  onCommand: function () {
    let tab = tabs.activeTab;
    if (tab.url) {
      attach(tab);
    } else {
      tab.once('ready', function() {
        attach(tab);
      })
    }
  },
  menuid: 'menuWebDeveloperPopup',
  insertbefore: 'devToolsEndSeparator',
});

