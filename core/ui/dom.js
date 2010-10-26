(function () {

    function injectFragment(id, className, html) {
        var div = document.createElement("div");
        div.id = id;
        div.className = className;
        div.innerHTML = html;
        document.body.appendChild(div);
    };

    function injectWindow(id) {
        var html =
        '<div>' +
        '    <div class="window-titlebar">' +
        '        <div class="window-titlebar-left"></div>' +
        '        <div class="window-titlebar-right"></div>' +
        '        <div class="window-controls">' +
        '            <div class="window-control window-control-minimize" title="Minimize">&nbsp;</div>' +
        '            <div class="window-control window-control-restore" title="Restore">&nbsp;</div>' +
        '        </div>' +
        '        <div class="window-titlename">window title</div>' +
        '        <div class="window-titlecap" title="Capture Frame">&nbsp;</div>' +
        '    </div>' +
        '    <div class="window-toolbar">' +
        '        <!-- capture, trace, resources, options, etc--></div>' +
        '    <div class="window-middle">' +
        '        <div class="window-right-outer">' +
        '            <div class="window-right">' +
        '                <div class="window-trace-inspector">' +
        '                    <!-- inspector -->' +
        '                </div>' +
        '                <div class="window-trace-outer">' +
        '                    <div class="window-trace">' +
        '                        <div class="trace-minibar">' +
        '                            <!-- minibar -->' +
        '                        </div>' +
        '                        <div class="trace-listing">' +
        '                            <!-- call trace -->' +
        '                        </div>' +
        '                    </div>' +
        '                </div>' +
        '            </div>' +
        '            <div class="window-frames">' +
        '                <div class="frames-listing">' +
        '                    <!-- frame list -->' +
        '                </div>' +
        '                <div class="frames-toolbar">' +
        '                    capture, delete</div>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-bottom">' +
        '        <div class="window-bottom-left"></div>' +
        '        <div class="window-bottom-right"></div>' +
        '        <div class="window-status"><!-- status bar --></div>' +
        '    </div>'
        '</div>';
        injectFragment(id, "window", html);
    };

    function injectStateHUD(id) {
        var html =
        '<div class="hud-titlebar">' +
        '    <div class="hud-titlebar-left"></div>' +
        '    <div class="hud-titlebar-right"></div>' +
        '    <div class="hud-controls">' +
        '        <div class="hud-control hud-control-minimize" title="Minimize">&nbsp;</div>' +
        '        <div class="hud-control hud-control-restore" title="Restore">&nbsp;</div>' +
        '    </div>' +
        '    <div class="hud-titlename">State</div>' +
        '</div>' +
        '<div class="hud-toolbar">' +
        '    <!--category picker, etc--></div>' +
        '<div class="hud-middle">' +
        '    <div class="hud-left"></div>' +
        '    <div class="hud-right"></div>' +
        '    <div class="state-listing">' +
        '        <!-- state info -->' +
        '    </div>' +
        '</div>' +
        '<div class="hud-bottom">' +
        '    <div class="hud-bottom-left"></div>' +
        '    <div class="hud-bottom-right"></div>' +
        '</div>';
        injectFragment(id, "hud", html);
    }

    function injectOutputHUD(id) {
        var html =
        '<div class="hud-titlebar">' +
        '    <div class="hud-titlebar-left"></div>' +
        '    <div class="hud-titlebar-right"></div>' +
        '    <div class="hud-controls">' +
        '        <div class="hud-control hud-control-minimize" title="Minimize">&nbsp;</div>' +
        '        <div class="hud-control hud-control-restore" title="Restore">&nbsp;</div>' +
        '    </div>' +
        '    <div class="hud-titlename">Output</div>' +
        '</div>' +
        '<div class="hud-toolbar">' +
        '    <!--buffer picker, etc - 25%/50%/100%/150%/200%/etc--></div>' +
        '<div class="hud-middle">' +
        '    <div class="hud-left"></div>' +
        '    <div class="hud-right"></div>' +
        '    <canvas class="output-canvas" style="border: none;"></canvas>' +
        '</div>' +
        '<div class="hud-bottom">' +
        '    <div class="hud-bottom-left"></div>' +
        '    <div class="hud-bottom-right"></div>' +
        '</div>';
        injectFragment(id, "hud", html);
    }

    gli.ui = gli.ui || {};
    gli.ui.inject = function () {
        
        injectWindow("gli-window");
        injectStateHUD("gli-statehud");
        injectOutputHUD("gli-outputhud");


    };
})();
