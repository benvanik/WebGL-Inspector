(function () {
    var resources = glinamespace("gli.playback.resources");

    var Resource = function Resource(session, source) {
        this.id = source.id;
        this.type = source.type;
        this.update(source);
        
        this.versions = [];
    };

    Resource.prototype.update = function update(source) {
        this.alive = source.alive;
        this.creationStack = source.creationStack;
        this.deletionStack = source.deletionStack;
        this.displayName = source.displayName;
    };

    Resource.prototype.getName = function getName() {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.type + " " + this.id;
        }
    };

    Resource.prototype.setName = function setName(name, ifNeeded) {
        if (ifNeeded && this.displayName) {
            return;
        }
        this.displayName = name;
    };
    
    Resource.prototype.addVersion = function addVersion(version) {
        this.versions.push(version);
    };
    
    Resource.prototype.getVersion = function getVersion(versionNumber) {
        for (var n = 0; n < this.versions.length; n++) {
            var version = this.versions[n];
            if (version.versionNumber === versionNumber) {
                return version;
            }
        }
        return version;
    };
    
    Resource.prototype.createTarget = function createTarget(pool, version, valueHost) {
        var gl = pool.gl;
        var options = pool.options;
        var mutationTable = pool.mutationTable;
        var resourceBindings = mutationTable.resources[this.type];
        
        if (resourceBindings) {
            for (var n = 0; n < resourceBindings.pre.length; n++) {
                var binding = resourceBindings.pre[n];
                version = binding.handler.call(binding.mutator, gl, pool, version);
            }
        }

        var result = this.createTargetValue(gl, options, version);
        valueHost.value = result;
        
        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            gli.playback.data.Call.issueCall(pool, call);
        }

        if (resourceBindings) {
            for (var n = 0; n < resourceBindings.post.length; n++) {
                var binding = resourceBindings.post[n];
                binding.handler.call(binding.mutator, gl, pool, version, result);
            }
        }
    };

    Resource.prototype.deleteTarget = function deleteTarget(pool, value) {
        var gl = pool.gl;
        this.deleteTargetValue(gl, value);
    };

    Resource.buildDirtier = function buildDirtier(pool, name, getActiveTarget) {
        var original = pool.gl[name];
        pool.gl[name] = function dirtier() {
            var gl = this;
            
            var value;
            if (getActiveTarget) {
                value = getActiveTarget(gl, arguments);
            } else {
                value = arguments[0];
            }
            if (value && value.target) {
                value.target.markDirty(gl);
            }

            // Call original
            return original.apply(gl, arguments);
        };
    };

    Resource.buildDirtiers = function buildDirtiers(pool, names, getActiveTarget) {
        for (var n = 0; n < names.length; n++) {
            Resource.buildDirtier(pool, names[n], getActiveTarget);
        }
    };

    resources.Resource = Resource;

})();
