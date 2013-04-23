<!DOCTYPE HTML>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css">
	<link type="text/css" rel="stylesheet" href="/static/css/graph.css">
	<link type="text/css" rel="stylesheet" href="/static/css/detail.css">
	<link type="text/css" rel="stylesheet" href="/static/css/legend.css">
	<link type="text/css" rel="stylesheet" href="/static/css/extensions.css">

	<script src="/static/js/d3/d3.v2.js"></script>

	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.15/jquery-ui.min.js"></script>

	<script src="/static/js/rickshaw/Rickshaw.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Class.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Renderer.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Renderer.Line.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.HoverDetail.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Annotate.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Axis.Time.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Behavior.Series.Highlight.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Unstacker.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Fixtures.Time.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Fixtures.Number.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Fixtures.Color.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Color.Palette.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Graph.Axis.Y.js"></script>
	<script src="/static/js/rickshaw/Rickshaw.Series.js"></script>
  <script src="/static/js/rickshaw/Rickshaw.Series.FixedDuration.js"></script>
</head>
<body>

<div id="content" align="center">

	<div id="chart_container">
		<div id="chart"></div>
		<div id="timeline"></div>
		<div id="slider"></div>
	</div>

</div>

<script>

var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

var updateRate = 500;

var graph = new Rickshaw.Graph( {
	element: document.getElementById("chart"),
	width: 900,
	height: 500,
	renderer: 'line',
  series: new Rickshaw.Series.FixedDuration([{ name: 'one' }], undefined, {
		timeInterval: updateRate,
		maxDataPoints: 100,
		timeBase: new Date().getTime() / 1000
	}) 
} );

graph.render();

var hoverDetail = new Rickshaw.Graph.HoverDetail( {
	graph: graph
} );

var annotator = new Rickshaw.Graph.Annotate( {
	graph: graph,
	element: document.getElementById('timeline')
} );


var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
	graph: graph,
} );


var ticksTreatment = 'glow';

var xAxis = new Rickshaw.Graph.Axis.Time( {
	graph: graph,
	ticksTreatment: ticksTreatment
} );

xAxis.render();

var yAxis = new Rickshaw.Graph.Axis.Y( {
	graph: graph,
	tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
	ticksTreatment: ticksTreatment
} );

yAxis.render();


setInterval( function() {

  
  $.ajax({type: "GET",
         contentType : "text/plain",
         url: "/data/get",
         success: function(json){
           var res = $.parseJSON(json);
           var newY = res.data;
           var data = { one: newY };
           graph.series.addData(data);
           graph.render();
         }
      });

}, updateRate );

</script>
</body>
</html>
