var d3_radians = Math.PI / 180;
// TODO clip input coordinates on opposite hemisphere
var azimuthal = function() {
  var mode = "orthographic", // or stereographic
      origin,
      scale = 200,
      translate = [480, 250],
      x0,
      y0,
      cy0,
      sy0;

  function azimuthal(coordinates) {
    var x1 = coordinates[0] * d3_radians - x0,
        y1 = coordinates[1] * d3_radians,
        cx1 = Math.cos(x1),
        sx1 = Math.sin(x1),
        cy1 = Math.cos(y1),
        sy1 = Math.sin(y1),
        k = mode === "stereographic" ? 1 / (1 + sy0 * sy1 + cy0 * cy1 * cx1) : 1,
        x = k * cy1 * sx1,
        y = k * (sy0 * cy1 * cx1 - cy0 * sy1);
    return [
      scale * x + translate[0],
      scale * y + translate[1]
    ];
  }

  azimuthal.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale,
        p = Math.sqrt(x * x + y * y),
        c = mode === "stereographic" ? 2 * Math.atan(p) : Math.asin(p),
        sc = Math.sin(c),
        cc = Math.cos(c);
    return [
      (x0 + Math.atan2(x * sc, p * cy0 * cc + y * sy0 * sc)) / d3_radians,
      Math.asin(cc * sy0 - (y * sc * cy0) / p) / d3_radians
    ];
  };

  azimuthal.mode = function(x) {
    if (!arguments.length) return mode;
    mode = x + "";
    return azimuthal;
  };

  azimuthal.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    x0 = origin[0] * d3_radians;
    y0 = origin[1] * d3_radians;
    cy0 = Math.cos(y0);
    sy0 = Math.sin(y0);
    return azimuthal;
  };

  azimuthal.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return azimuthal;
  };

  azimuthal.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return azimuthal;
  };

  return azimuthal.origin([0, 0]);
};

var mercator = function() {
  var scale = 500,
      translate = [480, 250];

  function mercator(coordinates) {
    var x = coordinates[0] / 360,
        y = -(Math.log(Math.tan(Math.PI / 4 + coordinates[1] * d3_radians / 2)) / d3_radians) / 360;
    return [
      scale * x + translate[0],
      scale * Math.max(-.5, Math.min(.5, y)) + translate[1]
    ];
  }

  mercator.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale;
    return [
      360 * x,
      2 * Math.atan(Math.exp(-360 * y * d3_radians)) / d3_radians - 90
    ];
  };

  mercator.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return mercator;
  };

  mercator.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return mercator;
  };

  return mercator;
};


if (module) {
    var Canvas = require('canvas'),
        fs = require('fs'),
        Image = Canvas.Image;
    var canvas = new Canvas(600, 600),
        ctx = canvas.getContext('2d');

    var fcanvas = new Canvas(600, 300),
        fctx = canvas.getContext('2d');

    bm = new Image();
    bm.src = fs.readFileSync(__dirname + '/bm.jpeg');
} else {
    var bm = document.getElementById('bm'),
        canvas = document.getElementById('c2'),
        ctx = canvas.getContext('2d'),
        fcanvas = document.getElementById('c'),
        fctx = fcanvas.getContext('2d');

    canvas.width = 600;
    canvas.height = 600;

    fcanvas.width = 600;
    fcanvas.height = 300;

    var to = window.setInterval(draw, 0);
}

fctx.drawImage(bm, 0, 0, 600, 300);

var merc = mercator()
    .scale(400)
    .translate([300, 300]);

var ortho = azimuthal()
      .scale(230)
      .origin([0, 40])
      .mode("orthographic")
      .translate([300, 300]);

var pts = [];
var colors = [];

for (var x = -180; x <= 180; x += 1) {
    for (var y = -90; y <= 90; y += 1) {
        pts.push({coord: [x, y]});
    }
}

var imgData = fctx.getImageData(0, 0, fcanvas.width, fcanvas.height);
var data = imgData.data;

var w = 600;
for (var i = 0; i < pts.length; i++) {
    var x = Math.floor((pts[i].coord[0] + 180) * (600/360));
    var y = Math.floor((-pts[i].coord[1] + 90) * (300/180));
    var r = data[4 * ((y * w) + x) + 0],
        g = data[4 * ((y * w) + x) + 1],
        b = data[4 * ((y * w) + x) + 2];
    pts[i].color = 'rgb(' + [r, g, b].join(',') + ')';
}

var startTime = +new Date();

var n = 0;

function draw(t) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 600, 600);


    for (var i = 0; i < pts.length; i++) {
        var mc = merc(pts[i].coord);
        var oc = ortho(pts[i].coord);
        var px = [
            mc[0] * (1 - t) +
            oc[0] * (t),
            mc[1] * (1 - t) +
            oc[1] * (t)
        ];
        ctx.fillStyle = pts[i].color;
        ctx.fillRect(px[0], px[1], 2, 2);
    }

    if (module) {
        var name = (('' + n).length == 1) ? '0' + n + '.png' : n + '.png';
        fs.writeFileSync(n + '.png', canvas.toBuffer());
        n++;
    }
}

if (module) {
    for (var t = 0; t <= 1; t += 0.1) {
        draw(t);
    }
    for (var t = 1; t >= 0; t -= 0.1) {
        draw(t);
    }
} else {
    var t = 0.5 * (Math.sin((+new Date() - startTime) / 2000) + 1);
}
