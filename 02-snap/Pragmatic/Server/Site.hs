{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Server.Site (app) where

import Data.Aeson
import Data.ByteString (ByteString)
import Data.ByteString.Lazy as BL hiding (ByteString)
import Data.Text as T
import Database.MongoDB
import Pragmatic.JSON.Parser
import Pragmatic.Server.Application
import Pragmatic.Types
import Snap
import Snap.Snaplet.MongoDB

-------------------------------------------------------------------------------
handleIndex :: AppHandler ()
handleIndex = writeText "Welcome to the pragmatic bakery!"


-------------------------------------------------------------------------------
-- Show the underlying Haskell data structure of recipe.json
handleShow :: AppHandler ()
handleShow = do
    toParse <- liftIO $ BL.readFile "recipe.json"
    writeText $ parseRecipe toParse
  where parseRecipe tp = case (eitherDecode' tp :: Either String Recipe) of
                           Left e -> T.pack e
                           Right r -> T.pack . show $ r


-------------------------------------------------------------------------------
handleStore :: AppHandler ()
handleStore = undefined

-------------------------------------------------------------------------------
routes :: [(ByteString, Handler Pragmatic Pragmatic ())]
routes = [("/", handleIndex)
         , ("/show", handleShow)
         , ("/store", handleStore)
         ]


-------------------------------------------------------------------------------
app :: SnapletInit Pragmatic Pragmatic
app = makeSnaplet "pragmatic" "Pragmatic web service" Nothing $ do
    d <- nestSnaplet "db" db $ mongoDBInit 10 (host "127.0.0.1") "Snaplet-MongoDB"
    addRoutes routes
    return $ Pragmatic d
