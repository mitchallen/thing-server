
function pad(s) {
    return (s < 10 ? '0' : '') + s;
}

module.exports.uptime = () => {
    const t = process.uptime();

    var hours = Math.floor(t / (60 * 60));
    var minutes = Math.floor(t % (60 * 60) / 60);
    var seconds = Math.floor(t % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}