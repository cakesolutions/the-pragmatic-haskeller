{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Routes where

import Pragmatic.Server.Application
import Pragmatic.Types
import Pragmatic.JSON.Parser()
import Pragmatic.DSL.Parser
import Text.Parsec (parse)
import Data.Text (Text)
import qualified Data.Text as T
import Text.Blaze.Html5
import qualified Text.Blaze.Html5 as H
import qualified Text.Blaze.Html5.Attributes as A
import Data.Text.Encoding (decodeUtf8)
import Data.ByteString.Lazy (toStrict)
import Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BC (unpack)
import Snap
import Data.Aeson.Encode.Pretty (encodePretty)
import Snap.Snaplet.Heist
import qualified Heist.Interpreted as I
import Text.Blaze.Renderer.XmlHtml (renderHtmlNodes)

dslRoutes :: [(ByteString, AppHandler ())]
dslRoutes = [("/recipe/new", handleNewRecipe)]

recipe2json :: Recipe -> Text
recipe2json = decodeUtf8 . toStrict . encodePretty

-- Can be refactored out
bootstrapAlert :: String -> String -> I.Splice AppHandler
bootstrapAlert alertType msg = return $ renderHtmlNodes innerHtml
  where innerHtml = H.div ! A.class_ (toValue ("alert alert-" ++ alertType)) $
                      toHtml msg

handleNewRecipe :: AppHandler ()
handleNewRecipe = method POST handleParsing
  where handleParsing = do
            dslSourceCode <- getPostParam "dsl"
            maybe (spliceError "Dsl can't be empty!" "")(\s ->
                  case parse recipe "" (BC.unpack s) of
                    Left e -> spliceError (show e) (T.strip . decodeUtf8 $ s)
                    Right r -> let splices = [("json", I.textSplice $ recipe2json r)]
                                in renderWithSplices "new_recipe" splices) dslSourceCode

        spliceError e d = let splices = [("parsingError", bootstrapAlert "alert" e)
                                        ,("editorCurrentLine", findErrorLine e)
                                        ,("recipe", I.textSplice d)]
                             in renderWithSplices "new_dsl" splices 

        findErrorLine = I.textSplice . T.singleton . Prelude.head . snd . splitAt 6
