(function () {

    function createWindow(id, title) {
        var root = document.createElement("div");
        root.id = id;
        root.className = "gli-reset window";

        // Titlebar
        // <div class="window-titlebar">
        //     <div class="window-titlebar-left"></div>
        //     <div class="window-titlebar-right"></div>
        // ...
        var titlebar = document.createElement("div");
        titlebar.className = "window-titlebar";
        var titlebarLeft = document.createElement("div");
        titlebarLeft.className = "window-titlebar-left";
        titlebar.appendChild(titlebarLeft);
        var titlebarRight = document.createElement("div");
        titlebarRight.className = "window-titlebar-right";
        titlebar.appendChild(titlebarRight);

        {
            // <div class="window-controls">
            //     <div class="window-control window-control-minimize" title="Minimize">&nbsp;</div>
            //     <div class="window-control window-control-restore" title="Restore">&nbsp;</div>
            // </div>
            var titlebarControls = document.createElement("div");
            titlebarControls.className = "window-controls";

            var minimize = document.createElement("div");
            minimize.className = "window-control window-control-minimize";
            minimize.title = "Minimize";
            minimize.innerHTML = " ";
            titlebarControls.appendChild(minimize);
            var restore = document.createElement("div");
            restore.className = "window-control window-control-restore";
            restore.title = "Restore";
            restore.innerHTML = " ";
            titlebarControls.appendChild(restore);

            titlebar.appendChild(titlebarControls);
        }

        // <div class="window-titlename">window title</div>
        var titlename = document.createElement("div");
        titlename.className = "window-titlename";
        titlename.innerHTML = title;
        titlebar.appendChild(titlename);

        root.appendChild(titlebar);

        // Toolbar
        // <div class="window-toolbar">
        // ...
        var toolbar = document.createElement("div");
        toolbar.className = "window-toolbar";
        root.appendChild(toolbar);

        // Middle
        // <div class="window-middle">
        // ...
        var middle = document.createElement("div");
        middle.className = "window-middle";
        root.appendChild(middle);

        // Bottom
        // <div class="window-bottom">
        //     <div class="window-bottom-left"></div>
        //     <div class="window-bottom-right"></div>
        //     <div class="window-status"><!-- status bar --></div>
        // </div>
        var bottom = document.createElement("div");
        bottom.className = "window-bottom";
        var bottomLeft = document.createElement("div");
        bottomLeft.className = "window-bottom-left";
        bottom.appendChild(bottomLeft);
        var bottomRight = document.createElement("div");
        bottomRight.className = "window-bottom-right";
        bottom.appendChild(bottomRight);
        var statusbar = document.createElement("div");
        statusbar.className = "window-status";
        bottom.appendChild(statusbar);
        root.appendChild(bottom);

        root.elements = {
            titlename: titlename,
            titlebar: titlebar,
            toolbar: toolbar,
            middle: middle,
            statusbar: statusbar
        };

        return root;
    };

    function injectWindow(id) {
        var window = createWindow(id, "WebGL Inspector");

        var titlebar = window.elements.titlebar;

        // <div class="window-titlecap" title="Capture Frame">&nbsp;</div>
        var titlecap = document.createElement("div");
        titlecap.className = "window-titlecap";
        titlecap.title = "Capture Frame";
        titlecap.innerHTML = "";
        titlebar.appendChild(titlecap);

        var middle = window.elements.middle;

        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-trace-inspector">' +
        '            <!-- inspector -->' +
        '        </div>' +
        '        <div class="window-trace-outer">' +
        '            <div class="window-trace">' +
        '                <div class="trace-minibar">' +
        '                    <!-- minibar -->' +
        '                </div>' +
        '                <div class="trace-listing">' +
        '                    <!-- call trace -->' +
        '                </div>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-frames">' +
        '        <div class="frames-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="frames-toolbar">' +
        '            capture, delete</div>' +
        '    </div>' +
        '</div>';
        middle.innerHTML = html;

        document.body.appendChild(window);
    };

    function createHUD(id, title) {
        var root = document.createElement("div");
        root.id = id;
        root.className = "gli-reset hud";

        // Titlebar
        // <div class="hud-titlebar">
        //     <div class="hud-titlebar-left"></div>
        //     <div class="hud-titlebar-right"></div>
        // ...
        var titlebar = document.createElement("div");
        titlebar.className = "hud-titlebar";
        var titlebarLeft = document.createElement("div");
        titlebarLeft.className = "hud-titlebar-left";
        titlebar.appendChild(titlebarLeft);
        var titlebarRight = document.createElement("div");
        titlebarRight.className = "hud-titlebar-right";
        titlebar.appendChild(titlebarRight);

        {
            // <div class="hud-controls">
            //     <div class="hud-control hud-control-minimize" title="Minimize">&nbsp;</div>
            //     <div class="hud-control hud-control-restore" title="Restore">&nbsp;</div>
            // </div>
            var titlebarControls = document.createElement("div");
            titlebarControls.className = "window-controls";

            var minimize = document.createElement("div");
            minimize.className = "hud-control hud-control-minimize";
            minimize.title = "Minimize";
            minimize.innerHTML = " ";
            titlebarControls.appendChild(minimize);
            var restore = document.createElement("div");
            restore.className = "hud-control hud-control-restore";
            restore.title = "Restore";
            restore.innerHTML = " ";
            titlebarControls.appendChild(restore);

            titlebar.appendChild(titlebarControls);
        }

        // <div class="hud-titlename">hud title</div>
        var titlename = document.createElement("div");
        titlename.className = "hud-titlename";
        titlename.innerHTML = title;
        titlebar.appendChild(titlename);

        root.appendChild(titlebar);

        // Toolbar
        // <div class="hud-toolbar">
        // ...
        var toolbar = document.createElement("div");
        toolbar.className = "hud-toolbar";
        root.appendChild(toolbar);

        // Middle
        // <div class="hud-middle">
        //     <div class="hud-left"></div>
        //     <div class="hud-right"></div>
        // ...
        var middle = document.createElement("div");
        middle.className = "hud-middle";
        var middleLeft = document.createElement("div");
        middleLeft.className = "hud-left";
        middle.appendChild(middleLeft);
        var middleRight = document.createElement("div");
        middleRight.className = "hud-right";
        middle.appendChild(middleRight);
        root.appendChild(middle);

        // Bottom
        // <div class="hud-bottom">
        //     <div class="hud-bottom-left"></div>
        //     <div class="hud-bottom-right"></div>
        // </div>
        var bottom = document.createElement("div");
        bottom.className = "hud-bottom";
        var bottomLeft = document.createElement("div");
        bottomLeft.className = "hud-bottom-left";
        bottom.appendChild(bottomLeft);
        var bottomRight = document.createElement("div");
        bottomRight.className = "hud-bottom-right";
        bottom.appendChild(bottomRight);
        root.appendChild(bottom);

        root.elements = {
            titlename: titlename,
            toolbar: toolbar,
            middle: middle
        };

        return root;
    };

    function injectStateHUD(id) {
        var window = createHUD(id, "State");

        var middle = window.elements.middle;

        var html =
        '<div class="state-listing">' +
        '    <!-- state info -->' +
        '</div>';
        middle.innerHTML = html;

        document.body.appendChild(window);
    }

    function injectOutputHUD(id) {
        var window = createHUD(id, "Output");

        var toolbar = window.elements.toolbar;

        var html =
        '<div class="hud-toolbar-left">' +
        '    Buffer: ' +
        '    <select class="hud-toolbar-dropdown output-buffer-dropdown">' +
        '        <option value="0" selected="selected">Color 0</option>' +
        '        <option value="1">Depth</option>' +
        '        <option value="2">Stencil</option>' +
        '    </select>' +
        '</div>' +
        '<div class="hud-toolbar-right">' +
        '    Preview: ' +
        '    <select class="hud-toolbar-dropdown output-size-dropdown">' +
        '        <option value="50">50%</option>' +
        '        <option value="75" selected="selected">75%</option>' +
        '        <option value="100">100%</option>' +
        '        <option value="150">150%</option>' +
        '        <option value="200">200%</option>' +
        '    </select>' +
        '</div>';
        toolbar.innerHTML = html;

        var middle = window.elements.middle;

        var html =
        '<canvas class="output-canvas"></canvas>';
        middle.innerHTML = html;

        document.body.appendChild(window);
    }

    gli.ui = gli.ui || {};
    gli.ui.inject = function () {

        injectWindow("gli-window");
        injectStateHUD("gli-statehud");
        injectOutputHUD("gli-outputhud");


    };
})();
