``` haskell

{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Server where

import Snap

site :: Snap ()
site = writeText "Hello Pragmatic Haskeller!"

main :: IO ()
main = quickHttpServe site

```
