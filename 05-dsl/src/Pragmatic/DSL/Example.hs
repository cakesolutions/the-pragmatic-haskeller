{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Parser where

import Text.ParserCombinators.Parsec
import Pragmatic.Types
import Text.Parsec hiding (try)
import Control.Applicative hiding ((<|>), optional, many)

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
p <||> q = try p <|> q

-- Here we are saying, try to match one between
-- gr and ml, in you can't default to Nothing.
-- The trick is using pure
-- pure :: a -> f a
measureP :: Parser (Maybe String)
measureP = (string "gr" *> (pure $ Just "gr"))
     <||> (string "ml" *> (pure $ Just "ml"))
     <||> (pure Nothing)


ws :: Parser String
ws = many1 (oneOf " ")

int :: (Integral a, Read a) => Parser a
int = read <$> many1 digit

stringLike :: Parser String
stringLike = char '"' *> many (noneOf ['"']) <* char '"'

-- A parser combinator which skips whitespaces
lexeme :: Parser a -> Parser a
lexeme p = p <* ws

quantityP :: Parser Quantity
quantityP = do
    qt <- lexeme int
    ms <- measureP
    return $ Quantity qt ms

ingredient :: Parser Ingredient
ingredient = do
    qt <- lexeme int
    ms <- lexeme measureP
    lexeme (string "of")
    name <- stringLike
    return $ Ingredient name qt ms
