{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Routes where

import Control.Lens
import Data.Aeson.Encode.Pretty (encodePretty)
import Data.ByteString (ByteString)
import Data.ByteString.Lazy (toStrict)
import Data.Text (Text)
import Data.Text.Encoding (decodeUtf8)
import Pragmatic.DSL.Parser
import Pragmatic.JSON.Parser()
import Pragmatic.Server.Application
import Pragmatic.Types
import Snap
import Snap.Snaplet.Heist
import Text.Blaze.Html5
import Text.Blaze.Renderer.XmlHtml (renderHtmlNodes)
import Text.Parsec (parse)
import qualified Data.ByteString.Char8 as BC (unpack)
import qualified Data.Text as T
import qualified Heist.Interpreted as I
import qualified Text.Blaze.Html5 as H
import qualified Text.Blaze.Html5.Attributes as A

dslRoutes :: [(ByteString, AppHandler ())]
dslRoutes = [("/recipe/new", handleNewRecipe)]

recipe2json :: Recipe -> Text
recipe2json = decodeUtf8 . toStrict . encodePretty


-- Uses lenses to incrementally increase the order
correctOrder :: Recipe -> Recipe
correctOrder r = r { _steps = newSteps (_steps r)}
  where newSteps s = zipWith (over order) (const <$> [1..length s]) s


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
                    Right r -> let splices = [("json", I.textSplice $ recipe2json . correctOrder $ r)]
                                in renderWithSplices "new_recipe" splices) dslSourceCode

        spliceError e d = let splices = [("parsingError", bootstrapAlert "alert" e)
                                        ,("editorCurrentLine", findErrorLine e)
                                        ,("recipe", I.textSplice d)]
                             in renderWithSplices "new_dsl" splices 

        findErrorLine = I.textSplice . T.singleton . Prelude.head . snd . splitAt 6
