{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.JSON.Parser where

import Data.Aeson
import Pragmatic.Types
import Control.Applicative
import Control.Monad


instance FromJSON Recipe
instance ToJSON Recipe

-------------------------------------------------------------------------------
instance FromJSON Step
instance ToJSON Step

-------------------------------------------------------------------------------
instance FromJSON Ingredient
instance ToJSON Ingredient

-------------------------------------------------------------------------------
instance FromJSON Duration
instance ToJSON Duration
