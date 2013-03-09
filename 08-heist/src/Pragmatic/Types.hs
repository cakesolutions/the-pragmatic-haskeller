{-# LANGUAGE TemplateHaskell #-}

module Pragmatic.Types where

import Control.Lens

-------------------------------------------------------------------------------
type Measure = String


-------------------------------------------------------------------------------
data Ingredient = Ingredient 
  { ingredientName :: String
  , quantity :: Int
  , measure :: Maybe Measure
  } deriving Show


-------------------------------------------------------------------------------
data Duration = Duration
  { duration :: Int
  , durationMeasure :: Measure
  } deriving (Eq, Show)


-------------------------------------------------------------------------------
data Step = Step
  { _stepName :: String
  , _order :: Int
  , _stepDuration :: Maybe Duration
  } deriving (Eq, Show)

makeLenses ''Step

instance Ord Step where
    compare s1 s2 = compare (_order s1) (_order s2)


-------------------------------------------------------------------------------
data Recipe = Recipe
  { _recipeName :: String
  , _ingredients :: [Ingredient]
  , _steps :: [Step]
  } deriving Show

makeLenses ''Recipe
