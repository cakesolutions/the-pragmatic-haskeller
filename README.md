
## The Pragmatic Haskeller

A collection of "recipies" (no pun intended) to pragmatically
get things done in Haskell. We'll build a simple web application for managing
recipies. In particular, we'll focus on:

* How to parse Json files describing recipies

* Build a web service which sends us back recipies ad Json file.

* A DSL for describing recipies

* Interfacing with an external [API](http://www.bigoven.com/)

* An Async agent for decoupling heavy computations from our REST endpoints

## Installation

``` shell
cabal install
```

inside the root folder. You will need the Haskell Platform installed or
at least ```cabal``` and ```cabal install```. You will also need to install
```snaplet-mongodb-minimalistic```. Install it manually until my patch gets
merged in the official repo and the new package get released on Hackage:

```
git clone https://github.com/adinapoli/snaplet-mongodb-minimalistic.git
cd snaplet-mongodb-minimalistic
cabal install
```

Same applies for ```aeson-bson``` and the latest Snap:

```
git clone https://github.com/adinapoli/aeson-bson.git
cd aeson-bson
cabal install
```

```
git clone https://github.com/adinapoli/snap.git
cd snap
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
