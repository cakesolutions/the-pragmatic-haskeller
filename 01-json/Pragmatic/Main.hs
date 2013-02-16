{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Main where

import Data.ByteString.Lazy as BL
import Data.ByteString.Lazy.Char8 as C8
import Pragmatic.Types
import Pragmatic.JSONParser
import Data.Aeson
import Data.Monoid

main :: IO ()
main = do
    toParse <- BL.readFile "recipe.json"
    case (eitherDecode' toParse :: Either String Recipe) of
      Right r -> Prelude.putStrLn . show $ r
      Left e -> C8.putStrLn $ (C8.pack e) <> " in " <> toParse

