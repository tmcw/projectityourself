;self.onmessage = function(e) {
    var projected = [];
    var i = 0;
    for (var x = 0; x < 1350; x++) {
        var p = project(x, e.y);
        projected[i] = (Math.round(p[0]) * 4) + (Math.round(p[1]) * w * 4);
        i++;
    }
    postMessage({
        projected: projected,
        y: e.y
    }, [projected]);
};
