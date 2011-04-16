(function () {
    var controls = glinamespace("gli.ui.controls");
    
    var StatusBar = function StatusBar(parentElement) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-statusbar");
        parentElement.appendChild(el);
        
        this.segments = {};
    };
    
    StatusBar.prototype.addSegment = function addSegment(name, align) {
        var segment = new StatusBarSegment(this, name, align);
        this.segments[name] = segment;
        
        // TODO: place properly based on alignment
        switch (align) {
        case "left":
            break;
        case "right":
            break;
        }
        this.el.appendChild(segment.el);
        
        return segment;
    };

    StatusBar.prototype.getSegment = function getSegment(name) {
        return this.segments[name];
    };
    
    var StatusBarSegment = function StatusBarSegment(parentStatusBar, name, align) {
        var self = this;
        var parentElement = parentStatusBar.el;
        var doc = parentElement.ownerDocument;
        
        this.name = name;
        this.align = align;
        this.items = {};
        
        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-statusbar-segment");
        gli.ui.addClass(el, "gli-statusbar-segment-" + align);
    };
    StatusBarSegment.prototype.addItem = function addItem(item) {
        this.items[item.name] = item;
        this.el.appendChild(item.el);
    };
    StatusBarSegment.prototype.getItem = function getItem(name) {
        return this.items[name];
    };
    
    controls.StatusBar = StatusBar;
    
})();
