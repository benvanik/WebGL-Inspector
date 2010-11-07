(function () {
    var host = glinamespace("gli.host");
    
    function requestCapture(context) {
        context.requestCapture(function (context, frame) {
            for (var n = 0; n < frame.calls.length; n++) {
                var call = frame.calls[n];
                call.info = gli.info.functions[call.name];
            }
            context.frames.push(frame);
            if (context.ui) {
                context.ui.appendFrame(frame);
            }
        });
    };
    
    var PopupWindow = function (context) {
        var self = this;
        this.context = context;
        
        var w = this.browserWindow = window.open("", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=1000,innerHeight=350");
        w.document.writeln("<html><head><title>WebGL Inspector</title></head><body></body></html>");
        
        w.addEventListener("unload", function () {
            context.window.browserWindow.opener.focus();
            context.window = null;
        }, false);
        
        // Key handler to listen for state changes
        w.document.addEventListener("keydown", function(event) {
            var handled = false;
            switch (event.keyCode) {
                case 122: // F11
                    w.opener.focus();
                    handled = true;
                    break;
                case 123: // F12
                    requestCapture(context);
                    handled = true;
                    break;
            };
            
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
        
        gliloader.load(["replay", "ui"], function () {
            context.ui = new w.gli.ui.Window(context);
        }, w);
        
        this.context.window = context;
    };
    
    PopupWindow.prototype.focus = function () {
        this.browserWindow.focus();
    };
    
    PopupWindow.prototype.close = function () {
        this.browserWindow.close();
        this.browserWindow = null;
        this.context.window = null;
    };
    
    PopupWindow.prototype.isOpened = function() {
        return this.browserWindow && !this.browserWindow.closed;
    };
    
    function requestFullUI(context) {
        if (context.window) {
            if (context.window.isOpened()) {
                context.window.focus();
            } else {
                context.window.close();
            }
        }
        
        if (!context.window) {
            context.window = new PopupWindow(context);
        }
    };

    function injectUI(ui) {
        var context = ui.context;
        
        var button1 = document.createElement("div");
        button1.style.zIndex = "99999";
        button1.style.position = "absolute";
        button1.style.right = "38px";
        button1.style.top = "5px";
        button1.style.cursor = "pointer";
        button1.style.backgroundColor = "rgba(50,10,10,0.8)";
        button1.style.color = "red";
        button1.style.font = "8pt Monaco";
        button1.style.fontWeight = "bold";
        button1.style.padding = "5px";
        button1.style.border = "1px solid red";
        button1.style.webkitUserSelect = "none";
        button1.style.mozUserSelect = "none";
        button1.title = "Capture frame (F12)";
        button1.innerHTML = "Capture";
        document.body.appendChild(button1);
        
        button1.addEventListener("click", function() {
            requestCapture(context);
        }, false);
        
        var button2 = document.createElement("div");
        button2.style.zIndex = "99999";
        button2.style.position = "absolute";
        button2.style.right = "5px";
        button2.style.top = "5px";
        button2.style.cursor = "pointer";
        button2.style.backgroundColor = "rgba(10,50,10,0.8)";
        button2.style.color = "rgb(0,255,0)";
        button2.style.font = "8pt Monaco";
        button2.style.fontWeight = "bold";
        button2.style.padding = "5px";
        button2.style.border = "1px solid rgb(0,255,0)";
        button2.style.webkitUserSelect = "none";
        button2.style.mozUserSelect = "none";
        button2.title = "Show full inspector (F11)";
        button2.innerHTML = "UI";
        document.body.appendChild(button2);
        
        button2.addEventListener("click", function() {
            requestFullUI(context);
        }, false);
    };
    
    function injectHandlers(ui) {
        var context = ui.context;
        
        // Key handler to listen for capture requests
        document.addEventListener("keydown", function(event) {
            var handled = false;
            switch (event.keyCode) {
                case 122: // F11
                    requestFullUI(context);
                    handled = true;
                    break;
                case 123: // F12
                    requestCapture(context);
                    handled = true;
                    break;
            };
            
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
    };

    var HostUI = function (context) {
        this.context = context;
        
        injectUI(this);
        injectHandlers(this);
        
        this.context.frames = [];
    };

    host.HostUI = HostUI;
})();
