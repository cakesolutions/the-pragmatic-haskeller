## The Pragmatic Haskeller

A collection of "recipes" (no pun intended) to pragmatically
get things done in Haskell. We'll build a simple web application for managing
recipes. In particular, we'll focus on:

* How to parse Json files describing recipes

* How to automatically convert between Json and Bson for storing recipes inside MongoDB

* Interfacing with an external [API](http://www.recipepuppy.com/)

* A DSL for describing recipes

## Follow the tutorials!

I wrote a complete series on "The School of Haskell":

* [The Pragmatic Haskeller](https://www.fpcomplete.com/user/adinapoli/the-pragmatic-haskeller)

## Installation

``` shell
cd <episode folder>
cabal install
```

inside each subfolder to install the desired version.
You will need the Haskell Platform installed or at least ```cabal```
and ```cabal install```.


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

## Running each episode

```
cabal install
pragmatic
```

To run the "pragmatic" server.

## Show me a demo!

Sure! Here we go: http://ec2-107-22-56-237.compute-1.amazonaws.com:8000
