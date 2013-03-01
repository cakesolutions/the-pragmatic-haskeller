{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Parser where

import Text.ParserCombinators.Parsec
import Pragmatic.Types
import Control.Applicative hiding ((<|>), optional, many)


ws :: Parser String
ws = many (oneOf " ")


int :: (Integral a, Read a) => Parser a
int = read <$> many1 digit


stringLike :: Parser String
stringLike = char '"' *> many (noneOf "\"") <* char '"'


-- A parser combinator which skips whitespaces from both sides
lexeme :: Parser a -> Parser a
lexeme p = ws *> p <* ws


(<||>) :: Parser a -> Parser a -> Parser a
p <||> q = try p <|> q


-- Here we are saying, try to match one between
-- gr and ml, if you can't default to Nothing.
-- The trick is using  pure :: a -> f a
measureP :: Parser (Maybe String)
measureP = (string "gr" *> (pure . Just $ "gr"))
       <|> (string "ml" *> (pure . Just $ "ml"))
       <|> (pure Nothing)


syntacticSugar :: String -> Parser (Maybe String)
syntacticSugar s = (string s *> (pure . Just $ s)) <|> pure Nothing


ingredient :: Parser Ingredient
ingredient = do
    qt <- lexeme int
    ms <- lexeme measureP
    lexeme (syntacticSugar "of")
    name <- lexeme stringLike
    lexeme (syntacticSugar "and")
    string "\n"
    return $ Ingredient name qt ms

-- Step
-------------------------------------------------------------------------------
step :: Parser Step
step = do
    sn <- lexeme stringLike
    d <- optionMaybe durationP
    lexeme (syntacticSugar "and")
    string "\n"
    return $ Step sn 1 d

-- Duration
-------------------------------------------------------------------------------
durationP :: Parser Duration
durationP = do
    lexeme (string "for")
    d <- lexeme int
    u <- lexeme durationUnit
    return $ Duration d u
  where durationUnit = (string "seconds") <|>
                       (string "minutes") <|>
                       (string "hours")


-- Recipe
-------------------------------------------------------------------------------
recipe :: Parser Recipe
recipe = do
    rn <- lexeme stringLike
    lexeme (syntacticSugar "is made with") *> string "\n"
    i <- many1 ingredient
    string "\n"
    lexeme (string "preparated by") *> string "\n"
    s <- many1 step
    return $ Recipe rn i s
