(function () {

    function generateStateValue(gl, valueel, param, value) {
        var UIType = gli.UIType;

        var readOnly = param.readOnly;
        var ui = param.ui;

        var outputHTML = "";
        switch (ui.type) {
            case UIType.ENUM:
                outputHTML += "<select class='state-row-value-enum'>";
                var anyMatches = false;
                for (var i = 0; i < ui.values.length; i++) {
                    var enumName = ui.values[i];
                    outputHTML += "<option value='' " + ((value == gl[enumName]) ? "selected='selected'" : "") + ">" + enumName + "</option>";
                    if (value == gl[enumName]) {
                        anyMatches = true;
                    }
                }
                if (anyMatches == false) {
                    outputHTML += "<option selected='selected'>Unknown - " + value.toString(10) + " ~ 0x" + value.toString(16) + "</option>";
                }
                outputHTML += "</select>";
                break;
            case UIType.ARRAY:
                outputHTML += "(array) " + value;
                break;
            case UIType.BOOL:
                outputHTML += "<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value ? "checked='checked'" : "") + "/>";
                break;
            case UIType.LONG:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value + "'/>";
                break;
            case UIType.ULONG:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value + "'/>";
                break;
            case UIType.COLORMASK:
                outputHTML += "R<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[0] ? "checked='checked'" : "") + "/>";
                outputHTML += "G<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[1] ? "checked='checked'" : "") + "/>";
                outputHTML += "B<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[2] ? "checked='checked'" : "") + "/>";
                outputHTML += "A<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[3] ? "checked='checked'" : "") + "/>";
                break;
            case UIType.OBJECT:
                outputHTML += value;
                break;
            case UIType.WH:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>" + " x " + "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>";
                break;
            case UIType.RECT:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>" + ", " + "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>" + " " + "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>" + " x " + "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>";
                break;
            case UIType.STRING:
                outputHTML += "<input class='state-row-value-string' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value + "'/>";
                break;
            case UIType.COLOR:
                outputHTML += "<span style='color: rgb(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + ")'>rgba(" +
                                "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>, " +
                                "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>, " +
                                "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>, " +
                                "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>" +
                                ")</span>";
                break;
            case UIType.FLOAT:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value + "'/>";
                break;
            case UIType.BITMASK:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='0x" + value.toString(16) + "'/>";
                break;
            case UIType.RANGE:
                outputHTML += "<input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/> - <input class='state-row-value-numeric' type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>";
                break;
            case UIType.MATRIX:
                outputHTML += "(matrix) " + value;
                break;
        }

        valueel.innerHTML = outputHTML;
    };

    function generateStateTable(context, el, category, state) {
        var gl = context;

        var stateParameters = gli.info.stateParameters;
        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            var value = state[param.value ? param.value : param.name];

            var row = document.createElement("div");
            row.className = "state-row";

            var nameel = document.createElement("div");
            nameel.className = "state-row-name";
            nameel.innerHTML = param.name + ":&nbsp;";
            row.appendChild(nameel);

            var valueel = document.createElement("div");
            valueel.className = "state-row-value";
            generateStateValue(gl, valueel, param, value);
            row.appendChild(valueel);

            el.appendChild(row);
        }
    };

    var Titlebar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            titlename: w.root.getElementsByClassName("hud-titlename")[0],
            windowControls: {
                minimize: w.root.getElementsByClassName("hud-control-minimize")[0],
                restore: w.root.getElementsByClassName("hud-control-restore")[0]
            }
        };

        this.elements.titlename.innerHTML = "State";

        this.elements.windowControls.minimize.onclick = function () {
            w.minimize();
        };
        this.elements.windowControls.restore.onclick = function () {
            w.restore();
        };
    };

    var Toolbar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {
            toolbar: w.root.getElementsByClassName("hud-toolbar")[0]
        };
    };

    var Statusbar = function (w) {
        var self = this;
        this.window = w;
        this.elements = {};
    };

    var StateHUD = function (context, root) {
        this.context = context;
        this.root = root;

        this.elements = {
            titlebar: this.root.getElementsByClassName("hud-titlebar")[0],
            toolbar: this.root.getElementsByClassName("hud-toolbar")[0],
            middle: this.root.getElementsByClassName("hud-middle")[0],
            bottom: this.root.getElementsByClassName("hud-bottom")[0]
        };

        this.listing = this.root.getElementsByClassName("state-listing")[0];

        this.titlebar = new Titlebar(this);
        this.toolbar = new Toolbar(this);
        this.statusbar = new Statusbar(this);
    };

    StateHUD.prototype.minimize = function () {
        this.elements.toolbar.style.display = "none";
        this.elements.middle.style.display = "none";
        this.elements.bottom.style.display = "none";
    };

    StateHUD.prototype.restore = function () {
        this.elements.toolbar.style.display = "";
        this.elements.middle.style.display = "";
        this.elements.bottom.style.display = "";
    };

    StateHUD.prototype.reset = function () {
        this.listing.innerHTML = "";
    };

    StateHUD.prototype.showState = function (state) {
        this.reset();
        generateStateTable(this.context, this.listing, null, state);
    };

    gli.ui = gli.ui || {};
    gli.ui.StateHUD = StateHUD;

})();
