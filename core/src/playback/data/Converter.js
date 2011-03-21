(function () {
    var data = glinamespace("gli.playback.data");

    var Converter = function Converter() {
    };

    Converter.typeFromJson = function typeFromJson(session, arg) {
        if (!arg) {
            return arg;
        }

        var darg = arg;

        if (arg.gliType) {
            // Self resource of some kind
            var resource = session.resourceStore.getResourceById(arg.id);
            switch (arg.gliType) {
                case "UniformLocation":
                    darg = {
                        uniformReference: true,
                        program: resource,
                        name: arg.name
                    };
                    break;
                case "Buffer":
                case "Framebuffer":
                case "Program":
                case "Renderbuffer":
                case "Shader":
                case "Texture":
                    darg = resource;
                    break;
                default:
                    console.log("unknown gliType on arg decode: " + arg.gliType);
                    break;
            }
        } else if (arg.arrayType) {
            // TypedArray
            switch (arg.arrayType) {
                case "Int8Array":
                    darg = new Int8Array(arg.data);
                    break;
                case "Uint8Array":
                    darg = new Uint8Array(arg.data);
                    break;
                case "Int16Array":
                    darg = new Int16Array(arg.data);
                    break;
                case "Uint16Array":
                    darg = new Uint16Array(arg.data);
                    break;
                case "Int32Array":
                    darg = new Int32Array(arg.data);
                    break;
                case "Uint32Array":
                    darg = new Uint32Array(arg.data);
                    break;
                case "Float32Array":
                    darg = new Float32Array(arg.data);
                    break;
                case "Float64Array":
                    darg = new Float64Array(arg.data);
                    break;
                default:
                    console.log("unknown arrayType on arg decode: " + arg.arrayType);
                    break;
            }
        } else if (arg.domType) {
            // DOM resource of some kind - deferred until preloadAssets for perf reasons
        }

        return darg;
    };
    
    function deserializeImageData(document, asset) {
        // width, height, data
        
        // Dummy canvas to create the image data
        var canvas = document.createElement("canvas");
        
        // Copy all data over to new ImageData
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(asset.width, asset.height);
        var sourceData = asset.data;
        var targetData = imageData.data;
        for (var n = 0; n < sourceData.length; n++) {
            targetData[n] = sourceData[n];
        }
        
        asset.value = imageData;
        return gli.util.Promise.signalledPromise;
    };
    
    function deserializeCanvas(document, asset) {
        // width, height, data
        
        // New canvas, added to a fragment
        var canvas = document.createElement("canvas");
        canvas.width = asset.width;
        canvas.height = asset.height;
        var frag = document.createDocumentFragment();
        frag.appendChild(canvas);
        
        // Copy all data over to new ImageData
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(asset.width, asset.height);
        var sourceData = asset.data;
        var targetData = imageData.data;
        for (var n = 0; n < sourceData.length; n++) {
            targetData[n] = sourceData[n];
        }
        ctx.putImageData(imageData, 0, 0);
        
        asset.value = canvas;
        return gli.util.Promise.signalledPromise;
    };
    
    function deserializeImage(document, asset) {
        // width, height, src
        var promise = new gli.util.Promise();
        
        // New image, added to a fragment
        var image = document.createElement("img");
        image.width = asset.width;
        image.height = asset.height;
        var frag = document.createDocumentFragment();
        frag.appendChild(image);
        
        // Setup handlers for resource ready callback
        var imageAssetLoaded = function imageAssetLoaded() {
            promise.signal(true);
            image.removeEventListener("load", imageAssetLoaded, false);
        };
        var imageAssetErrored = function imageAssetErrored() {
            promise.signal(false);
            image.removeEventListener("error", imageAssetErrored, false);
        };
        image.addEventListener("load", imageAssetLoaded, false);
        image.addEventListener("error", imageAssetErrored, false);
        
        // Set source and begin load
        image.src = asset.src;
        
        asset.value = image;
        return promise;
    };
    
    function deserializeVideo(document, asset) {
        // width, height, src
        var promise = new gli.util.Promise();
        
        // TODO: maybe capture the frame and use that here as a proxy?
        
        // New video, added to a fragment
        var video = document.createElement("video");
        video.width = asset.width;
        video.height = asset.height;
        video.preload = "auto";
        video.autoplay = false;
        video.muted = true;
        video.volume = 0.0;
        video.controls = false;
        var frag = document.createDocumentFragment();
        frag.appendChild(video);
        
        // Setup handlers for resource ready callback
        var videoAssetLoaded = function videoAssetLoaded() {
            promise.signal(true);
            video.removeEventListener("loadeddata", videoAssetLoaded, false);
        };
        var videoAssetErrored = function videoAssetErrored() {
            promise.signal(false);
            video.removeEventListener("error", videoAssetErrored, false);
        };
        video.addEventListener("loadeddata", videoAssetLoaded, false);
        video.addEventListener("error", videoAssetErrored, false);
        
        // Set source and begin load
        video.src = asset.src;
        video.load();
        
        asset.value = video;
        return promise;
    };
    
    Converter.setupDOMAsset = function setupDOMAsset(document, asset) {
        var promise;
        switch (asset.domType) {
            case "ImageData":
                promise = deserializeImageData(document, asset);
                break;
            case "HTMLCanvasElement":
                promise = deserializeCanvas(document, asset);
                break;
            case "HTMLImageElement":
                promise = deserializeImage(document, asset);
                break;
            case "HTMLVideoElement":
                promise = deserializeVideo(document, asset);
                break;
            default:
                console.log("unknown domType on asset decode: " + asset.domType);
                promise = gli.util.Promise.signalledPromise;
                break;
        }
        
        return promise;
    };

    data.Converter = Converter;

})();
