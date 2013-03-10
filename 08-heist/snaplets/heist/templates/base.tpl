<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>The Pragmatic Bakery</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="/static/js/bootstrap.min.js"></script>
    <script src="/static/js/bootswatch.js"></script>
    <script src="/static/js/codemirror/codemirror.js"></script>
    <script src="/static/js/codemirror/mode/recipe.js"></script>
    <script src="/static/js/codemirror/addon/active-line.js"></script>
    <link href="/static/css/bootstrap.min.css" rel="stylesheet">
    <link href="/static/css/bootstrap-responsive.min.css" rel="stylesheet">
    <link href="/static/css/font-awesome.min.css" rel="stylesheet">
    <link href="/static/css/bootswatch.css" rel="stylesheet">
    <link href="/static/css/codemirror/codemirror.css" rel="stylesheet">
    <link href="/static/css/codemirror/themes/ambiance.css" rel="stylesheet">

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
              <li><a href="https://github.com/cakesolutions/the-pragmatic-haskeller">Source Code</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>


    <div class="container">
      <header class="jumbotron subhead" id="overview">
      <div class="row">

        <div class="span6">
          <a href="/"><h1>The Pragmatic Bakery</h1></a>
          <p class="lead">In case of zombie invasion.</p>
          <div class align="center"><img src="/static/img/cupcake.png"/></div>
        </div>

        <apply-content/>

      </div>
      </header>


      <br><br><br><br>

    </div><!-- /container -->


  </body>
</html>
