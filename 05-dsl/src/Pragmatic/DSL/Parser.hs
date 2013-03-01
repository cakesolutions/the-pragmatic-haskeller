{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Parser where

import Text.ParserCombinators.Parsec
import Pragmatic.Types
import Text.Parsec hiding (try)
import Control.Applicative hiding ((<|>), optional, many)


ws :: Parser String
ws = many (oneOf " ")


int :: (Integral a, Read a) => Parser a
int = read <$> many1 digit


stringLike :: Parser String
stringLike = char '"' *> many (noneOf ['"']) <* char '"'


-- A parser combinator which skips whitespaces
lexeme :: Parser a -> Parser a
lexeme p = ws *> p <* ws


(<||>) :: Parser a -> Parser a -> Parser a
p <||> q = try p <|> q


-- Here we are saying, try to match one between
-- gr and ml, in you can't default to Nothing.
-- The trick is using pure
-- pure :: a -> f a
measureP :: Parser (Maybe String)
measureP = (string "gr" *> (pure . Just $ "gr"))
       <|> (string "ml" *> (pure . Just $ "ml"))
       <|> (pure Nothing)

ofP :: Parser (Maybe String)
ofP = (string "of" *> (pure . Just $ "of")) <|> pure Nothing

-- Still doesn't handle the possibility "of" is
-- optional
ingredient :: Parser Ingredient
ingredient = do
    qt <- lexeme int
    ms <- lexeme measureP
    lexeme ofP
    name <- lexeme stringLike
    return $ Ingredient name qt ms
