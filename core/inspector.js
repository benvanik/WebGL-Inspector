gli = (function () {

    function inspectContext(context, options) {
        // Ignore if we have already wrapped the context
        if (context.isWrapped) {
            // NOTE: if options differ we may want to unwrap and re-wrap
            return context;
        }

        return new gli.Context(context, options);
    };

    return {
        // Setup a given GL context for inspection (safe to call multiple times)
        'inspectContext': inspectContext
    };
})();
