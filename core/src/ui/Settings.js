(function () {
    var ui = glinamespace("gli.ui");

    var Settings = function () {
        this.global = {
        };

        this.session = {
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
            for (var n in sessionObj) {
                this.session[n] = sessionObj[n];
            }
        }
    };
    Settings.prototype.save = function () {
        localStorage["__gli_ui_settings"] = JSON.stringify(this.session);
    };

    ui.settings = new Settings();
})();
