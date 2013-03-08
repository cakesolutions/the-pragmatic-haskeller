<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>The Pragmatic Bakery</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <link href="/css/bootstrap.min.css" rel="stylesheet">
    <link href="/css/bootstrap-responsive.min.css" rel="stylesheet">
    <link href="/css/font-awesome.min.css" rel="stylesheet">
    <link href="/css/bootswatch.css" rel="stylesheet">
    <link href="/css/codemirror/codemirror.css" rel="stylesheet">
    <link href="/css/codemirror/themes/ambiance.css" rel="stylesheet">

    <style type="text/css">
      .CodeMirror-activeline-background {background: #5d5b5b !important;}
    </style>
  </head>

  <body class="preview" id="top" data-spy="scroll" data-target=".subnav" data-offset="80">


 <div class="navbar navbar-fixed-top">
   <div class="navbar-inner">
     <div class="container">
       <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
         <span class="icon-bar"></span>
         <span class="icon-bar"></span>
         <span class="icon-bar"></span>
       </a>
       <a class="brand" href="http://cakesolutions.net">Cake Solutions</a>
       <div class="nav-collapse collapse" id="main-menu">
        <ul class="nav" id="main-menu-left">
          <li><a onclick="pageTracker._link(this.href); return false;" href="http://news.bootswatch.com">News</a></li>
          <li><a id="swatch-link" href="../#gallery">Gallery</a></li>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown" href="#">Preview <b class="caret"></b></a>
            <ul class="dropdown-menu" id="swatch-menu">
              <li><a href="../default">Default</a></li>
              <li class="divider"></li>
              <li><a href="../amelia">Amelia</a></li>
              <li><a href="../cerulean">Cerulean</a></li>
              <li><a href="../cosmo">Cosmo</a></li>
              <li><a href="../cyborg">Cyborg</a></li>
              <li><a href="../journal">Journal</a></li>
              <li><a href="../readable">Readable</a></li>
              <li><a href="../simplex">Simplex</a></li>
              <li><a href="../slate">Slate</a></li>
              <li><a href="../spacelab">Spacelab</a></li>
              <li><a href="../spruce">Spruce</a></li>
              <li><a href="../superhero">Superhero</a></li>
              <li><a href="../united">United</a></li>
            </ul>
          </li>
          <li class="dropdown" id="preview-menu">
            <a class="dropdown-toggle" data-toggle="dropdown" href="#">Download <b class="caret"></b></a>
            <ul class="dropdown-menu">
              <li><a target="_blank" href="bootstrap.min.css">bootstrap.min.css</a></li>
              <li><a target="_blank" href="bootstrap.css">bootstrap.css</a></li>
              <li class="divider"></li>
              <li><a target="_blank" href="variables.less">variables.less</a></li>
              <li><a target="_blank" href="bootswatch.less">bootswatch.less</a></li>
            </ul>
          </li>
        </ul>
       </div>
     </div>
   </div>
 </div>

    <div class="container">


<!-- Masthead
================================================== -->
<header class="jumbotron subhead" id="overview">
  <div class="row">

    <div class="span6">
      <h1>The Pragmatic Bakery</h1>
      <p class="lead">In case of zombie invasion.</p>
      <div class align="center"><img src="/img/cupcake.png"/></div>
    </div>

    <div class="control-group span6">
      <form method="post" action="/newRecipe">
          <label class="control-label" for="dsl">Submit your recipe</label>
          <div class="controls">
            <textarea class="input-xlarge span5" name="dsl" id="dsl">
"Ciambellone" is made with
    250 gr of "Flour"
    250 gr of "Sugar"
    130 ml of "Sunflower Oil"
    130 ml of "Water"
    3 "Eggs"

  prepared by
    "Mixing everything" and
    "Cooking in oven at 200 degrees" for 40 minutes</textarea><br/>
            <button type="submit" class="btn btn-primary">Save your recipe!</button>
          </div>
      </form>

    </div>

  </div>
</header>


<br><br><br><br>

    </div><!-- /container -->



    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="/js/bootstrap.min.js"></script>
    <script src="/js/bootswatch.js"></script>
    <script src="/js/codemirror/codemirror.js"></script>
    <script src="/js/codemirror/mode/recipe.js"></script>
    <script src="/js/codemirror/addon/active-line.js"></script>

    <script>
      var editor = CodeMirror.fromTextArea(document.getElementById("dsl"), {
        lineNumbers: true,
        styleActiveLine: true,
        theme: "ambiance",
        mode: "recipe"
      });
      editor.setSize(550,350);
    </script>

  </body>
</html>
