var canvas = document.getElementById('c2'),
    ctx = canvas.getContext('2d');

var loaded = false;
var w = 640;

canvas.width = w;
canvas.height = w;

var fcanvas = document.createElement('canvas');
fcanvas.width = 600;
fcanvas.height = 300;
var fctx = fcanvas.getContext('2d');

var bm = new Image();
bm.onload = function() {
  loaded = true;
  fctx.drawImage(bm, 0, 0, 600, 300);
};
bm.src = 'img/bm.jpg';

var bcanvas = document.createElement('canvas');
bcanvas.width = 5400;
bcanvas.height = 2700;
var bctx = bcanvas.getContext('2d');

var bml = document.createElement('img');
bml.onload = function() {
  loaded = true;
  bctx.drawImage(bml, 0, 0, 5400, 2700);
};
bml.src = 'img/bm_large.jpg';

var skip = 5;
var block = 7;
var def = 1;

function sampleCanvas(xcanvas) {
    var pts = [],
        w = xcanvas.width,
        h = xcanvas.height;

    document.getElementById('status').innerHTML = 'building points...';
    for (var x = -180; x <= 180; x += skip) {
      for (var y = -90; y <= 90; y += skip) {
            pts.push({coord: [x, y]});
        }
    }

    var ct = xcanvas.getContext('2d');
    var imgData = ct.getImageData(0, 0, w, h);
    var data = imgData.data;

    document.getElementById('status').innerHTML = 'sampling...';
    for (var i = 0; i < pts.length; i++) {
        var x = Math.floor((pts[i].coord[0] + 180) * (w / 360));
        var y = Math.floor((pts[i].coord[1] + 90) * (h / 180));
        var r = data[4 * ((y * w) + x) + 0],
            g = data[4 * ((y * w) + x) + 1],
            b = data[4 * ((y * w) + x) + 2];
        pts[i].color = 'rgb(' + [r, g, b].join(',') + ')';
    }

    return pts;
}

function draw(fx, fy) {
    if (!loaded) return;

    var outputw = 640;

    if (def == 1) {
        var pts = sampleCanvas(fcanvas);
    }
    if (def == 2) {
        outputw = 2700;
        var pts = sampleCanvas(bcanvas);
    }

    var mappings = [];

    document.getElementById('status').innerHTML = 'computing points...';
    // Compute all of the points
    for (var i = 0; i < pts.length; i++) {
        mappings.push({
          color: pts[i].color,
          coord: [
            fx(pts[i].coord[0], pts[i].coord[1]),
            fy(pts[i].coord[0], pts[i].coord[1])
          ]
        });
    }
    var minx, miny, maxx, maxy;
    // Fit the points into a 600x600 space
    for (var i = 0; i < mappings.length; i++) {
        if (minx == undefined || mappings[i].coord[0] < minx) {
          minx = mappings[i].coord[0];
        }
        if (miny == undefined || mappings[i].coord[1] < miny) {
          miny = mappings[i].coord[1];
        }
        if (maxx == undefined || mappings[i].coord[0] > maxx) {
          maxx = mappings[i].coord[0];
        }
        if (maxy == undefined || mappings[i].coord[1] > maxy) {
          maxy = mappings[i].coord[1];
        }
    }
    var xrange = maxx - minx;
    var yrange = maxy - miny;
    canvas.width = outputw;
    canvas.height = (yrange / xrange) * outputw;
    var scale_denom;
    if (xrange > yrange) {
        scale_denom = xrange / outputw;
    } else {
        scale_denom = yrange / outputw;
    }
    var xoffset = -minx;
    var yoffset = -miny;

    document.getElementById('status').innerHTML = 'drawing points...';
    // Finally draw the points
    for (var i = 0; i < mappings.length; i++) {
        ctx.fillStyle = mappings[i].color;
        ctx.fillRect(
          ~~((xoffset + mappings[i].coord[0]) / scale_denom),
          ~~((yoffset + mappings[i].coord[1]) / scale_denom),
          block, block);
    }
}

function load_and_draw() {
    eval('var fx = function(x, y) { ' + document.getElementById('fx').value + '}');
    eval('var fy = function(x, y) { ' + document.getElementById('fy').value + '}');
    draw(fx, fy);
}

document.getElementById('hidef').onclick = function() {
    def = 2;
    skip = 0.2;
    block = 3;
    load_and_draw();
};

document.getElementById('hifi').onclick = function() {
    def = 1;
    skip = 1;
    block = 4;
    load_and_draw();
};

document.getElementById('lofi').onclick = function() {
    def = 1;
    skip = 5;
    block = 7;
    load_and_draw();
};

document.getElementById('download').onclick = function() {
  window.location.href = c2.toDataURL("image/png").replace("image/png", "image/octet-stream");
};

document.getElementById('share-button').onclick = function() {
    document.getElementById('share').style.display = 'block';
    document.getElementById('gist-share').value =
      'function fx(x, y) {\n' +
      document.getElementById('fx').value + '}' +
      '\nfunction fy(x, y) {\n' +
      document.getElementById('fy').value + '}';
};

var ldt;

document.getElementById('fx').onkeyup = function() {
    try {
        if (ldt) window.clearTimeout(ldt);
        eval('var fx = function(x, y) { ' + document.getElementById('fx').value + '}');
        fx(10, 10);
        document.getElementById('fx-error').innerHTML = '';
        ldt = window.setTimeout(load_and_draw, 400);
    } catch (e) {
        document.getElementById('fx-error').innerHTML = e;
    }
};

document.getElementById('fy').onkeyup = function() {
    try {
        if (ldt) window.clearTimeout(ldt);
        eval('var fy = function(x, y) { ' + document.getElementById('fy').value + '}');
        fy(10, 10);
        document.getElementById('fy-error').innerHTML = '';
        ldt = window.setTimeout(load_and_draw, 400);
    } catch (e) {
        document.getElementById('fy-error').innerHTML = e;
    }
};

function loadpreset() {
if (window.location.hash) {
    var id = parseInt(window.location.hash.substring(1), 10);
    if (isNaN(id)) return alert('you gave a location hash but it wasn\'t an id!');
    var head =  document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    head.appendChild(script);
    document.getElementById('fx').value =
    document.getElementById('fy').value = '... loading preset ...';
    script.onload = function() {
      document.getElementById('fx').value =
        fx.toString()
          .replace('function fx(x, y) {', '')
          .replace(/\}/, '');
      document.getElementById('fy').value =
        fy.toString()
          .replace('function fy(x, y) {', '')
          .replace(/\}/, '');
      load_and_draw();
    };
    script.src = 'https://raw.github.com/gist/' + id;
}
}

loadpreset();

window.onhashchange = loadpreset;

