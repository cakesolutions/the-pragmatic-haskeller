{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Server.RecipePuppy where

import Pragmatic.Server.Application
import Data.ByteString
import Snap hiding (get)
import Data.Monoid
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as T
import qualified Network.HTTP as H

apiUrl :: Text
apiUrl = "http://www.recipepuppy.com/api/"

puppyRoutes :: [(ByteString, AppHandler ())]
puppyRoutes = [("/puppy/search/:ingredient", searchByIngredient)]

get :: String -> IO String
get url = do
    response <- H.simpleHTTP $ H.getRequest url
    H.getResponseBody response

searchByIngredient :: AppHandler ()
searchByIngredient = do
    i <- getParam "ingredient"
    let ingredient = maybe "" T.decodeUtf8 i
    output <- liftIO $ get (T.unpack $ apiUrl <> "?i=" <> ingredient)
    writeText (T.pack output)
