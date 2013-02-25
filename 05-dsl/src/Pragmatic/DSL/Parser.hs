{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Parser where

import Text.ParserCombinators.Parsec
import Pragmatic.Types

-- A simple parser which returns a string.
-- We are saying "pick as many char as you
-- want, ignoring spaces and newlines. It will
-- stop as soon as it finds a space or a newline
plainValue :: Parser String
plainValue = many1 (noneOf " \n")

-- We run a parser this way, this will yield
-- "to"
runPlainValue :: Either ParseError String
runPlainValue = parse plainValue "description" "to match"

ingredient :: Parser Ingredient
ingredient = undefined
