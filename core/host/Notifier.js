(function () {
    var host = glinamespace("gli.host");

    var Notifier = function () {
    };
    
    Notifier.prototype.postMessage = function(message) {
        console.log(message);
    };

    host.Notifier = Notifier;
})();
