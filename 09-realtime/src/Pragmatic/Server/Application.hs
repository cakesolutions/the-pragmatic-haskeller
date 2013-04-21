{-# LANGUAGE TemplateHaskell #-}

module Pragmatic.Server.Application where

import Control.Lens
import Snap.Snaplet
import Snap.Snaplet.Heist
import Snap.Snaplet.MongoDB.Core
import Snap.Snaplet.Fay

-------------------------------------------------------------------------------
data Pragmatic = Pragmatic
    { _heist :: Snaplet (Heist Pragmatic)
    , _db :: Snaplet MongoDB
    , _fay :: Snaplet Fay
    }

makeLenses ''Pragmatic


-------------------------------------------------------------------------------
instance HasHeist Pragmatic where
    heistLens = subSnaplet heist

-------------------------------------------------------------------------------
instance HasMongoDB Pragmatic where
    getMongoDB app = view snapletValue (view db app)


-------------------------------------------------------------------------------
type AppHandler = Handler Pragmatic Pragmatic
