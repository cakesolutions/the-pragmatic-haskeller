{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.Server where

import Snap
import Pragmatic.Server.Site


-------------------------------------------------------------------------------
main :: IO ()
main = do
    (_, site, _) <- runSnaplet Nothing app
    quickHttpServe site
