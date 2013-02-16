{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.JSONParser where

import Data.Aeson
import Pragmatic.Types
import Control.Applicative
import Control.Monad


instance FromJSON Recipe where
    parseJSON (Object r) = Recipe <$>
                           r .: "name" <*>
                           r .: "ingredients" <*>
                           r .: "steps"
    parseJSON _ = mzero

instance ToJSON Recipe where
    toJSON (Recipe n i s) = object ["name" .= n, "ingredients" .= i, "steps" .= s]

-------------------------------------------------------------------------------

instance FromJSON Step where
    parseJSON (Object s) = Step <$>
                           s .: "step" <*>
                           s .: "order" <*>
                           s .: "duration"
    parseJSON _ = mzero

instance ToJSON Step where
    toJSON (Step s o d) = object ["step" .= s, "order" .= o, "duration" .= d]

-------------------------------------------------------------------------------

instance FromJSON Ingredient where
    parseJSON (Object i) = Ingredient <$>
                           i .: "name" <*>
                           i .: "quantity" <*>
                           i .: "measure"
    parseJSON _ = mzero

instance ToJSON Ingredient where
    toJSON (Ingredient n q m) = object ["name" .= n, "quantity" .= q, "measure" .= m]

-------------------------------------------------------------------------------
instance FromJSON Duration where
    parseJSON (Object d) = Duration <$>
                           d .: "duration" <*>
                           d .: "measure"
    parseJSON _ = mzero

instance ToJSON Duration where
    toJSON (Duration d m) = object ["duration" .= d, "measure" .= m]

-------------------------------------------------------------------------------

