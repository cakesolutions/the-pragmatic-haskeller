## The Pragmatic Haskeller

A collection of "recipies" (no pun intended) to pragmatically
get things done in Haskell. We'll build a simple web application for managing
recipies. In particular, we'll focus on:

* How to parse Json files describing recipies

* How to automatically convert between Json and Bson for storing recipies inside MongoDB

* Interfacing with an external [API](http://www.recipepuppy.com/)

* A DSL for describing recipies

## Installation

``` shell
cabal install
```

inside each subfolder to install the desired version.
You will need the Haskell Platform installed or at least ```cabal``` 
and ```cabal install```. Install my version of ```aeson-bson```:

```
git clone https://github.com/adinapoli/aeson-bson.git
cd aeson-bson
cabal install
```

## Avoid Cabal Hell
Consider using ```hsenv``` to work inside an isolate environment everytime:

```
https://github.com/tmhedberg/hsenv.git
```

Usage is simple: clone the pragmatic project, cd inside it, then:

```
hsenv
source .hsenv/bin/activate
```

Et voilà! Now you can install whatever you like without the risk of polluting
your global Cabal installation. Is the trick I use myself; I've installed in
the global Cabal only barebone stuff, all the rest lives inside a separate
isolated environment! If you have cabal hell inside hsenv, simply delete
```.hsenv``` and repeat the steps above; you'll have a brand new environment
to spoil!

## Running the web server

This changes episode after episode. Even though Snap allows you to compile
your webapp in a raw, blazing fast, machine executable, it's easier when
hacking to run the server like a normal Haskell program:

```
cd [any episodes >= 2]
runhaskell Pragmatic/Server/Main.hs
```

## Show me a demo!

Sure! Here we go: http://ec2-107-22-56-237.compute-1.amazonaws.com:8000
