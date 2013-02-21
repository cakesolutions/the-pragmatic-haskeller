{-# LANGUAGE TemplateHaskell #-}

module Pragmatic.Server.Application where

import Control.Lens
import Snap.Snaplet
import Snap.Snaplet.MongoDB.Core

-------------------------------------------------------------------------------
data Pragmatic = Pragmatic 
  { _db :: Snaplet MongoDB }

makeLenses ''Pragmatic


-------------------------------------------------------------------------------
instance HasMongoDB Pragmatic where
    getMongoDB app = view snapletValue (view db app)


-------------------------------------------------------------------------------
type AppHandler = Handler Pragmatic Pragmatic
