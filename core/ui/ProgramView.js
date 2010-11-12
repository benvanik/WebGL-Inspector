(function () {
    var ui = glinamespace("gli.ui");

    var ProgramView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };

        this.currentProgram = null;
    };

    function appendbr(el) {
        var br = document.createElement("br");
        el.appendChild(br);
    };

    function appendSeparator(el) {
        var div = document.createElement("div");
        div.className = "program-info-separator";
        el.appendChild(div);
        appendbr(el);
    };

    function appendParameters(gl, el, obj, parameters) {
        var table = document.createElement("table");
        table.className = "info-parameters";

        for (var n = 0; n < parameters.length; n++) {
            var enumName = parameters[n];
            var value = obj.parameters[gl[enumName]];

            var tr = document.createElement("tr");
            tr.className = "info-parameter-row";

            var tdkey = document.createElement("td");
            tdkey.className = "info-parameter-key";
            tdkey.innerHTML = enumName;
            tr.appendChild(tdkey);

            var tdvalue = document.createElement("td");
            tdvalue.className = "info-parameter-value";
            tdvalue.innerHTML = value; // TODO: convert to something meaningful?
            tr.appendChild(tdvalue);

            table.appendChild(tr);
        }

        el.appendChild(table);
    };

    function prettyPrintSource(el, source, highlightLines) {
        var div = document.createElement("div");
        div.innerHTML = source;
        el.appendChild(div);

        var firstLine = 1;
        var firstChar = source.search(/./);
        if (firstChar > 0) {
            firstLine += firstChar;
        }

        SyntaxHighlighter.highlight({
            brush: 'glsl',
            'first-line': firstLine,
            highlight: highlightLines,
            toolbar: false
        }, div);
    };

    function generateShaderDisplay(gl, el, shader) {
        var shaderType = (shader.type == gl.VERTEX_SHADER) ? "Vertex" : "Fragment";

        var titleDiv = document.createElement("div");
        titleDiv.className = "shader-info-title";
        titleDiv.innerHTML = shaderType + " shader " + shader.id;
        el.appendChild(titleDiv);

        appendParameters(gl, el, shader, ["COMPILE_STATUS", "DELETE_STATUS"]);

        var highlightLines = [];
        if (shader.infoLog && shader.infoLog.length > 0) {
            var errorLines = shader.infoLog.match(/^ERROR: [0-9]+:[0-9]+: /gm);
            for (var n = 0; n < errorLines.length; n++) {
                // expecting: 'ERROR: 0:LINE: '
                var errorLine = errorLines[n];
                errorLine = parseInt(errorLine.match(/ERROR: [0-9]+:([0-9]+): /)[1]);
                highlightLines.push(errorLine);
            }
        }

        var sourceDiv = document.createElement("div");
        sourceDiv.className = "shader-info-source";
        if (shader.source) {
            prettyPrintSource(sourceDiv, shader.source, highlightLines);
        } else {
            sourceDiv.innerHTML = "[no source uploaded]";
        }
        el.appendChild(sourceDiv);

        if (shader.infoLog && shader.infoLog.length > 0) {
            var infoDiv = document.createElement("div");
            infoDiv.className = "program-info-log";
            infoDiv.innerHTML = shader.infoLog.replace(/\n/, "<br/>");
            el.appendChild(infoDiv);
            appendbr(el);
        }
    };

    function generateProgramDisplay(gl, el, program) {
        var programDiv = document.createElement("div");

        var titleDiv = document.createElement("div");
        titleDiv.className = "program-info-title";
        titleDiv.innerHTML = "Program " + program.id;
        el.appendChild(titleDiv);

        appendParameters(gl, el, program, ["LINK_STATUS", "VALIDATE_STATUS", "DELETE_STATUS", "ACTIVE_ATTRIBUTES", "ACTIVE_UNIFORMS"]);
        appendbr(el);

        if (program.infoLog && program.infoLog.length > 0) {
            var infoDiv = document.createElement("div");
            infoDiv.className = "program-info-log";
            infoDiv.innerHTML = program.infoLog.replace(/\n/, "<br/>");
            el.appendChild(infoDiv);
            appendbr(el);
        }

        var vertexShader = program.getVertexShader(gl);
        var fragmentShader = program.getFragmentShader(gl);
        if (vertexShader) {
            var vertexShaderDiv = document.createElement("div");
            appendSeparator(el);
            generateShaderDisplay(gl, el, vertexShader);
        }
        if (fragmentShader) {
            var fragmentShaderDiv = document.createElement("div");
            appendSeparator(el);
            generateShaderDisplay(gl, el, fragmentShader);
        }
    };

    ProgramView.prototype.setProgram = function (program) {
        this.elements.view.innerHTML = "";
        if (program) {
            generateProgramDisplay(this.window.context, this.elements.view, program);
        }

        this.elements.view.scrollTop = 0;
    };

    ui.ProgramView = ProgramView;
})();
