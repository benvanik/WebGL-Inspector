(function () {
    var controls = glinamespace("gli.ui.controls");

    var SplitPanel = function SplitPanel(name, parentElement, paneA, paneB, orientation) {
        var self = this;
        var doc = parentElement.ownerDocument;

        this.name = name;
        this.paneA = paneA;
        this.paneB = paneB;
        this.orientation = null;

        var minValue = 100;
        var maxValue = 9999;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-splitpanel");

        var splitterOrientation;
        switch (orientation) {
            case "horizontal":
                splitterOrientation = "vertical";
                break;
            case "vertical":
                splitterOrientation = "horizontal";
                break;
        }
        var splitter = this.splitter = new gli.ui.controls.Splitter(el, splitterOrientation, minValue, maxValue, null, function (value) {
            if (self.orientation == "horizontal") {
                splitter.el.style.left = value + "px";
                paneA.el.style.width = (value) + "px";
                paneB.el.style.left = (value + 5) + "px";
            } else {
                splitter.el.style.top = value + "px";
                paneA.el.style.height = (value) + "px";
                paneB.el.style.top = (value + 5) + "px";
            }

            gli.ui.settings.session.splitPanels[name] = value;
            gli.ui.settings.save();

            if (paneA.layout) {
                paneA.layout();
            }
            if (paneB.layout) {
                paneB.layout();
            }
        });

        gli.ui.addClass(paneA.el, "gli-splitpanel-pane-" + orientation);
        gli.ui.addClass(paneA.el, "gli-splitpanel-a-" + orientation);
        gli.ui.addClass(paneB.el, "gli-splitpanel-pane-" + orientation);
        gli.ui.addClass(paneB.el, "gli-splitpanel-b-" + orientation);

        el.appendChild(paneA.el);
        el.appendChild(splitter.el);
        el.appendChild(paneB.el);

        this.setOrientation(orientation);

        var value = gli.ui.settings.session.splitPanels[name];
        if (value) {
            splitter.setValue(value);
        } else {
            splitter.setValue(minValue);
        }
    };

    SplitPanel.prototype.setOrientation = function setOrientation(orientation) {
        if (orientation == this.orientation) {
            return;
        }

        this.orientation = orientation;
        switch (orientation) {
            case "horizontal":
                this.splitter.setOrientation("vertical");
                break;
            case "vertical":
                this.splitter.setOrientation("horizontal");
                break;
        }
    };

    controls.SplitPanel = SplitPanel;

})();
