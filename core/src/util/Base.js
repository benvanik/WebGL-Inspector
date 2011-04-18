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

function glisubclass(parent, child, mix) {
    function ctor() {};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    child.prototype.super = parent;
    if (mix) {
        for (var name in mix) {
            child.prototype[name] = mix[name];
        }
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
    
    if (!value) {
        return null;
    }
    
    var mangled = value.constructor.toString();
    if (!mangled) {
        return null;
    }
    
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
    
    return null;
};
