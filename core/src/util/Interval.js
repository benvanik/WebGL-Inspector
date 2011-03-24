(function () {
    var util = glinamespace("gli.util");
    
    // This is modeled off of chrome.Interval
    // If that is present it is used, otherwise we implement an approximantion
    // using Date
    
    var Interval;
    if (window.chrome && window.chrome.Interval) {
        // Use Chrome version and add helpers
        Interval = window.chrome.Interval;
        
        Interval.prototype.milliseconds = function milliseconds() {
            return this.microseconds() / 1000.0;
        };
        
        Interval.prototype.seconds = function seconds() {
            return this.microseconds() / 1000000.0;
        };
        
    } else {
        // Custom - a best guess
        Interval = function Interval() {
            this.startTime_ = 0;
            this.stopTime_ = 0;
        };
        
        Interval.prototype.start = function start() {
            this.stopTime_ = 0;
            this.startTime_ = Date.now();
        };
        
        Interval.prototype.stop = function stop() {
            this.stopTime_ = Date.now();
            if (this.startTime_ === 0) {
                this.stopTime_ = 0;
            }
        };
        
        Interval.prototype.microseconds = function microseconds() {
            var end = this.stopTime_ || Date.now();
            if (this.startTime_ === 0) {
                return 0;
            }
            return (end - this.startTime_) * 1000.0;
        };
        
        Interval.prototype.milliseconds = function milliseconds() {
            return this.microseconds() / 1000.0;
        };
        
        Interval.prototype.seconds = function seconds() {
            return this.microseconds() / 1000000.0;
        };
    }
    
    util.Interval = Interval;
    
})();
