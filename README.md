
## The Pragmatic Haskeller

A collection of "recipies" (no pun intended) to pragmatically
get things done in Haskell. We'll build a simple web application for managing
recipies. In particular, we'll focus on:

* How to parse Json files describing recipies

* Build a web service which sends us back recipies ad Json file.

* A DSL for describing recipies

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

## Running the web server

```
cd 02-snap
runhaskell Pragmatic/Server/Main.hs
```
