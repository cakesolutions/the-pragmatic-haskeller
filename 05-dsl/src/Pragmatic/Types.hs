module Pragmatic.Types where

data Recipe = Recipe
  { recipeName :: String
  , ingredients :: [Ingredient]
  , steps :: [Step]
  } deriving Show

type Measure = String

data Ingredient = Ingredient 
  { ingredientName :: String
  , quantity :: Int
  , measure :: Maybe Measure
  } deriving Show

data Step = Step
  { stepName :: String
  , order :: Int
  , stepDuration :: Maybe Duration
  } deriving (Eq, Show)

instance Ord Step where
    compare s1 s2 = compare (order s1) (order s2)

data Duration = Duration
  { duration :: Int
  , durationMeasure :: Measure
  } deriving (Eq, Show)
