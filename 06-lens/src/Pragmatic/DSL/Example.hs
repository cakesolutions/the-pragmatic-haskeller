{-# LANGUAGE OverloadedStrings #-}

module Pragmatic.DSL.Example where

import Text.ParserCombinators.Parsec
import Pragmatic.Types
import Pragmatic.DSL.Parser
import Control.Applicative hiding ((<|>), optional, many)
import Control.Lens

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

parseCiambellone :: IO (Either ParseError Recipe)
parseCiambellone = do
  res <- parseFromFile recipe "ciambellone.rcp"
  case res of
    Left e -> return . Left $ e
    Right r -> return . Right . correctOrder $ r

-- Uses lenses to incrementally increase
-- the order
correctOrder :: Recipe -> Recipe
correctOrder r = r { _steps = newSteps (_steps r)}
  where newSteps s = let setters = map const [1..length s]
                         pairs = zip setters s
                     in map (\f -> over order (fst f) (snd f)) pairs


printCiambelloneParsing :: IO ()
printCiambelloneParsing = parseCiambellone >>= print
