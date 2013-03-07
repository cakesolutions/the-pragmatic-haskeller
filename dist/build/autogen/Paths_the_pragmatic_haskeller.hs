module Paths_the_pragmatic_haskeller (
    version,
    getBinDir, getLibDir, getDataDir, getLibexecDir,
    getDataFileName
  ) where

import qualified Control.Exception as Exception
import Data.Version (Version(..))
import System.Environment (getEnv)
import Prelude

catchIO :: IO a -> (Exception.IOException -> IO a) -> IO a
catchIO = Exception.catch


version :: Version
version = Version {versionBranch = [0,1,0,0], versionTags = []}
bindir, libdir, datadir, libexecdir :: FilePath

bindir     = "/Users/adinapoli/programming/haskell/the-pragmatic-haskeller/.hsenv/cabal/bin"
libdir     = "/Users/adinapoli/programming/haskell/the-pragmatic-haskeller/.hsenv/cabal/lib/the-pragmatic-haskeller-0.1.0.0/ghc-7.6.2"
datadir    = "/Users/adinapoli/programming/haskell/the-pragmatic-haskeller/.hsenv/cabal/share/the-pragmatic-haskeller-0.1.0.0"
libexecdir = "/Users/adinapoli/programming/haskell/the-pragmatic-haskeller/.hsenv/cabal/libexec"

getBinDir, getLibDir, getDataDir, getLibexecDir :: IO FilePath
getBinDir = catchIO (getEnv "the_pragmatic_haskeller_bindir") (\_ -> return bindir)
getLibDir = catchIO (getEnv "the_pragmatic_haskeller_libdir") (\_ -> return libdir)
getDataDir = catchIO (getEnv "the_pragmatic_haskeller_datadir") (\_ -> return datadir)
getLibexecDir = catchIO (getEnv "the_pragmatic_haskeller_libexecdir") (\_ -> return libexecdir)

getDataFileName :: FilePath -> IO FilePath
getDataFileName name = do
  dir <- getDataDir
  return (dir ++ "/" ++ name)
