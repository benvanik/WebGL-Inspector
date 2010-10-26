gli = gli || {};

(function () {

    function inspectContext(context, options) {
        // Ignore if we have already wrapped the context
        if (context.isWrapped) {
            // NOTE: if options differ we may want to unwrap and re-wrap
            return context;
        }

        var wrapped = new gli.Context(context, options);

        gli.info.initialize(wrapped);

        return wrapped;
    };

    gli.inspectContext = inspectContext;
})();
