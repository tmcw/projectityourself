var canvas = document.getElementById('c2'),
    ctx = canvas.getContext('2d'),
    fcanvas = document.getElementById('c'),
    fctx = fcanvas.getContext('2d');

var loaded = false;
var w = ~~Math.min(window.innerHeight - 10, window.innerWidth - 500);
canvas.width = w;
canvas.height = w;
fcanvas.width = w;
fcanvas.height = 300;

var bm = new Image();
bm.onload = function() {
  loaded = true;
  fctx.drawImage(bm, 0, 0, 600, 300);
};
bm.src = 'img/bm.jpg';

var skip = 5;
var block = 7;

function draw(fx, fy) {
    if (!loaded) return;
    var pts = [];
    for (var x = -180; x <= 180; x += skip) {
      for (var y = -90; y <= 90; y += skip) {
            pts.push({coord: [x, y]});
        }
    }

    var imgData = fctx.getImageData(0, 0, fcanvas.width, fcanvas.height);
    var data = imgData.data;

    for (var i = 0; i < pts.length; i++) {
        var x = Math.floor((pts[i].coord[0] + 180) * (600/360));
        var y = Math.floor((pts[i].coord[1] + 90) * (300/180));
        var r = data[4 * ((y * w) + x) + 0],
            g = data[4 * ((y * w) + x) + 1],
            b = data[4 * ((y * w) + x) + 2];
        pts[i].color = 'rgb(' + [r, g, b].join(',') + ')';
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, w);

    var mappings = [];

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
    var scale_denom;
    if (xrange > yrange) {
        scale_denom = xrange / w;
    } else {
        scale_denom = yrange / w;
    }
    var xoffset = -minx;
    var yoffset = -miny;

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

document.getElementById('hifi').onclick = function() {
    skip = 1;
    block = 4;
    load_and_draw();
};

document.getElementById('lofi').onclick = function() {
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
}

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
}

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
}

function loadpreset() {
if (window.location.hash) {
  var id = parseInt(window.location.hash.substring(1));
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
        .replace(/\}/g, '');
    document.getElementById('fy').value =
      fy.toString()
        .replace('function fy(x, y) {', '')
        .replace(/\}/g, '');
    load_and_draw();
  };
  script.src = 'https://raw.github.com/gist/' + id;
}
}

loadpreset();

window.onhashchange = loadpreset;

