(function () {
    var hacks = glinamespace("gli.hacks");

    hacks.installAll = function (gl) {
        if (gl.__hasHacksInstalled) {
            return;
        }
        gl.__hasHacksInstalled = true;
    };

})();
