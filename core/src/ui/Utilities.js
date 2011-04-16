(function () {
    var ui = glinamespace("gli.ui");

    ui.setStyle = function setStyle(el, style) {
        for (var name in style) {
            el.style[name] = style[name];
        }
    };

    ui.addClass = function addClass(el, className) {
        if (el.className.length) {
            el.className += " " + className;
        } else {
            el.className = className;
        }
    };
    ui.removeClass = function removeClass(el, className) {
        var classes = el.className.split(" ");
        var index = classes.indexOf(className);
        if (index === -1) {
            return;
        }
        classes.splice(index, 1);
        el.className = classes.join(" ");
    };
    ui.changeClass = function changeClass(el, oldClassName, newClassName) {
        var classes = el.className.split(" ");
        var index = classes.indexOf(oldClassName);
        if (index === -1) {
            return;
        }
        classes[index] = newClassName;
        el.className = classes.join(" ");
    };
    ui.hasClass = function hasClass(el, className) {
        return el.className.indexOf(className) != -1;
    };

    ui.padInt = function padInt(v) {
        var s = String(v);
        if (s >= 0) {
            s = " " + s;
        }
        s = s.substr(0, 11);
        while (s.length < 11) {
            s = " " + s;
        }
        return s.replace(/ /g, "&nbsp;");
    };
    ui.padFloat = function padFloat(v) {
        var s = String(v);
        if (s >= 0.0) {
            s = " " + s;
        }
        if (s.indexOf(".") == -1) {
            s += ".";
        }
        s = s.substr(0, 12);
        while (s.length < 12) {
            s += "0";
        }
        return s.replace(/ /g, "&nbsp;");
    };

})();
