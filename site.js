var bm = document.getElementById('bm'),
    canvas = document.getElementById('c2'),
    ctx = canvas.getContext('2d'),
    fcanvas = document.getElementById('c'),
    fctx = fcanvas.getContext('2d');

var w = 600;
canvas.width = w;
canvas.height = 600;
fcanvas.width = w;
fcanvas.height = 300;
fctx.drawImage(bm, 0, 0, 600, 300);

var skip = 2;
var block = 3;

function draw(fx, fy) {
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
    ctx.fillRect(0, 0, 600, 600);

    var mappings = [];

    // Compute all of the points
    for (var i = 0; i < pts.length; i++) {
        mappings.push({
          color: pts[i].color,
          coord: [
            ~~fx(pts[i].coord[0], pts[i].coord[1]),
            ~~fy(pts[i].coord[0], pts[i].coord[1])
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

document.getElementById('doit').onclick = function() {
    eval('var fx = function(x, y) { ' + document.getElementById('fx').value + '}');
    eval('var fy = function(x, y) { ' + document.getElementById('fy').value + '}');
    draw(fx, fy);
}

document.getElementById('rig').onclick = function() {
    if (this.className == 'selected') return;
    this.className = 'selected';
    document.getElementById('netbook').className = '';
    skip = 1;
    block = 2;
};

document.getElementById('netbook').onclick = function() {
    if (this.className == 'selected') return;
    this.className = 'selected';
    document.getElementById('rig').className = '';
    skip = 5;
    block = 7;
};
