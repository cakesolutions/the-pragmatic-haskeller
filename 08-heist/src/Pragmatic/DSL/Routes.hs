{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Routes where

import Pragmatic.Server.Application
import Pragmatic.Types
import Pragmatic.JSON.Parser()
import Pragmatic.DSL.Parser
import Text.Parsec (parse)
import Data.Text (Text)
import Data.Text.Encoding (decodeUtf8)
import Data.ByteString.Lazy (toStrict)
import Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BC (pack, unpack)
import Snap
import Data.Aeson (encode)
import Snap.Snaplet.Heist
import qualified Heist.Interpreted as I

dslRoutes :: [(ByteString, AppHandler ())]
dslRoutes = [("/recipe/new", handleNewRecipe)]

recipe2json :: Recipe -> Text
recipe2json = decodeUtf8 . toStrict . encode

handleNewRecipe :: AppHandler ()
handleNewRecipe = method POST handleParsing
  where handleParsing = do
            dslSourceCode <- getPostParam "dsl"
            maybe (writeBS "Dsl can't be empty!") (\s ->
                  case parse recipe "" (BC.unpack s) of
                    Left e -> writeBS . BC.pack . show $ e
                    Right r -> let splices = [("json", I.textSplice $ recipe2json r)]
                                   in renderWithSplices "new_recipe" splices)
                  dslSourceCode
