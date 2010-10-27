var gli = {};

(function () {
    
    var hasInitializedUI = false;

    function inspectContext(canvas, context, options) {
        // Ignore if we have already wrapped the context
        if (context.isWrapped) {
            // NOTE: if options differ we may want to unwrap and re-wrap
            return context;
        }

        // May be redundant, but that's ok
        gli.info.initialize(context);
        
        var wrapped = new gli.Context(canvas, context, options);

        // Only once!
        if(!hasInitializedUI) {
            hasInitializedUI = true;
            gli.ui.inject();
            gli.ui.initialize(wrapped, document.getElementById("gli-window"), document.getElementById("gli-statehud"), document.getElementById("gli-outputhud"));
        }

        return wrapped;
    };

    gli.inspectContext = inspectContext;
})();
