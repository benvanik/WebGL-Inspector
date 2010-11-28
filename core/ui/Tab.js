(function () {
    var ui = glinamespace("gli.ui");

    var Tab = function (w, container, name) {
        this.name = name;
        this.hasFocus = false;

        var el = this.el = document.createElement("div");
        el.className = "window-tab-root";
        container.appendChild(el);

        this.gainedFocus = new gli.EventSource("gainedFocus");
        this.lostFocus = new gli.EventSource("lostFocus");
    };
    Tab.prototype.gainFocus = function () {
        this.hasFocus = true;
        this.el.className += " window-tab-selected";
        this.gainedFocus.fire();
    };
    Tab.prototype.loseFocus = function () {
        this.lostFocus.fire();
        this.hasFocus = false;
        this.el.className = this.el.className.replace(" window-tab-selected", "");
    };

    // TODO: don't use a shared template, or find a better way of doing it!
    Tab.genericLeftRightView =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '       <div class="window-right-inner">' +
        '           <!-- scrolling contents -->' +
        '       </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- state list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- toolbar --></div>' +
        '    </div>' +
        '</div>';

    ui.Tab = Tab;
})();
