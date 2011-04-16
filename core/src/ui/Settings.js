(function () {
    var ui = glinamespace("gli.ui");

    var Settings = function () {
        this.global = {};

        this.session = {
            popups: {
                main: {
                    width: 1000,
                    height: 800
                }
            },
            splitPanels: {
                traceTab: 250
            }
        };

        this.load();
    };

    Settings.prototype.setGlobals = function (globals) {
        for (var n in globals) {
            this.global[n] = globals[n];
        }
    };

    Settings.prototype.load = function () {
        var sessionString = localStorage["__gli_ui_settings"];
        if (sessionString) {
            var sessionObj = JSON.parse(sessionString);
            gli.util.deepCloneInto(this.session, sessionObj);
        }
    };
    Settings.prototype.save = function () {
        localStorage["__gli_ui_settings"] = JSON.stringify(this.session);
    };

    ui.settings = new Settings();
})();
