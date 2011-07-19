(function () {
    var host = glinamespace("gli.host");

    var Notifier = function () {
        this.div = document.createElement("div");
        this.div.style.zIndex = "99999";
        this.div.style.position = "absolute";
        this.div.style.left = "5px";
        this.div.style.top = "5px";
        this.div.style.webkitTransition = "opacity .5s ease-in-out";
        this.div.style.opacity = "0";
        this.div.style.color = "yellow";
        this.div.style.fontSize = "8pt";
        this.div.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        this.div.style.backgroundColor = "rgba(0,0,0,0.8)";
        this.div.style.padding = "5px";
        this.div.style.border = "1px solid yellow";
        document.body.appendChild(this.div);
        
        this.hideTimeout = -1;
    };
    
    Notifier.prototype.postMessage = function(message) {
        console.log(message);
        this.div.style.opacity = "1";
        this.div.innerHTML = message;
        
        var self = this;
        if (this.hideTimeout >= 0) {
            gli.host.clearTimeout(this.hideTimeout);
            this.hideTimeout = -1;
        }
        this.hideTimeout = gli.host.setTimeout(function() {
            self.div.style.opacity = "0";
        }, 2000);
    };

    host.Notifier = Notifier;
})();
