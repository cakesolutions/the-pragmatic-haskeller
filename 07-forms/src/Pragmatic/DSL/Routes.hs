{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Routes where

import Pragmatic.Server.Application
import Pragmatic.DSL.Parser
import Text.Parsec (parse)
import Data.ByteString
import qualified Data.ByteString.Char8 as BC (pack, unpack)
import Snap
import Snap.Snaplet.Heist

dslRoutes :: [(ByteString, AppHandler ())]
dslRoutes = [("/recipe/new", handleNewRecipe)]

handleNewRecipe :: AppHandler ()
handleNewRecipe = method POST handleParsing
  where handleParsing = do
            dslSourceCode <- getPostParam "dsl"
            maybe (writeBS "Dsl can't be empty!") (\s ->
                  case parse recipe "" (BC.unpack s) of
                    Left e -> (writeBS . BC.pack . show $ e)
                    Right r -> render "new_recipe") dslSourceCode

