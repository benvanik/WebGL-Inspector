(function () {
    var ui = glinamespace("gli.ui");

    var ProgramsTab = function (w) {
        var self = this;
        this.el.appendChild(gli.ui.Tab.genericLeftRightView());

        this.listing = new gli.ui.LeftListing(w, this.el, "program", function (el, program) {
            var gl = w.context;

            if (program.status == gli.host.Resource.DEAD) {
                el.className += " program-item-deleted";
            }

            var number = document.createElement("div");
            number.className = "program-item-number";
            number.textContent = program.getName();
            el.appendChild(number);

            var vsrow = document.createElement("div");
            vsrow.className = "program-item-row";
            el.appendChild(vsrow);
            var fsrow = document.createElement("div");
            fsrow.className = "program-item-row";
            el.appendChild(fsrow);

            function updateShaderReferences() {
                var vs = program.getVertexShader(gl);
                var fs = program.getFragmentShader(gl);
                vsrow.textContent = "VS: " + (vs ? ("Shader " + vs.id) : "[none]");
                fsrow.textContent = "FS: " + (fs ? ("Shader " + fs.id) : "[none]");
            }
            updateShaderReferences();

            program.modified.addListener(this, function (program) {
                updateShaderReferences();
                if (self.programView.currentProgram == program) {
                    self.programView.setProgram(program);
                }
            });
            program.deleted.addListener(this, function (program) {
                el.className += " program-item-deleted";
            });

        });
        this.programView = new gli.ui.ProgramView(w, this.el);

        this.listing.valueSelected.addListener(this, function (program) {
            this.programView.setProgram(program);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });

        // Append programs already present
        var context = w.context;
        var programs = context.resources.getPrograms();
        for (var n = 0; n < programs.length; n++) {
            var program = programs[n];
            this.listing.appendValue(program);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLProgram") {
                this.listing.appendValue(resource);
            }
        });

        this.refresh = function () {
            this.programView.setProgram(this.programView.currentProgram);
        };
    };

    ui.ProgramsTab = ProgramsTab;
})();
