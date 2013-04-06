{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Server.Site (app) where

import Data.Aeson
import Data.AesonBson
import Data.ByteString (ByteString)
import Data.Configurator
import Data.Text as T
import Database.MongoDB
import Pragmatic.JSON.Parser
import Pragmatic.Server.Application
import Pragmatic.Types
import Snap
import Snap.Snaplet.MongoDB
import qualified Data.ByteString.Lazy as BL


-------------------------------------------------------------------------------
handleIndex :: AppHandler ()
handleIndex = writeText "Welcome to the pragmatic bakery!"


-------------------------------------------------------------------------------
-- Show the underlying Haskell data structure of recipe.json
handleShow :: AppHandler ()
handleShow = do
    toParse <- liftIO $ BL.readFile "recipe.json"
    writeText $ eitherParse toParse
  where eitherParse tp = case (eitherDecode' tp :: Either String Object) of
                           Left e -> T.pack e
                           Right r -> T.pack . show $ r


-------------------------------------------------------------------------------
-- Here we try to store the recipe.json with the new Data.AesonBson
handleStore :: AppHandler ()
handleStore = do
    toParse <- liftIO $ BL.readFile "recipe.json"
    result <- storeRecipe toParse
    writeText $ T.pack . show $ result


-------------------------------------------------------------------------------
parseRecipe :: BL.ByteString -> Either String Object
parseRecipe = eitherDecode'

-------------------------------------------------------------------------------
storeRecipe :: BL.ByteString -> AppHandler (Either String Object)
storeRecipe recipe = case parseRecipe recipe of
      Left f -> return $ Left f
      Right r -> do
        res <- eitherWithDB $ insert "recipes" $ toBson r
        case res of
          Left _ -> return $ Left "Failed to store the recipe."
          Right _ -> return $ Right r


-------------------------------------------------------------------------------
routes :: [(ByteString, Handler Pragmatic Pragmatic ())]
routes = [("/", handleIndex)
         , ("/show", handleShow)
         , ("/store", handleStore)
         ]


-------------------------------------------------------------------------------
app :: SnapletInit Pragmatic Pragmatic
app = makeSnaplet "pragmatic" "Pragmatic web service" Nothing $ do
    conf <- getSnapletUserConfig
    dbName <- liftIO $ require conf "pragmatic.db"
    dbHost <-  liftIO $ require conf "pragmatic.host"
    d <- nestSnaplet "db" db $ mongoDBInit 10 (host dbHost) dbName
    addRoutes routes
    return $ Pragmatic d
