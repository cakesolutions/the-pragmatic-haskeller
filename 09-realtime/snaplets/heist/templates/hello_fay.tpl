<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
  <head>
    <title></title>
<style>
 
svg {
  font: 10px sans-serif;
}
 
.line {
  fill: none;
  stroke: #000;
  stroke-width: 1.5px;
}
 
.axis path, .axis line {
  fill: none;
  stroke: #000;
  shape-rendering: crispEdges;
}
 
</style>
<script src="http://d3js.org/d3.v2.min.js?2.8.1"></script>
<script src="/static/js/jquery.js"></script>
<script src="/fay/FayExample.js"></script>
<script>

var n = 40,
    random = d3.random.normal(0, .2);

function chart(domain, interpolation, tick) {
  var data = d3.range(n).map(random);

  var margin = {top: 6, right: 0, bottom: 6, left: 40},
      width = 960 - margin.right,
      height = 120 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain(domain)
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([-1, 1])
      .range([height, 0]);

  var line = d3.svg.line()
      .interpolate(interpolation)
      .x(function(d, i) { return x(i); })
      .y(function(d, i) { return y(d); });

  var svg = d3.select("body").append("p").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("margin-left", -margin.left + "px")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  svg.append("g")
      .attr("class", "y axis")
      .call(d3.svg.axis().scale(y).ticks(5).orient("left"));

  var path = svg.append("g")
      .attr("clip-path", "url(#clip)")
    .append("path")
      .data([data])
      .attr("class", "line")
      .attr("d", line);

  tick(path, line, data, x);
}

</script>
<body>
  <h1>Chart</h1>
  <p>Real time graph with D3.js</p>
<script>

chart([0, n - 1], "linear", function tick(path, line, data, x) {

  // push a new data point onto the back

  $.ajax({type: "GET",
         contentType : "text/plain",
         url: "/data/get",
         success: function(json){
           var res = $.parseJSON(json);
           var newY = res.data;
           data.push(res.data);
         }
      });

  // redraw the line, and then slide it to the left
  path
      .attr("d", line)
      .attr("transform", null)
    .transition()
      .duration(500)
      .ease("linear")
      .attr("transform", "translate(" + x(-1) + ")")
      .style("stroke", "green")
      .each("end", function() { tick(path, line, data, x); });

  // pop the old data point off the front
  data.shift();

});

</script>
</body>
