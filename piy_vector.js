var width = 960,
height = 500;

var path = d3.geo.path();

var graticule = d3.geo.graticule();

var svg = d3.select("#map").append("svg")
.attr("width", width)
.attr("height", height);

svg.append("path")
    .datum(graticule.outline)
    .attr("class", "background")
    .attr("d", path);

svg.selectAll(".graticule")
    .data(graticule.lines)
    .enter().append("path")
    .attr("class", "graticule")
    .attr("d", path);

svg.append("path")
    .datum(graticule.outline)
    .attr("class", "foreground")
    .attr("d", path);

function sniffBounds(projection) {
    var pts = [];

    d3.range(-180, 180, 10).map(function(lon) {
        d3.range(-90, 90, 10).map(function(lat) {
            pts.push(projection([lon, lat]));
        });
    });

    var extent = [
        d3.extent(pts, function(x) { return x[0]; }),
        d3.extent(pts, function(x) { return x[1]; })];

    var adjust = 1 / d3.max([
        (extent[0][1] - extent[0][0]) / 960,
        (extent[1][1] - extent[1][0]) / 500]);

    projection.scale(projection.scale() * adjust);
}

d3.json("world-110m.json", function(error, world) {
    svg.insert("path", ".graticule")
        .datum(topojson.object(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a.id !== b.id; }))
        .attr("class", "boundary")
        .attr("d", path);

    function setProjection() {
        try {
            var projection_body = editor.getValue();
            var a = function() { return (new Function('x', 'y', projection_body)); };
            projection = d3.geo.projectionMutator(a)();

            sniffBounds(projection);

            path.projection(projection);
            
            svg.selectAll(".background, .foreground").transition()
                .duration(750)
                .attr("d", path);
            d3.timer.flush();
svg.selectAll("path.land, path.boundary, path.graticule").transition()
                .duration(750)
                .attr("d", path);
            d3.timer.flush();
            window.location.hash = btoa(projection_body);
        } catch(e) {
            console.log(e);
        }
    }

    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        matchBrackets: true,
        extraKeys: {"Enter": "newlineAndIndentContinueComment"},
        onChange: setProjection
    });


    if (window.location.hash) {
        editor.setValue(atob(window.location.hash.slice(1)));
        setProjection();
    } else {
        setProjection();
    }

    editor.setSize(960, 100);
});
