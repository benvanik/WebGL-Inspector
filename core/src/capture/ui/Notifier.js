(function () {
    var ui = glinamespace("gli.capture.ui");

    var Note = function Note(message, y, callback) {
        var div = this.div = document.createElement("div");
        div.style.zIndex = "99999";
        div.style.position = "absolute";
        div.style.left = "5px";
        div.style.top = String(5 + y) + "px";
        div.style.mozTransition = "opacity .5s ease-in-out";
        div.style.webkitTransition = "opacity .5s ease-in-out";
        div.style.opacity = "0";
        div.style.color = "yellow";
        div.style.fontSize = "8pt";
        div.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        div.style.backgroundColor = "rgba(0,0,0,0.8)";
        div.style.padding = "5px";
        div.style.border = "1px solid yellow";
        
        this.message = message;
        div.innerHTML = message;        
        
        document.body.appendChild(div);
        div.style.opacity = "1";
        
        console.log(message);        
        
        var self = this;
        gli.util.setTimeout(function hideNote() {
            div.style.opacity = "0";
            
            function removeNote() {
                div.removeEventListener("webkitTransitionEnd", removeNote, true);
                div.removeEventListener("transitionend", removeNote, true);
                div.parentNode.removeChild(div);
                callback(self);
            };
            div.addEventListener("webkitTransitionEnd", removeNote, true);
            div.addEventListener("transitionend", removeNote, true);
        }, 1000);
    };
    
    var Notifier = function Notifier() {
        this.notes = [];
        this.y = 0;
    };
    
    Notifier.prototype.postMessage = function postMessage(message) {
        var self = this;
        var note = new Note(message, this.y, function (note) {
            self.notes.splice(self.notes.indexOf(note), 1);
            if (!self.notes.length) {
                self.y = 0;
            }
        });
        this.y += 30;
        this.notes.push(note);
    };

    ui.Notifier = Notifier;
})();
