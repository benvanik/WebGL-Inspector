(function () {
    var playback = glinamespace("gli.playback");
    
    playback.checkErrors = function checkErrors(gl, msg) {
        var error;
        while (error = gl.getError()) {
            if (error) {
                console.log(msg + ": " + error);
            }
        }
        return error;
    };
    
})();
