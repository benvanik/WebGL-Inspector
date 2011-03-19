// Hack to always define a console
if (!window["console"]) {
    window.console = { log: function () { } };
}

function glinamespace(name) {
    var parts = name.split(".");
    var current = window;
    for (var n = 0; n < parts.length; n++) {
        var part = parts[n];
        current[part] = current[part] || {};
        current = current[part];
    }
    return current;
};

function glisubclass(parent, child, args) {
    parent.apply(child, args);

    // TODO: this sucks - do it right

    for (var propertyName in parent.prototype) {
        if (propertyName == "constructor") {
            continue;
        }
        if (!child.__proto__[propertyName]) {
            child.__proto__[propertyName] = parent.prototype[propertyName];
        }
    }

    for (var propertyName in parent) {
        child[propertyName] = parent[propertyName];
    }
};

function glitypename(value) {
    function stripConstructor(value) {
        if (value) {
            return value.replace("Constructor", "");
        } else {
            return value;
        }
    };
    if (value) {
        var mangled = value.constructor.toString();
        if (mangled) {
            var matches = mangled.match(/function (.+)\(/);
            if (matches) {
                // ...function Foo()...
                if (matches[1] == "Object") {
                    // Hrm that's likely not right...
                    // constructor may be fubar
                    mangled = value.toString();
                } else {
                    return stripConstructor(matches[1]);
                }
            }
            
            // [object Foo]
            matches = mangled.match(/\[object (.+)\]/);
            if (matches) {
                return stripConstructor(matches[1]);
            }
        }
    }
    return null;
};
