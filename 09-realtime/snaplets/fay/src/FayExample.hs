{-# OPTIONS -Wall -fno-warn-name-shadowing -fno-warn-unused-do-bind #-}
module FayExample where

import Language.Fay.FFI
import JQuery
import Prelude

main :: Fay ()
main = mapM_ addOnload [onload]

void :: Fay f -> Fay ()
void f = f >> return ()

addOnload :: Fay f -> Fay ()
addOnload = ffi "window.addEventListener(\"load\", %1)"

onload :: Fay ()
onload = void $ do
  title <- select "h1"
  setText "Awesome stuff" title
  return ()
