{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Routes where

import Pragmatic.Server.Application
import Pragmatic.Types
import Pragmatic.JSON.Parser()
import Pragmatic.DSL.Parser
import Text.Parsec (parse)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Text.Encoding (decodeUtf8)
import Data.ByteString.Lazy (toStrict)
import Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BC (unpack)
import Snap
import Data.Aeson.Encode.Pretty (encodePretty)
import Snap.Snaplet.Heist
import qualified Heist.Interpreted as I

dslRoutes :: [(ByteString, AppHandler ())]
dslRoutes = [("/recipe/new", handleNewRecipe)]

recipe2json :: Recipe -> Text
recipe2json = decodeUtf8 . toStrict . encodePretty

handleNewRecipe :: AppHandler ()
handleNewRecipe = method POST handleParsing
  where handleParsing = do
            dslSourceCode <- getPostParam "dsl"
            maybe (spliceError "Dsl can't be empty!")(\s ->
                  case parse recipe "" (BC.unpack s) of
                    Left e -> spliceError . T.pack . show $ e
                    Right r -> let splices = [("json", I.textSplice $ recipe2json r)]
                                   in renderWithSplices "new_recipe" splices)
                  dslSourceCode

        spliceError e = let splices = [("parsingError", I.textSplice e)]
                            in renderWithSplices "index" splices 
