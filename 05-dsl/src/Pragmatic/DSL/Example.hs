{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Parser where

import Text.ParserCombinators.Parsec
import Text.Parsec hiding (try)
import Control.Applicative hiding ((<|>), optional)

-- Shameless copy of the "Parsing Stuff in
-- Haskell" talk.

-- "pure" is from applicative;
-- it simply returns the feeded
-- value, in this case True
-- pure :: Applicative f => a -> f a
alwaysTrue :: Parser Bool
alwaysTrue = pure True

-- The trick here is to use the applicative
-- *> to sequence applicatives but keeping track
-- of the failure
-- (*>) :: Applicative f => f a -> f b -> f b
boolTrue :: Parser Bool
boolTrue = (string "true") *> alwaysTrue

data Quantity = Quantity
    { qt :: Int
    , ms :: Maybe String } deriving Show

(<||>) :: Parser a -> Parser a -> Parser a
p <||> q = (try p) <|> q

-- Here we are saying, try to match one between
-- gr and ml, in you can't default to Nothing.
-- The trick is using pure
-- pure :: a -> f a
measure :: Parser (Maybe String)
measure = (string "gr" *> (pure $ Just "gr"))
     <||> (string "ml" *> (pure $ Just "ml"))
     <||> (pure Nothing)

parseMeasure = parse measure "pmeasure"

ws :: Parser String
ws = many1 (oneOf " ")

int :: (Integral a, Read a) => Parser a
int = read <$> (many1 digit)

quantity :: Parser Quantity
quantity = do
    qt <- int <* ws
    ms <- measure
    return $ Quantity qt ms
    


