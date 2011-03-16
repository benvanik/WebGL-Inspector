(function () {
    var util = glinamespace("gli.util");

    util.installWebGLHacks = function installWebGLHacks(gl) {
        if (gl._webglHacksInstalled) {
            return;
        }
        gl._webglHacksInstalled = true;
        
        // TODO: hacks!
    };

})();
