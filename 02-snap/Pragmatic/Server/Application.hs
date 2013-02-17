{-# LANGUAGE TemplateHaskell #-}

module Pragmatic.Server.Application where

import Control.Lens.TH
import Snap.Snaplet
import Snap.Snaplet.MongoDB.Core

data Pragmatic = Pragmatic 
  { _db :: Snaplet MongoDB }

makeLenses ''Pragmatic
