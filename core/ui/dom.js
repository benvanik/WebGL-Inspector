(function () {

    function injectFragment(id, html) {
        var div = document.createElement("div");
        div.id = id;
        div.innerHTML = html;
        document.body.appendChild(div);
    };

    function injectWindow(id) {
        var html =
        '<div>' +
        '    <div class="window-titlebar">' +
        '        <div class="window-titlecap">cap</div>' +
        '        <div class="window-titlename">window title</div>' +
        '        <div class="window-controls">' +
        '            <div class="window-control window-control-minimize">_</div>' +
        '            <div class="window-control window-control-restore">o</div>' +
        '            <div class="window-control window-control-maximize">O</div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-toolbar">' +
        '        capture, trace, resources, options, etc</div>' +
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
        '        <div class="window-status">status bar</div>' +
        '    </div>'
        '</div>';
        injectFragment(id, html);
    };

    function injectStateHUD(id) {
        var html =
        '<div class="hud">' +
        '    <div class="hud-titlebar">' +
        '        <div class="hud-titlename">State</div>' +
        '        <div class="hud-controls">' +
        '            <div class="hud-control hud-control-minimize">_</div>' +
        '            <div class="hud-control hud-control-restore">o</div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="hud-toolbar">' +
        '        category picker, etc</div>' +
        '    <div class="hud-middle">' +
        '        <div class="state-listing">' +
        '            <!-- state info -->' +
        '        </div>' +
        '    </div>' +
        '    <div class="hud-bottom">' +
        '        <div class="hud-status">status bar</div>' +
        '    </div>' +
        '</div>';
        injectFragment(id, html);
    }

    function injectOutputHUD(id) {
        var html =
        '<div class="hud">' +
        '    <div class="hud-titlebar">' +
        '        <div class="hud-titlename">Output</div>' +
        '        <div class="hud-controls">' +
        '            <div class="hud-control hud-control-minimize">_</div>' +
        '            <div class="hud-control hud-control-restore">o</div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="hud-toolbar">' +
        '        buffer picker, etc - 25%/50%/100%/150%/200%/etc</div>' +
        '    <div class="hud-middle">' +
        '        <canvas class="output-canvas" style="border: none;"></canvas>' +
        '    </div>' +
        '    <div class="hud-bottom">' +
        '        <div class="hud-status">status bar</div>' +
        '    </div>' +
        '</div>';
        injectFragment(id, html);
    }

    gli.ui = gli.ui || {};
    gli.ui.inject = function () {

        injectWindow("gli-window");
        injectStateHUD("gli-statehud");
        injectOutputHUD("gli-outputhud");

    };
})();
