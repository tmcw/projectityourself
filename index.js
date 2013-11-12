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
    .attr('width', 1350)
    .attr('height', 675),
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

var workers = [];
for (var i = 0; i < 18; i++) {
    workers[i] = new Worker('projection_worker.js');
    workers[i].onmessage = projectedResult(i);
}

function projectedResult(i) {
    return function(data) {
    };
}

function render() {
    var source = editor.getValue(),
        projected = [],
        i = 0;
    eval(source);
    for (var y = 0; y < 675; y++) {
        for (var x = 0; x < 1350; x++) {
            var p = project(x, y);
            projected[i] = (Math.round(p[0]) * 4) + (Math.round(p[1]) * w * 4);
            i++;
        }
    }
    var newData = ctx.createImageData(w, h);
    for (i = 0; i < projected.length; i++) {
        var j = i * 4;
        if (projected[i] < 0 || projected[i] > (w * h * 4)) continue;
        newData.data[j + 0] = _data.data[projected[i] + 0];
        newData.data[j + 1] = _data.data[projected[i] + 1];
        newData.data[j + 2] = _data.data[projected[i] + 2];
        newData.data[j + 3] = _data.data[projected[i] + 3];
    }
    ctx.putImageData(newData, 0, 0);
}

d3.select('#render').on('click', render);
