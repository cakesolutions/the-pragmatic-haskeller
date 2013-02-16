{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Server where

import Prelude hiding (readFile)
import Snap
import Data.Aeson
import Pragmatic.Types
import Pragmatic.JSON.Parser
import Data.Text as T
import Data.ByteString.Lazy

showRecipe :: ByteString -> Snap ()
showRecipe toParse = writeText parseRecipe
  where parseRecipe = case (eitherDecode' toParse :: Either String Recipe) of
                        Left e -> T.pack e
                        Right r -> T.pack . show $ r

app :: ByteString -> Snap ()
app toParse = route [("/recipe", showRecipe toParse)]

main :: IO ()
main = do
    toParse <- readFile "recipe.json"
    quickHttpServe (app toParse)
