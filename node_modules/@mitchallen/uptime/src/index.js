/**
 * Module
 * @module uptime
 */

 /** 
 * Factory method 
 * @returns {string} that returns uptime as a string in the form of HH:MM:SS
 * @example <caption>Usage example</caption>
    var uptime = require("@mitchallen/uptime");
 
    console.log(uptime.toHHMMSS())
 */

module.exports.toHHMMSS = () => {

    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }

    const t = process.uptime();

    var hours = Math.floor(t / (60 * 60));
    var minutes = Math.floor(t % (60 * 60) / 60);
    var seconds = Math.floor(t % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}