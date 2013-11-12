var _data;
var w = 1350,
    h = 675;

var editor = CodeMirror.fromTextArea(d3.select('#fn').node(), {
    mode: 'javascript',
    matchBrackets: true,
    tabSize: 2,
    autofocus: (window === window.top),
    extraKeys: {
        'Ctrl-S': saveAsGist,
        'Cmd-S': saveAsGist
    },
    smartIndent: true
});

var canvas = d3.select('#c')
    .attr('width', w)
    .attr('height', h),
    ctx = canvas.node().getContext('2d');

function saveAsGist() {
}

function loadSource(src, cb) {
    var tmpcan = document.createElement('canvas');
    tmpcan.width = w;
    tmpcan.height = h;
    var tmpctx = tmpcan.getContext('2d');
    var tmpimg = new Image();
    tmpimg.onload = function() {
        tmpctx.drawImage(this, 0, 0, w, h);
        _data = tmpctx.getImageData(0, 0, w, h);
        cb();
    };
    tmpimg.src = src;
}

loadSource('img/bm_large.jpg', function(data) {
});

function onmessage(e) {
    var projected = [];
    var i = 0, w = 1350;
    var lat = ((e.data.y / 675) * 180) - 90;
    for (var x = 0; x < w; x++) {
        var lon = ((x / w) * 360) - 180;
        var p = project(lon, lat);
        projected[i] = (Math.round((p[0] + 180) * (1350 / 360)) * 4) + (Math.round((p[1] + 90) * (675 / 180)) * w * 4);
        i++;
    }
    postMessage({
        projected: projected,
        y: e.data.y
    });
}

function evil(source) {
     return URL.createObjectURL(new Blob([('self.onmessage=' + onmessage.toString() + ';' + source)], {type:'text/javascript'}));
}

function render() {

    var workers = [];
    var newData = ctx.createImageData(w, h);
    var source = editor.getValue();
    var remain = 675;

    for (var i = 0; i < 18; i++) {
        workers[i] = new Worker(evil(source));
        workers[i].onmessage = projectedResult;
    }

    for (var y = 0; y < 675; y++) {
        workers[y % 18].postMessage({
            y: y
        });
    }


    function projectedResult(e) {
        var projected = e.data.projected,
            offset = e.data.y * w;
        for (var i = 0; i < projected.length; i++) {
            if (projected[i] < 0 || projected[i] > (w * h * 4)) continue;
            var j = (i + offset) * 4;
            newData.data[j + 0] = _data.data[projected[i] + 0];
            newData.data[j + 1] = _data.data[projected[i] + 1];
            newData.data[j + 2] = _data.data[projected[i] + 2];
            newData.data[j + 3] = _data.data[projected[i] + 3];
        }
        if (!--remain) {
            ctx.putImageData(newData, 0, 0);
            for (var i = 0; i < 18; i++) {
                workers[i].terminate();
            }
        }
    }

}

d3.select('#render').on('click', render);
