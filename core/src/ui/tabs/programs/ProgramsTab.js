(function () {
    var ui = glinamespace("gli.ui");

    var ProgramsTab = function (w) {
        var self = this;
        this.el.innerHTML = gli.ui.Tab.genericLeftRightView;

        this.listing = new gli.ui.LeftListing(w, this.el, "program", function (el, program) {
            var gl = w.context;
            
            var name = el.name = document.createElement("div");
            name.className = "program-item-number";
            name.innerHTML = program.getName();
            el.appendChild(name);

            var vsrow = el.vsrow = document.createElement("div");
            vsrow.className = "program-item-row";
            vsrow.innerHTML = "VS: [none]";
            el.appendChild(vsrow);
            var fsrow = el.fsrow = document.createElement("div");
            fsrow.className = "program-item-row";
            fsrow.innerHTML = "FS: [none]";
            el.appendChild(fsrow);
        }, function (el, program) {
            var gl = w.context;
            
            if (!program.alive && (el.className.indexOf("program-item-deleted") == -1)) {
                el.className += " program-item-deleted";
            }
            
            el.name.innerHTML = program.getName();
            
            var version = program.getLatestVersion();
            if (version) {
                var vs = program.getVertexShader(gl, version);
                var fs = program.getFragmentShader(gl, version);
                el.vsrow.innerHTML = "VS: " + (vs ? vs.getName() : "[none]");
                el.fsrow.innerHTML = "FS: " + (fs ? fs.getName() : "[none]");
            }
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
        var store = w.session.resourceStore;
        var programs = store.getPrograms();
        for (var n = 0; n < programs.length; n++) {
            var program = programs[n];
            this.listing.appendValue(program);
        }

        // Listen for changes
        store.resourceAdded.addListener(this, function (resource) {
            if (resource.type === "Program") {
                this.listing.appendValue(resource);
            }
        });
        store.resourceUpdated.addListener(this, function (resource) {
            if (resource.type === "Program") {
                this.listing.updateValue(resource);
                if (this.programView.currentProgram == resource) {
                    this.programView.setProgram(resource);
                }
            }
        });
        store.resourceDeleted.addListener(this, function (resource) {
            if (resource.type === "Program") {
                this.listing.updateValue(resource);
                if (this.programView.currentProgram == resource) {
                    this.programView.setProgram(resource);
                }
            }
        });
        store.resourceVersionAdded.addListener(this, function (resource, version) {
            if (resource.type === "Program") {
                this.listing.updateValue(resource);
                if (this.programView.currentProgram == resource) {
                    this.programView.setProgram(resource);
                }
            }
        });
        
        this.refresh = function () {
            this.programView.setProgram(this.programView.currentProgram);
        };
    };

    ui.ProgramsTab = ProgramsTab;
})();
