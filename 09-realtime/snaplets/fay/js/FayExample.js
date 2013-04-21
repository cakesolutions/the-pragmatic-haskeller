/** @constructor
*/
var FayExample = function(){
/*******************************************************************************
 * Thunks.
 */

// Force a thunk (if it is a thunk) until WHNF.
function Fay$$_(thunkish,nocache){
  while (thunkish instanceof Fay$$$) {
    thunkish = thunkish.force(nocache);
  }
  return thunkish;
}

// Apply a function to arguments (see method2 in Fay.hs).
function Fay$$__(){
  var f = arguments[0];
  for (var i = 1, len = arguments.length; i < len; i++) {
    f = (f instanceof Fay$$$? Fay$$_(f) : f)(arguments[i]);
  }
  return f;
}

// Thunk object.
function Fay$$$(value){
  this.forced = false;
  this.value = value;
}

// Force the thunk.
Fay$$$.prototype.force = function(nocache) {
  return nocache ?
    this.value() :
    (this.forced ?
     this.value :
     (this.value = this.value(), this.forced = true, this.value));
};


function Fay$$seq(x) {
  return function(y) {
    Fay$$_(x,false);
    return y;
  }
}

function Fay$$seq$36$uncurried(x,y) {
  Fay$$_(x,false);
  return y;
}

/*******************************************************************************
 * Monad.
 */

function Fay$$Monad(value){
  this.value = value;
}

// This is used directly from Fay, but can be rebound or shadowed. See primOps in Types.hs.
// >>
function Fay$$then(a){
  return function(b){
    return Fay$$bind(a)(function(_){
      return b;
    });
  };
}

// This is used directly from Fay, but can be rebound or shadowed. See primOps in Types.hs.
// >>
function Fay$$then$36$uncurried(a,b){
  return Fay$$bind$36$uncurried(a,function(_){ return b; });
}

// >>=
// This is used directly from Fay, but can be rebound or shadowed. See primOps in Types.hs.
function Fay$$bind(m){
  return function(f){
    return new Fay$$$(function(){
      var monad = Fay$$_(m,true);
      return Fay$$_(f)(monad.value);
    });
  };
}

// >>=
// This is used directly from Fay, but can be rebound or shadowed. See primOps in Types.hs.
function Fay$$bind$36$uncurried(m,f){
  return new Fay$$$(function(){
    var monad = Fay$$_(m,true);
    return Fay$$_(f)(monad.value);
  });
}

// This is used directly from Fay, but can be rebound or shadowed.
function Fay$$$_return(a){
  return new Fay$$Monad(a);
}

// Allow the programmer to access thunk forcing directly.
function Fay$$force(thunk){
  return function(type){
    return new Fay$$$(function(){
      Fay$$_(thunk,type);
      return new Fay$$Monad(Fay$$unit);
    })
  }
}

// This is used directly from Fay, but can be rebound or shadowed.
function Fay$$return$36$uncurried(a){
  return new Fay$$Monad(a);
}

// Unit: ().
var Fay$$unit = null;

/*******************************************************************************
 * Serialization.
 * Fay <-> JS. Should be bijective.
 */

// Serialize a Fay object to JS.
function Fay$$fayToJs(type,fayObj){
  var base = type[0];
  var args = type[1];
  var jsObj;
  if(base == "action") {
    // A nullary monadic action. Should become a nullary JS function.
    // Fay () -> function(){ return ... }
    jsObj = function(){
      return Fay$$fayToJs(args[0],Fay$$_(fayObj,true).value);
    };

  }
  else if(base == "function") {
    // A proper function.
    jsObj = function(){
      var fayFunc = fayObj;
      var return_type = args[args.length-1];
      var len = args.length;
      // If some arguments.
      if (len > 1) {
        // Apply to all the arguments.
        fayFunc = Fay$$_(fayFunc,true);
        // TODO: Perhaps we should throw an error when JS
        // passes more arguments than Haskell accepts.
        for (var i = 0, len = len; i < len - 1 && fayFunc instanceof Function; i++) {
          // Unserialize the JS values to Fay for the Fay callback.
          fayFunc = Fay$$_(fayFunc(Fay$$jsToFay(args[i],arguments[i])),true);
        }
        // Finally, serialize the Fay return value back to JS.
        var return_base = return_type[0];
        var return_args = return_type[1];
        // If it's a monadic return value, get the value instead.
        if(return_base == "action") {
          return Fay$$fayToJs(return_args[0],fayFunc.value);
        }
        // Otherwise just serialize the value direct.
        else {
          return Fay$$fayToJs(return_type,fayFunc);
        }
      } else {
        throw new Error("Nullary function?");
      }
    };

  }
  else if(base == "string") {
    jsObj = Fay$$fayToJs_string(fayObj);
  }
  else if(base == "list") {
    // Serialize Fay list to JavaScript array.
    var arr = [];
    fayObj = Fay$$_(fayObj);
    while(fayObj instanceof Fay$$Cons) {
      arr.push(Fay$$fayToJs(args[0],fayObj.car));
      fayObj = Fay$$_(fayObj.cdr);
    }
    jsObj = arr;

  }
  else if(base == "tuple") {
    // Serialize Fay tuple to JavaScript array.
    var arr = [];
    fayObj = Fay$$_(fayObj);
    var i = 0;
    while(fayObj instanceof Fay$$Cons) {
      arr.push(Fay$$fayToJs(args[i++],fayObj.car));
      fayObj = Fay$$_(fayObj.cdr);
    }
    jsObj = arr;

  }
  else if(base == "defined") {
    fayObj = Fay$$_(fayObj);
    if (fayObj instanceof $_Language$Fay$FFI$Undefined) {
      jsObj = undefined;
    } else {
      jsObj = Fay$$fayToJs(args[0],fayObj.slot1);
    }

  }
  else if(base == "nullable") {
    fayObj = Fay$$_(fayObj);
    if (fayObj instanceof $_Language$Fay$FFI$Null) {
      jsObj = null;
    } else {
      jsObj = Fay$$fayToJs(args[0],fayObj.slot1);
    }

  }
  else if(base == "double" || base == "int" || base == "bool") {
    // Bools are unboxed.
    jsObj = Fay$$_(fayObj);

  }
  else if(base == "ptr" || base == "unknown")
    return fayObj;
  else if(base == "automatic" || base == "user") {
    if(fayObj instanceof Fay$$$)
      fayObj = Fay$$_(fayObj);
    jsObj = Fay$$fayToJsUserDefined(type,fayObj);

  }
  else
    throw new Error("Unhandled Fay->JS translation type: " + base);
  return jsObj;
}

// Specialized serializer for string.
function Fay$$fayToJs_string(fayObj){
  // Serialize Fay string to JavaScript string.
  var str = "";
  fayObj = Fay$$_(fayObj);
  while(fayObj instanceof Fay$$Cons) {
    str += fayObj.car;
    fayObj = Fay$$_(fayObj.cdr);
  }
  return str;
};
function Fay$$jsToFay_string(x){
  return Fay$$list(x)
};

// Special num/bool serializers.
function Fay$$jsToFay_int(x){return x;}
function Fay$$jsToFay_double(x){return x;}
function Fay$$jsToFay_bool(x){return x;}

function Fay$$fayToJs_int(x){return Fay$$_(x);}
function Fay$$fayToJs_double(x){return Fay$$_(x);}
function Fay$$fayToJs_bool(x){return Fay$$_(x);}

// Unserialize an object from JS to Fay.
function Fay$$jsToFay(type,jsObj){
  var base = type[0];
  var args = type[1];
  var fayObj;
  if(base == "action") {
    // Unserialize a "monadic" JavaScript return value into a monadic value.
    fayObj = new Fay$$Monad(Fay$$jsToFay(args[0],jsObj));

  }
  else if(base == "string") {
    // Unserialize a JS string into Fay list (String).
    fayObj = Fay$$list(jsObj);
  }
  else if(base == "list") {
    // Unserialize a JS array into a Fay list ([a]).
    var serializedList = [];
    for (var i = 0, len = jsObj.length; i < len; i++) {
      // Unserialize each JS value into a Fay value, too.
      serializedList.push(Fay$$jsToFay(args[0],jsObj[i]));
    }
    // Pop it all in a Fay list.
    fayObj = Fay$$list(serializedList);

  }
  else if(base == "tuple") {
    // Unserialize a JS array into a Fay tuple ((a,b,c,...)).
    var serializedTuple = [];
    for (var i = 0, len = jsObj.length; i < len; i++) {
      // Unserialize each JS value into a Fay value, too.
      serializedTuple.push(Fay$$jsToFay(args[i],jsObj[i]));
    }
    // Pop it all in a Fay list.
    fayObj = Fay$$list(serializedTuple);

  }
  else if(base == "defined") {
    if (jsObj === undefined) {
      fayObj = new $_Language$Fay$FFI$Undefined();
    } else {
      fayObj = new $_Language$Fay$FFI$Defined(Fay$$jsToFay(args[0],jsObj));
    }

  }
  else if(base == "nullable") {
    if (jsObj === null) {
      fayObj = new $_Language$Fay$FFI$Null();
    } else {
      fayObj = new $_Language$Fay$FFI$Nullable(Fay$$jsToFay(args[0],jsObj));
    }

  }
  else if(base == "int") {
    // Int are unboxed, so there's no forcing to do.
    // But we can do validation that the int has no decimal places.
    // E.g. Math.round(x)!=x? throw "NOT AN INTEGER, GET OUT!"
    fayObj = Math.round(jsObj);
    if(fayObj!==jsObj) throw "Argument " + jsObj + " is not an integer!";

  }
  else if (base == "double" ||
           base == "bool" ||
           base ==  "ptr" ||
           base ==  "unknown") {
    return jsObj;
  }
  else if(base == "automatic" || base == "user") {
    if (jsObj && jsObj['instance']) {
      fayObj = Fay$$jsToFayUserDefined(type,jsObj);
    }
    else
      fayObj = jsObj;

  }
  else { throw new Error("Unhandled JS->Fay translation type: " + base); }
  return fayObj;
}

/*******************************************************************************
 * Lists.
 */

// Cons object.
function Fay$$Cons(car,cdr){
  this.car = car;
  this.cdr = cdr;
}

// Make a list.
function Fay$$list(xs){
  var out = null;
  for(var i=xs.length-1; i>=0;i--)
    out = new Fay$$Cons(xs[i],out);
  return out;
}

// Built-in list cons.
function Fay$$cons(x){
  return function(y){
    return new Fay$$Cons(x,y);
  };
}

// List index.
// `list' is already forced by the time it's passed to this function.
// `list' cannot be null and `index' cannot be out of bounds.
function Fay$$index(index,list){
  for(var i = 0; i < index; i++) {
    list = Fay$$_(list.cdr);
  }
  return list.car;
}

// List length.
// `list' is already forced by the time it's passed to this function.
function Fay$$listLen(list,max){
  for(var i = 0; list !== null && i < max + 1; i++) {
    list = Fay$$_(list.cdr);
  }
  return i == max;
}

/*******************************************************************************
 * Numbers.
 */

// Built-in *.
function Fay$$mult(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) * Fay$$_(y);
    });
  };
}

function Fay$$mult$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) * Fay$$_(y);
  });

}

// Built-in +.
function Fay$$add(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) + Fay$$_(y);
    });
  };
}

// Built-in +.
function Fay$$add$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) + Fay$$_(y);
  });

}

// Built-in -.
function Fay$$sub(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) - Fay$$_(y);
    });
  };
}
// Built-in -.
function Fay$$sub$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) - Fay$$_(y);
  });

}

// Built-in /.
function Fay$$divi(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) / Fay$$_(y);
    });
  };
}

// Built-in /.
function Fay$$divi$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) / Fay$$_(y);
  });

}

/*******************************************************************************
 * Booleans.
 */

// Are two values equal?
function Fay$$equal(lit1, lit2) {
  // Simple case
  lit1 = Fay$$_(lit1);
  lit2 = Fay$$_(lit2);
  if (lit1 === lit2) {
    return true;
  }
  // General case
  if (lit1 instanceof Array) {
    if (lit1.length != lit2.length) return false;
    for (var len = lit1.length, i = 0; i < len; i++) {
      if (!Fay$$equal(lit1[i], lit2[i])) return false;
    }
    return true;
  } else if (lit1 instanceof Fay$$Cons && lit2 instanceof Fay$$Cons) {
    do {
      if (!Fay$$equal(lit1.car,lit2.car))
        return false;
      lit1 = Fay$$_(lit1.cdr), lit2 = Fay$$_(lit2.cdr);
      if (lit1 === null || lit2 === null)
        return lit1 === lit2;
    } while (true);
  } else if (typeof lit1 == 'object' && typeof lit2 == 'object' && lit1 && lit2 &&
             lit1.constructor === lit2.constructor) {
    for(var x in lit1) {
      if(!(lit1.hasOwnProperty(x) && lit2.hasOwnProperty(x) &&
           Fay$$equal(lit1[x],lit2[x])))
        return false;
    }
    return true;
  } else {
    return false;
  }
}

// Built-in ==.
function Fay$$eq(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$equal(x,y);
    });
  };
}

function Fay$$eq$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$equal(x,y);
  });

}

// Built-in /=.
function Fay$$neq(x){
  return function(y){
    return new Fay$$$(function(){
      return !(Fay$$equal(x,y));
    });
  };
}

// Built-in /=.
function Fay$$neq$36$uncurried(x,y){

  return new Fay$$$(function(){
    return !(Fay$$equal(x,y));
  });

}

// Built-in >.
function Fay$$gt(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) > Fay$$_(y);
    });
  };
}

// Built-in >.
function Fay$$gt$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) > Fay$$_(y);
  });

}

// Built-in <.
function Fay$$lt(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) < Fay$$_(y);
    });
  };
}


// Built-in <.
function Fay$$lt$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) < Fay$$_(y);
  });

}


// Built-in >=.
function Fay$$gte(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) >= Fay$$_(y);
    });
  };
}

// Built-in >=.
function Fay$$gte$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) >= Fay$$_(y);
  });

}

// Built-in <=.
function Fay$$lte(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) <= Fay$$_(y);
    });
  };
}

// Built-in <=.
function Fay$$lte$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) <= Fay$$_(y);
  });

}

// Built-in &&.
function Fay$$and(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) && Fay$$_(y);
    });
  };
}

// Built-in &&.
function Fay$$and$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) && Fay$$_(y);
  });
  ;
}

// Built-in ||.
function Fay$$or(x){
  return function(y){
    return new Fay$$$(function(){
      return Fay$$_(x) || Fay$$_(y);
    });
  };
}

// Built-in ||.
function Fay$$or$36$uncurried(x,y){

  return new Fay$$$(function(){
    return Fay$$_(x) || Fay$$_(y);
  });

}

/*******************************************************************************
 * Mutable references.
 */

// Make a new mutable reference.
function Fay$$Ref(x){
  this.value = x;
}

// Write to the ref.
function Fay$$writeRef(ref,x){
  ref.value = x;
}

// Get the value from the ref.
function Fay$$readRef(ref,x){
  return ref.value;
}

/*******************************************************************************
 * Dates.
 */
function Fay$$date(str){
  return window.Date.parse(str);
}

/*******************************************************************************
 * Application code.
 */

var Language$Fay$FFI$Nullable = function(slot1){
  return new Fay$$$(function(){
    return new $_Language$Fay$FFI$Nullable(slot1);
  });
};
var Language$Fay$FFI$Null = new Fay$$$(function(){
  return new $_Language$Fay$FFI$Null();
});
var Language$Fay$FFI$Defined = function(slot1){
  return new Fay$$$(function(){
    return new $_Language$Fay$FFI$Defined(slot1);
  });
};
var Language$Fay$FFI$Undefined = new Fay$$$(function(){
  return new $_Language$Fay$FFI$Undefined();
});
var Prelude$Just = function(slot1){
  return new Fay$$$(function(){
    return new $_Prelude$Just(slot1);
  });
};
var Prelude$Nothing = new Fay$$$(function(){
  return new $_Prelude$Nothing();
});
var Prelude$Left = function(slot1){
  return new Fay$$$(function(){
    return new $_Prelude$Left(slot1);
  });
};
var Prelude$Right = function(slot1){
  return new Fay$$$(function(){
    return new $_Prelude$Right(slot1);
  });
};
var Prelude$maybe = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) instanceof $_Prelude$Nothing) {
          var m = $p1;
          return m;
        }
        if (Fay$$_($p3) instanceof $_Prelude$Just) {
          var x = Fay$$_($p3).slot1;
          var f = $p2;
          return Fay$$_(f)(x);
        }
        throw ["unhandled case in maybe",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$Ratio = function(slot1){
  return function(slot2){
    return new Fay$$$(function(){
      return new $_Prelude$Ratio(slot1,slot2);
    });
  };
};
var Prelude$$62$$62$$61$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$bind(Fay$$fayToJs(["action",[["unknown"]]],$p1))(Fay$$fayToJs(["function",[["unknown"],["action",[["unknown"]]]]],$p2))));
    });
  };
};
var Prelude$$62$$62$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$then(Fay$$fayToJs(["action",[["unknown"]]],$p1))(Fay$$fayToJs(["action",[["unknown"]]],$p2))));
    });
  };
};
var Prelude$$_return = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$return(Fay$$fayToJs(["unknown"],$p1))));
  });
};
var Prelude$when = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var m = $p2;
      var p = $p1;
      return Fay$$_(p) ? Fay$$_(Fay$$_(Fay$$then)(m))(Fay$$_(Fay$$$_return)(Fay$$unit)) : Fay$$_(Fay$$$_return)(Fay$$unit);
    });
  };
};
var Prelude$forM_ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var m = $p2;
      var $tmp1 = Fay$$_($p1);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        return Fay$$_(Fay$$_(Fay$$then)(Fay$$_(m)(x)))(Fay$$_(Fay$$_(Prelude$forM_)(xs))(m));
      }
      if (Fay$$_($p1) === null) {
        return Fay$$_(Fay$$$_return)(Fay$$unit);
      }
      throw ["unhandled case in forM_",[$p1,$p2]];
    });
  };
};
var Prelude$mapM_ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var m = $p1;
        return Fay$$_(Fay$$_(Fay$$then)(Fay$$_(m)(x)))(Fay$$_(Fay$$_(Prelude$mapM_)(m))(xs));
      }
      if (Fay$$_($p2) === null) {
        return Fay$$_(Fay$$$_return)(Fay$$unit);
      }
      throw ["unhandled case in mapM_",[$p1,$p2]];
    });
  };
};
var Prelude$$61$$60$$60$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(Fay$$_(Fay$$bind)(x))(f);
    });
  };
};
var Prelude$sequence = function($p1){
  return new Fay$$$(function(){
    var ms = $p1;
    return (function(){
      var k = function($p1){
        return function($p2){
          return new Fay$$$(function(){
            var m$39$ = $p2;
            var m = $p1;
            return Fay$$_(Fay$$_(Fay$$bind)(m))(function($p1){
              var x = $p1;
              return Fay$$_(Fay$$_(Fay$$bind)(m$39$))(function($p1){
                var xs = $p1;
                return Fay$$_(Fay$$$_return)(Fay$$_(Fay$$_(Fay$$cons)(x))(xs));
              });
            });
          });
        };
      };
      return Fay$$_(Fay$$_(Fay$$_(Prelude$foldr)(k))(Fay$$_(Fay$$$_return)(null)))(ms);
    })();
  });
};
var Prelude$sequence_ = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Fay$$$_return)(Fay$$unit);
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var m = $tmp1.car;
      var ms = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$then)(m))(Fay$$_(Prelude$sequence_)(ms));
    }
    throw ["unhandled case in sequence_",[$p1]];
  });
};
var Prelude$GT = new Fay$$$(function(){
  return new $_Prelude$GT();
});
var Prelude$LT = new Fay$$$(function(){
  return new $_Prelude$LT();
});
var Prelude$EQ = new Fay$$$(function(){
  return new $_Prelude$EQ();
});
var Prelude$compare = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(x))(y)) ? Prelude$GT : Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(y)) ? Prelude$LT : Prelude$EQ;
    });
  };
};
var Prelude$succ = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$add)(x))(1);
  });
};
var Prelude$pred = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$sub)(x))(1);
  });
};
var Prelude$enumFrom = function($p1){
  return new Fay$$$(function(){
    var i = $p1;
    return Fay$$_(Fay$$_(Fay$$cons)(i))(Fay$$_(Prelude$enumFrom)(Fay$$_(Fay$$_(Fay$$add)(i))(1)));
  });
};
var Prelude$enumFromTo = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var n = $p2;
      var i = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(i))(n)) ? null : Fay$$_(Fay$$_(Fay$$cons)(i))(Fay$$_(Fay$$_(Prelude$enumFromTo)(Fay$$_(Fay$$_(Fay$$add)(i))(1)))(n));
    });
  };
};
var Prelude$enumFromBy = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var by = $p2;
      var fr = $p1;
      return Fay$$_(Fay$$_(Fay$$cons)(fr))(Fay$$_(Fay$$_(Prelude$enumFromBy)(Fay$$_(Fay$$_(Fay$$add)(fr))(by)))(by));
    });
  };
};
var Prelude$enumFromThen = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var th = $p2;
      var fr = $p1;
      return Fay$$_(Fay$$_(Prelude$enumFromBy)(fr))(Fay$$_(Fay$$_(Fay$$sub)(th))(fr));
    });
  };
};
var Prelude$enumFromByTo = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var to = $p3;
        var by = $p2;
        var fr = $p1;
        return (function(){
          var neg = function($p1){
            return new Fay$$$(function(){
              var x = $p1;
              return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(to)) ? null : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(neg)(Fay$$_(Fay$$_(Fay$$add)(x))(by)));
            });
          };
          var pos = function($p1){
            return new Fay$$$(function(){
              var x = $p1;
              return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(x))(to)) ? null : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(pos)(Fay$$_(Fay$$_(Fay$$add)(x))(by)));
            });
          };
          return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(by))(0)) ? Fay$$_(neg)(fr) : Fay$$_(pos)(fr);
        })();
      });
    };
  };
};
var Prelude$enumFromThenTo = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var to = $p3;
        var th = $p2;
        var fr = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$enumFromByTo)(fr))(Fay$$_(Fay$$_(Fay$$sub)(th))(fr)))(to);
      });
    };
  };
};
var Prelude$fromIntegral = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Fay$$fayToJs_int($p1));
  });
};
var Prelude$fromInteger = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Fay$$fayToJs_int($p1));
  });
};
var Prelude$not = function($p1){
  return new Fay$$$(function(){
    var p = $p1;
    return Fay$$_(p) ? false : true;
  });
};
var Prelude$otherwise = true;
var Prelude$show = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_string(JSON.stringify(Fay$$fayToJs(["automatic"],$p1)));
  });
};
var Prelude$error = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay(["unknown"],(function() { throw Fay$$fayToJs_string($p1) })());
  });
};
var Prelude$$_undefined = new Fay$$$(function(){
  return Fay$$_(Prelude$error)(Fay$$list("Prelude.undefined"));
});
var Prelude$either = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) instanceof $_Prelude$Left) {
          var a = Fay$$_($p3).slot1;
          var f = $p1;
          return Fay$$_(f)(a);
        }
        if (Fay$$_($p3) instanceof $_Prelude$Right) {
          var b = Fay$$_($p3).slot1;
          var g = $p2;
          return Fay$$_(g)(b);
        }
        throw ["unhandled case in either",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$until = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var x = $p3;
        var f = $p2;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? x : Fay$$_(Fay$$_(Fay$$_(Prelude$until)(p))(f))(Fay$$_(f)(x));
      });
    };
  };
};
var Prelude$$36$$33$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(Fay$$_(Fay$$seq)(x))(Fay$$_(f)(x));
    });
  };
};
var Prelude$$_const = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var a = $p1;
      return a;
    });
  };
};
var Prelude$id = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return x;
  });
};
var Prelude$$46$ = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var x = $p3;
        var g = $p2;
        var f = $p1;
        return Fay$$_(f)(Fay$$_(g)(x));
      });
    };
  };
};
var Prelude$$36$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(f)(x);
    });
  };
};
var Prelude$flip = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var y = $p3;
        var x = $p2;
        var f = $p1;
        return Fay$$_(Fay$$_(f)(y))(x);
      });
    };
  };
};
var Prelude$curry = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var y = $p3;
        var x = $p2;
        var f = $p1;
        return Fay$$_(f)(Fay$$list([x,y]));
      });
    };
  };
};
var Prelude$uncurry = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var p = $p2;
      var f = $p1;
      return (function($tmp1){
        if (Fay$$listLen(Fay$$_($tmp1),2)) {
          var x = Fay$$index(0,Fay$$_($tmp1));
          var y = Fay$$index(1,Fay$$_($tmp1));
          return Fay$$_(Fay$$_(f)(x))(y);
        }
        return (function(){ throw (["unhandled case",$tmp1]); })();
      })(p);
    });
  };
};
var Prelude$snd = function($p1){
  return new Fay$$$(function(){
    if (Fay$$listLen(Fay$$_($p1),2)) {
      var x = Fay$$index(1,Fay$$_($p1));
      return x;
    }
    throw ["unhandled case in snd",[$p1]];
  });
};
var Prelude$fst = function($p1){
  return new Fay$$$(function(){
    if (Fay$$listLen(Fay$$_($p1),2)) {
      var x = Fay$$index(0,Fay$$_($p1));
      return x;
    }
    throw ["unhandled case in fst",[$p1]];
  });
};
var Prelude$div = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$gt)(x))(0)))(Fay$$_(Fay$$_(Fay$$lt)(y))(0)))) {
        return Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Prelude$quot)(Fay$$_(Fay$$_(Fay$$sub)(x))(1)))(y)))(1);
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$lt)(x))(0)))(Fay$$_(Fay$$_(Fay$$gt)(y))(0)))) {
          return Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Prelude$quot)(Fay$$_(Fay$$_(Fay$$add)(x))(1)))(y)))(1);
        }
      }
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$quot)(x))(y);
    });
  };
};
var Prelude$mod = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$gt)(x))(0)))(Fay$$_(Fay$$_(Fay$$lt)(y))(0)))) {
        return Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Prelude$rem)(Fay$$_(Fay$$_(Fay$$sub)(x))(1)))(y)))(y)))(1);
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$lt)(x))(0)))(Fay$$_(Fay$$_(Fay$$gt)(y))(0)))) {
          return Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Prelude$rem)(Fay$$_(Fay$$_(Fay$$add)(x))(1)))(y)))(y)))(1);
        }
      }
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$rem)(x))(y);
    });
  };
};
var Prelude$divMod = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$gt)(x))(0)))(Fay$$_(Fay$$_(Fay$$lt)(y))(0)))) {
        return (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var q = Fay$$index(0,Fay$$_($tmp1));
            var r = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$sub)(q))(1),Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Fay$$add)(r))(y)))(1)]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Fay$$_(Prelude$quotRem)(Fay$$_(Fay$$_(Fay$$sub)(x))(1)))(y));
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$lt)(x))(0)))(Fay$$_(Fay$$_(Fay$$gt)(y))(1)))) {
          return (function($tmp1){
            if (Fay$$listLen(Fay$$_($tmp1),2)) {
              var q = Fay$$index(0,Fay$$_($tmp1));
              var r = Fay$$index(1,Fay$$_($tmp1));
              return Fay$$list([Fay$$_(Fay$$_(Fay$$sub)(q))(1),Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Fay$$add)(r))(y)))(1)]);
            }
            return (function(){ throw (["unhandled case",$tmp1]); })();
          })(Fay$$_(Fay$$_(Prelude$quotRem)(Fay$$_(Fay$$_(Fay$$add)(x))(1)))(y));
        }
      }
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$quotRem)(x))(y);
    });
  };
};
var Prelude$min = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["unknown"],Math.min(Fay$$_(Fay$$fayToJs(["unknown"],$p1)),Fay$$_(Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var Prelude$max = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["unknown"],Math.max(Fay$$_(Fay$$fayToJs(["unknown"],$p1)),Fay$$_(Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var Prelude$recip = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(1))(x);
  });
};
var Prelude$negate = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return (-(Fay$$_(x)));
  });
};
var Prelude$abs = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(0)) ? Fay$$_(Prelude$negate)(x) : x;
  });
};
var Prelude$signum = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(x))(0)) ? 1 : Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(x))(0)) ? 0 : (-(1));
  });
};
var Prelude$pi = new Fay$$$(function(){
  return Fay$$jsToFay_double(Math.PI);
});
var Prelude$exp = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.exp(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$sqrt = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.sqrt(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$log = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.log(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$$42$$42$ = new Fay$$$(function(){
  return Prelude$unsafePow;
});
var Prelude$$94$$94$ = new Fay$$$(function(){
  return Prelude$unsafePow;
});
var Prelude$unsafePow = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["unknown"],Math.pow(Fay$$_(Fay$$fayToJs(["unknown"],$p1)),Fay$$_(Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var Prelude$$94$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var b = $p2;
      var a = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(b))(0))) {
        return Fay$$_(Prelude$error)(Fay$$list("(^): negative exponent"));
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(b))(0))) {
          return 1;
        } else {if (Fay$$_(Fay$$_(Prelude$even)(b))) {
            return (function(){
              var x = new Fay$$$(function(){
                return Fay$$_(Fay$$_(Prelude$$94$)(a))(Fay$$_(Fay$$_(Prelude$quot)(b))(2));
              });
              return Fay$$_(Fay$$_(Fay$$mult)(x))(x);
            })();
          }
        }
      }
      var b = $p2;
      var a = $p1;
      return Fay$$_(Fay$$_(Fay$$mult)(a))(Fay$$_(Fay$$_(Prelude$$94$)(a))(Fay$$_(Fay$$_(Fay$$sub)(b))(1)));
    });
  };
};
var Prelude$logBase = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var b = $p1;
      return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Prelude$log)(x)))(Fay$$_(Prelude$log)(b));
    });
  };
};
var Prelude$sin = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.sin(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$tan = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.tan(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$cos = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.cos(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$asin = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.asin(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$atan = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.atan(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$acos = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.acos(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$sinh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Prelude$exp)(x)))(Fay$$_(Prelude$exp)((-(Fay$$_(x)))))))(2);
  });
};
var Prelude$tanh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return (function(){
      var a = new Fay$$$(function(){
        return Fay$$_(Prelude$exp)(x);
      });
      var b = new Fay$$$(function(){
        return Fay$$_(Prelude$exp)((-(Fay$$_(x))));
      });
      return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$sub)(a))(b)))(Fay$$_(Fay$$_(Fay$$add)(a))(b));
    })();
  });
};
var Prelude$cosh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Prelude$exp)(x)))(Fay$$_(Prelude$exp)((-(Fay$$_(x)))))))(2);
  });
};
var Prelude$asinh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Prelude$log)(Fay$$_(Fay$$_(Fay$$add)(x))(Fay$$_(Prelude$sqrt)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Prelude$$42$$42$)(x))(2)))(1))));
  });
};
var Prelude$atanh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Prelude$log)(Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$add)(1))(x)))(Fay$$_(Fay$$_(Fay$$sub)(1))(x)))))(2);
  });
};
var Prelude$acosh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Prelude$log)(Fay$$_(Fay$$_(Fay$$add)(x))(Fay$$_(Prelude$sqrt)(Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Prelude$$42$$42$)(x))(2)))(1))));
  });
};
var Prelude$properFraction = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return (function(){
      var a = new Fay$$$(function(){
        return Fay$$_(Prelude$truncate)(x);
      });
      return Fay$$list([a,Fay$$_(Fay$$_(Fay$$sub)(x))(Fay$$_(Prelude$fromIntegral)(a))]);
    })();
  });
};
var Prelude$truncate = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(0)) ? Fay$$_(Prelude$ceiling)(x) : Fay$$_(Prelude$floor)(x);
  });
};
var Prelude$round = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_int(Math.round(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$ceiling = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_int(Math.ceil(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$floor = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_int(Math.floor(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$subtract = new Fay$$$(function(){
  return Fay$$_(Prelude$flip)(Fay$$sub);
});
var Prelude$even = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$eq)(Fay$$_(Fay$$_(Prelude$rem)(x))(2)))(0);
  });
};
var Prelude$odd = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Prelude$not)(Fay$$_(Prelude$even)(x));
  });
};
var Prelude$gcd = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var b = $p2;
      var a = $p1;
      return (function(){
        var go = function($p1){
          return function($p2){
            return new Fay$$$(function(){
              if (Fay$$_($p2) === 0) {
                var x = $p1;
                return x;
              }
              var y = $p2;
              var x = $p1;
              return Fay$$_(Fay$$_(go)(y))(Fay$$_(Fay$$_(Prelude$rem)(x))(y));
            });
          };
        };
        return Fay$$_(Fay$$_(go)(Fay$$_(Prelude$abs)(a)))(Fay$$_(Prelude$abs)(b));
      })();
    });
  };
};
var Prelude$quot = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(y))(0)) ? Fay$$_(Prelude$error)(Fay$$list("Division by zero")) : Fay$$_(Fay$$_(Prelude$quot$39$)(x))(y);
    });
  };
};
var Prelude$quot$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay_int(~~(Fay$$fayToJs_int($p1)/Fay$$fayToJs_int($p2)));
    });
  };
};
var Prelude$quotRem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$list([Fay$$_(Fay$$_(Prelude$quot)(x))(y),Fay$$_(Fay$$_(Prelude$rem)(x))(y)]);
    });
  };
};
var Prelude$rem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(y))(0)) ? Fay$$_(Prelude$error)(Fay$$list("Division by zero")) : Fay$$_(Fay$$_(Prelude$rem$39$)(x))(y);
    });
  };
};
var Prelude$rem$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay_int(Fay$$fayToJs_int($p1) % Fay$$fayToJs_int($p2));
    });
  };
};
var Prelude$lcm = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === 0) {
        return 0;
      }
      if (Fay$$_($p1) === 0) {
        return 0;
      }
      var b = $p2;
      var a = $p1;
      return Fay$$_(Prelude$abs)(Fay$$_(Fay$$_(Fay$$mult)(Fay$$_(Fay$$_(Prelude$quot)(a))(Fay$$_(Fay$$_(Prelude$gcd)(a))(b))))(b));
    });
  };
};
var Prelude$find = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Prelude$Just)(x) : Fay$$_(Fay$$_(Prelude$find)(p))(xs);
      }
      if (Fay$$_($p2) === null) {
        return Prelude$Nothing;
      }
      throw ["unhandled case in find",[$p1,$p2]];
    });
  };
};
var Prelude$filter = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$filter)(p))(xs)) : Fay$$_(Fay$$_(Prelude$filter)(p))(xs);
      }
      if (Fay$$_($p2) === null) {
        return null;
      }
      throw ["unhandled case in filter",[$p1,$p2]];
    });
  };
};
var Prelude$$_null = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return true;
    }
    return false;
  });
};
var Prelude$map = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(f)(x)))(Fay$$_(Fay$$_(Prelude$map)(f))(xs));
      }
      throw ["unhandled case in map",[$p1,$p2]];
    });
  };
};
var Prelude$nub = function($p1){
  return new Fay$$$(function(){
    var ls = $p1;
    return Fay$$_(Fay$$_(Prelude$nub$39$)(ls))(null);
  });
};
var Prelude$nub$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p1) === null) {
        return null;
      }
      var ls = $p2;
      var $tmp1 = Fay$$_($p1);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$elem)(x))(ls)) ? Fay$$_(Fay$$_(Prelude$nub$39$)(xs))(ls) : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$nub$39$)(xs))(Fay$$_(Fay$$_(Fay$$cons)(x))(ls)));
      }
      throw ["unhandled case in nub'",[$p1,$p2]];
    });
  };
};
var Prelude$elem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var y = $tmp1.car;
        var ys = $tmp1.cdr;
        var x = $p1;
        return Fay$$_(Fay$$_(Fay$$or)(Fay$$_(Fay$$_(Fay$$eq)(x))(y)))(Fay$$_(Fay$$_(Prelude$elem)(x))(ys));
      }
      if (Fay$$_($p2) === null) {
        return false;
      }
      throw ["unhandled case in elem",[$p1,$p2]];
    });
  };
};
var Prelude$notElem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var ys = $p2;
      var x = $p1;
      return Fay$$_(Prelude$not)(Fay$$_(Fay$$_(Prelude$elem)(x))(ys));
    });
  };
};
var Prelude$sort = new Fay$$$(function(){
  return Fay$$_(Prelude$sortBy)(Prelude$compare);
});
var Prelude$sortBy = function($p1){
  return new Fay$$$(function(){
    var cmp = $p1;
    return Fay$$_(Fay$$_(Prelude$foldr)(Fay$$_(Prelude$insertBy)(cmp)))(null);
  });
};
var Prelude$insertBy = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var x = $p2;
          return Fay$$list([x]);
        }
        var ys = $p3;
        var x = $p2;
        var cmp = $p1;
        return (function($tmp1){
          if (Fay$$_($tmp1) === null) {
            return Fay$$list([x]);
          }
          var $tmp2 = Fay$$_($tmp1);
          if ($tmp2 instanceof Fay$$Cons) {
            var y = $tmp2.car;
            var ys$39$ = $tmp2.cdr;
            return (function($tmp2){
              if (Fay$$_($tmp2) instanceof $_Prelude$GT) {
                return Fay$$_(Fay$$_(Fay$$cons)(y))(Fay$$_(Fay$$_(Fay$$_(Prelude$insertBy)(cmp))(x))(ys$39$));
              }
              return Fay$$_(Fay$$_(Fay$$cons)(x))(ys);
            })(Fay$$_(Fay$$_(cmp)(x))(y));
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(ys);
      });
    };
  };
};
var Prelude$conc = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var ys = $p2;
      var $tmp1 = Fay$$_($p1);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$conc)(xs))(ys));
      }
      var ys = $p2;
      if (Fay$$_($p1) === null) {
        return ys;
      }
      throw ["unhandled case in conc",[$p1,$p2]];
    });
  };
};
var Prelude$concat = new Fay$$$(function(){
  return Fay$$_(Fay$$_(Prelude$foldr)(Prelude$conc))(null);
});
var Prelude$concatMap = function($p1){
  return new Fay$$$(function(){
    var f = $p1;
    return Fay$$_(Fay$$_(Prelude$foldr)(Fay$$_(Fay$$_(Prelude$$46$)(Prelude$$43$$43$))(f)))(null);
  });
};
var Prelude$foldr = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var z = $p2;
          return z;
        }
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var x = $tmp1.car;
          var xs = $tmp1.cdr;
          var z = $p2;
          var f = $p1;
          return Fay$$_(Fay$$_(f)(x))(Fay$$_(Fay$$_(Fay$$_(Prelude$foldr)(f))(z))(xs));
        }
        throw ["unhandled case in foldr",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$foldr1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$listLen(Fay$$_($p2),1)) {
        var x = Fay$$index(0,Fay$$_($p2));
        return x;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(f)(x))(Fay$$_(Fay$$_(Prelude$foldr1)(f))(xs));
      }
      if (Fay$$_($p2) === null) {
        return Fay$$_(Prelude$error)(Fay$$list("foldr1: empty list"));
      }
      throw ["unhandled case in foldr1",[$p1,$p2]];
    });
  };
};
var Prelude$foldl = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var z = $p2;
          return z;
        }
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var x = $tmp1.car;
          var xs = $tmp1.cdr;
          var z = $p2;
          var f = $p1;
          return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(f))(Fay$$_(Fay$$_(f)(z))(x)))(xs);
        }
        throw ["unhandled case in foldl",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$foldl1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(f))(x))(xs);
      }
      if (Fay$$_($p2) === null) {
        return Fay$$_(Prelude$error)(Fay$$list("foldl1: empty list"));
      }
      throw ["unhandled case in foldl1",[$p1,$p2]];
    });
  };
};
var Prelude$$43$$43$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$conc)(x))(y);
    });
  };
};
var Prelude$$33$$33$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var b = $p2;
      var a = $p1;
      return (function(){
        var go = function($p1){
          return function($p2){
            return new Fay$$$(function(){
              if (Fay$$_($p1) === null) {
                return Fay$$_(Prelude$error)(Fay$$list("(!!): index too large"));
              }
              if (Fay$$_($p2) === 0) {
                var $tmp1 = Fay$$_($p1);
                if ($tmp1 instanceof Fay$$Cons) {
                  var h = $tmp1.car;
                  return h;
                }
              }
              var n = $p2;
              var $tmp1 = Fay$$_($p1);
              if ($tmp1 instanceof Fay$$Cons) {
                var t = $tmp1.cdr;
                return Fay$$_(Fay$$_(go)(t))(Fay$$_(Fay$$_(Fay$$sub)(n))(1));
              }
              throw ["unhandled case in go",[$p1,$p2]];
            });
          };
        };
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(b))(0)) ? Fay$$_(Prelude$error)(Fay$$list("(!!): negative index")) : Fay$$_(Fay$$_(go)(a))(b);
      })();
    });
  };
};
var Prelude$head = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("head: empty list"));
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var h = $tmp1.car;
      return h;
    }
    throw ["unhandled case in head",[$p1]];
  });
};
var Prelude$tail = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("tail: empty list"));
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var t = $tmp1.cdr;
      return t;
    }
    throw ["unhandled case in tail",[$p1]];
  });
};
var Prelude$init = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("init: empty list"));
    }
    if (Fay$$listLen(Fay$$_($p1),1)) {
      var a = Fay$$index(0,Fay$$_($p1));
      return null;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var h = $tmp1.car;
      var t = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$cons)(h))(Fay$$_(Prelude$init)(t));
    }
    throw ["unhandled case in init",[$p1]];
  });
};
var Prelude$last = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("last: empty list"));
    }
    if (Fay$$listLen(Fay$$_($p1),1)) {
      var a = Fay$$index(0,Fay$$_($p1));
      return a;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var t = $tmp1.cdr;
      return Fay$$_(Prelude$last)(t);
    }
    throw ["unhandled case in last",[$p1]];
  });
};
var Prelude$iterate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$iterate)(f))(Fay$$_(f)(x)));
    });
  };
};
var Prelude$repeat = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Prelude$repeat)(x));
  });
};
var Prelude$replicate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p1) === 0) {
        return null;
      }
      var x = $p2;
      var n = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("replicate: negative length")) : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$replicate)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(x));
    });
  };
};
var Prelude$cycle = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("cycle: empty list"));
    }
    var xs = $p1;
    return (function(){
      var xs$39$ = new Fay$$$(function(){
        return Fay$$_(Fay$$_(Prelude$$43$$43$)(xs))(xs$39$);
      });
      return xs$39$;
    })();
  });
};
var Prelude$take = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p1) === 0) {
        return null;
      }
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var n = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("take: negative length")) : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$take)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(xs));
      }
      throw ["unhandled case in take",[$p1,$p2]];
    });
  };
};
var Prelude$drop = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var xs = $p2;
      if (Fay$$_($p1) === 0) {
        return xs;
      }
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var xs = $tmp1.cdr;
        var n = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("drop: negative length")) : Fay$$_(Fay$$_(Prelude$drop)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(xs);
      }
      throw ["unhandled case in drop",[$p1,$p2]];
    });
  };
};
var Prelude$splitAt = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var xs = $p2;
      if (Fay$$_($p1) === 0) {
        return Fay$$list([null,xs]);
      }
      if (Fay$$_($p2) === null) {
        return Fay$$list([null,null]);
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var n = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("splitAt: negative length")) : (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var a = Fay$$index(0,Fay$$_($tmp1));
            var b = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(a),b]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Fay$$_(Prelude$splitAt)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(xs));
      }
      throw ["unhandled case in splitAt",[$p1,$p2]];
    });
  };
};
var Prelude$takeWhile = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$takeWhile)(p))(xs)) : null;
      }
      throw ["unhandled case in takeWhile",[$p1,$p2]];
    });
  };
};
var Prelude$dropWhile = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Fay$$_(Prelude$dropWhile)(p))(xs) : Fay$$_(Fay$$_(Fay$$cons)(x))(xs);
      }
      throw ["unhandled case in dropWhile",[$p1,$p2]];
    });
  };
};
var Prelude$span = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return Fay$$list([null,null]);
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var a = Fay$$index(0,Fay$$_($tmp1));
            var b = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(a),b]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Fay$$_(Prelude$span)(p))(xs)) : Fay$$list([null,Fay$$_(Fay$$_(Fay$$cons)(x))(xs)]);
      }
      throw ["unhandled case in span",[$p1,$p2]];
    });
  };
};
var Prelude$$_break = function($p1){
  return new Fay$$$(function(){
    var p = $p1;
    return Fay$$_(Prelude$span)(Fay$$_(Fay$$_(Prelude$$46$)(Prelude$not))(p));
  });
};
var Prelude$zipWith = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var b = $tmp1.car;
          var bs = $tmp1.cdr;
          var $tmp1 = Fay$$_($p2);
          if ($tmp1 instanceof Fay$$Cons) {
            var a = $tmp1.car;
            var as = $tmp1.cdr;
            var f = $p1;
            return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(f)(a))(b)))(Fay$$_(Fay$$_(Fay$$_(Prelude$zipWith)(f))(as))(bs));
          }
        }
        return null;
      });
    };
  };
};
var Prelude$zipWith3 = function($p1){
  return function($p2){
    return function($p3){
      return function($p4){
        return new Fay$$$(function(){
          var $tmp1 = Fay$$_($p4);
          if ($tmp1 instanceof Fay$$Cons) {
            var c = $tmp1.car;
            var cs = $tmp1.cdr;
            var $tmp1 = Fay$$_($p3);
            if ($tmp1 instanceof Fay$$Cons) {
              var b = $tmp1.car;
              var bs = $tmp1.cdr;
              var $tmp1 = Fay$$_($p2);
              if ($tmp1 instanceof Fay$$Cons) {
                var a = $tmp1.car;
                var as = $tmp1.cdr;
                var f = $p1;
                return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(Fay$$_(f)(a))(b))(c)))(Fay$$_(Fay$$_(Fay$$_(Fay$$_(Prelude$zipWith3)(f))(as))(bs))(cs));
              }
            }
          }
          return null;
        });
      };
    };
  };
};
var Prelude$zip = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var b = $tmp1.car;
        var bs = $tmp1.cdr;
        var $tmp1 = Fay$$_($p1);
        if ($tmp1 instanceof Fay$$Cons) {
          var a = $tmp1.car;
          var as = $tmp1.cdr;
          return Fay$$_(Fay$$_(Fay$$cons)(Fay$$list([a,b])))(Fay$$_(Fay$$_(Prelude$zip)(as))(bs));
        }
      }
      return null;
    });
  };
};
var Prelude$zip3 = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var c = $tmp1.car;
          var cs = $tmp1.cdr;
          var $tmp1 = Fay$$_($p2);
          if ($tmp1 instanceof Fay$$Cons) {
            var b = $tmp1.car;
            var bs = $tmp1.cdr;
            var $tmp1 = Fay$$_($p1);
            if ($tmp1 instanceof Fay$$Cons) {
              var a = $tmp1.car;
              var as = $tmp1.cdr;
              return Fay$$_(Fay$$_(Fay$$cons)(Fay$$list([a,b,c])))(Fay$$_(Fay$$_(Fay$$_(Prelude$zip3)(as))(bs))(cs));
            }
          }
        }
        return null;
      });
    };
  };
};
var Prelude$unzip = function($p1){
  return new Fay$$$(function(){
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      if (Fay$$listLen(Fay$$_($tmp1.car),2)) {
        var x = Fay$$index(0,Fay$$_($tmp1.car));
        var y = Fay$$index(1,Fay$$_($tmp1.car));
        var ps = $tmp1.cdr;
        return (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var xs = Fay$$index(0,Fay$$_($tmp1));
            var ys = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(xs),Fay$$_(Fay$$_(Fay$$cons)(y))(ys)]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Prelude$unzip)(ps));
      }
    }
    if (Fay$$_($p1) === null) {
      return Fay$$list([null,null]);
    }
    throw ["unhandled case in unzip",[$p1]];
  });
};
var Prelude$unzip3 = function($p1){
  return new Fay$$$(function(){
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      if (Fay$$listLen(Fay$$_($tmp1.car),3)) {
        var x = Fay$$index(0,Fay$$_($tmp1.car));
        var y = Fay$$index(1,Fay$$_($tmp1.car));
        var z = Fay$$index(2,Fay$$_($tmp1.car));
        var ps = $tmp1.cdr;
        return (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),3)) {
            var xs = Fay$$index(0,Fay$$_($tmp1));
            var ys = Fay$$index(1,Fay$$_($tmp1));
            var zs = Fay$$index(2,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(xs),Fay$$_(Fay$$_(Fay$$cons)(y))(ys),Fay$$_(Fay$$_(Fay$$cons)(z))(zs)]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Prelude$unzip3)(ps));
      }
    }
    if (Fay$$_($p1) === null) {
      return Fay$$list([null,null,null]);
    }
    throw ["unhandled case in unzip3",[$p1]];
  });
};
var Prelude$lines = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return null;
    }
    var s = $p1;
    return (function(){
      var isLineBreak = function($p1){
        return new Fay$$$(function(){
          var c = $p1;
          return Fay$$_(Fay$$_(Fay$$or)(Fay$$_(Fay$$_(Fay$$eq)(c))("\r")))(Fay$$_(Fay$$_(Fay$$eq)(c))("\n"));
        });
      };
      return (function($tmp1){
        if (Fay$$listLen(Fay$$_($tmp1),2)) {
          var a = Fay$$index(0,Fay$$_($tmp1));
          if (Fay$$_(Fay$$index(1,Fay$$_($tmp1))) === null) {
            return Fay$$list([a]);
          }
          var a = Fay$$index(0,Fay$$_($tmp1));
          var $tmp2 = Fay$$_(Fay$$index(1,Fay$$_($tmp1)));
          if ($tmp2 instanceof Fay$$Cons) {
            var cs = $tmp2.cdr;
            return Fay$$_(Fay$$_(Fay$$cons)(a))(Fay$$_(Prelude$lines)(cs));
          }
        }
        return (function(){ throw (["unhandled case",$tmp1]); })();
      })(Fay$$_(Fay$$_(Prelude$$_break)(isLineBreak))(s));
    })();
  });
};
var Prelude$unlines = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return null;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var l = $tmp1.car;
      var ls = $tmp1.cdr;
      return Fay$$_(Fay$$_(Prelude$$43$$43$)(l))(Fay$$_(Fay$$_(Fay$$cons)("\n"))(Fay$$_(Prelude$unlines)(ls)));
    }
    throw ["unhandled case in unlines",[$p1]];
  });
};
var Prelude$words = function($p1){
  return new Fay$$$(function(){
    var str = $p1;
    return (function(){
      var words$39$ = function($p1){
        return new Fay$$$(function(){
          if (Fay$$_($p1) === null) {
            return null;
          }
          var s = $p1;
          return (function($tmp1){
            if (Fay$$listLen(Fay$$_($tmp1),2)) {
              var a = Fay$$index(0,Fay$$_($tmp1));
              var b = Fay$$index(1,Fay$$_($tmp1));
              return Fay$$_(Fay$$_(Fay$$cons)(a))(Fay$$_(Prelude$words)(b));
            }
            return (function(){ throw (["unhandled case",$tmp1]); })();
          })(Fay$$_(Fay$$_(Prelude$$_break)(isSpace))(s));
        });
      };
      var isSpace = function($p1){
        return new Fay$$$(function(){
          var c = $p1;
          return Fay$$_(Fay$$_(Prelude$elem)(c))(Fay$$list(" \t\r\n\u000c\u000b"));
        });
      };
      return Fay$$_(words$39$)(Fay$$_(Fay$$_(Prelude$dropWhile)(isSpace))(str));
    })();
  });
};
var Prelude$unwords = new Fay$$$(function(){
  return Fay$$_(Prelude$intercalate)(Fay$$list(" "));
});
var Prelude$and = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return true;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var x = $tmp1.car;
      var xs = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$and)(x))(Fay$$_(Prelude$and)(xs));
    }
    throw ["unhandled case in and",[$p1]];
  });
};
var Prelude$or = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return false;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var x = $tmp1.car;
      var xs = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$or)(x))(Fay$$_(Prelude$or)(xs));
    }
    throw ["unhandled case in or",[$p1]];
  });
};
var Prelude$any = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return false;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(Fay$$or)(Fay$$_(p)(x)))(Fay$$_(Fay$$_(Prelude$any)(p))(xs));
      }
      throw ["unhandled case in any",[$p1,$p2]];
    });
  };
};
var Prelude$all = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return true;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(Fay$$and)(Fay$$_(p)(x)))(Fay$$_(Fay$$_(Prelude$all)(p))(xs));
      }
      throw ["unhandled case in all",[$p1,$p2]];
    });
  };
};
var Prelude$intersperse = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var sep = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$prependToAll)(sep))(xs));
      }
      throw ["unhandled case in intersperse",[$p1,$p2]];
    });
  };
};
var Prelude$prependToAll = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var sep = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(sep))(Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$prependToAll)(sep))(xs)));
      }
      throw ["unhandled case in prependToAll",[$p1,$p2]];
    });
  };
};
var Prelude$intercalate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var xss = $p2;
      var xs = $p1;
      return Fay$$_(Prelude$concat)(Fay$$_(Fay$$_(Prelude$intersperse)(xs))(xss));
    });
  };
};
var Prelude$maximum = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("maximum: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Prelude$foldl1)(Prelude$max))(xs);
  });
};
var Prelude$minimum = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("minimum: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Prelude$foldl1)(Prelude$min))(xs);
  });
};
var Prelude$product = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("product: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(Fay$$mult))(1))(xs);
  });
};
var Prelude$sum = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("sum: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(Fay$$add))(0))(xs);
  });
};
var Prelude$scanl = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var l = $p3;
        var z = $p2;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(z))((function($tmp1){
          if (Fay$$_($tmp1) === null) {
            return null;
          }
          var $tmp2 = Fay$$_($tmp1);
          if ($tmp2 instanceof Fay$$Cons) {
            var x = $tmp2.car;
            var xs = $tmp2.cdr;
            return Fay$$_(Fay$$_(Fay$$_(Prelude$scanl)(f))(Fay$$_(Fay$$_(f)(z))(x)))(xs);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(l));
      });
    };
  };
};
var Prelude$scanl1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$scanl)(f))(x))(xs);
      }
      throw ["unhandled case in scanl1",[$p1,$p2]];
    });
  };
};
var Prelude$scanr = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var z = $p2;
          return Fay$$list([z]);
        }
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var x = $tmp1.car;
          var xs = $tmp1.cdr;
          var z = $p2;
          var f = $p1;
          return (function($tmp1){
            var $tmp2 = Fay$$_($tmp1);
            if ($tmp2 instanceof Fay$$Cons) {
              var h = $tmp2.car;
              var t = $tmp2.cdr;
              return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(f)(x))(h)))(Fay$$_(Fay$$_(Fay$$cons)(h))(t));
            }
            return Prelude$$_undefined;
          })(Fay$$_(Fay$$_(Fay$$_(Prelude$scanr)(f))(z))(xs));
        }
        throw ["unhandled case in scanr",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$scanr1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      if (Fay$$listLen(Fay$$_($p2),1)) {
        var x = Fay$$index(0,Fay$$_($p2));
        return Fay$$list([x]);
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return (function($tmp1){
          var $tmp2 = Fay$$_($tmp1);
          if ($tmp2 instanceof Fay$$Cons) {
            var h = $tmp2.car;
            var t = $tmp2.cdr;
            return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(f)(x))(h)))(Fay$$_(Fay$$_(Fay$$cons)(h))(t));
          }
          return Prelude$$_undefined;
        })(Fay$$_(Fay$$_(Prelude$scanr1)(f))(xs));
      }
      throw ["unhandled case in scanr1",[$p1,$p2]];
    });
  };
};
var Prelude$lookup = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        var _key = $p1;
        return Prelude$Nothing;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        if (Fay$$listLen(Fay$$_($tmp1.car),2)) {
          var x = Fay$$index(0,Fay$$_($tmp1.car));
          var y = Fay$$index(1,Fay$$_($tmp1.car));
          var xys = $tmp1.cdr;
          var key = $p1;
          return Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(key))(x)) ? Fay$$_(Prelude$Just)(y) : Fay$$_(Fay$$_(Prelude$lookup)(key))(xys);
        }
      }
      throw ["unhandled case in lookup",[$p1,$p2]];
    });
  };
};
var Prelude$length = function($p1){
  return new Fay$$$(function(){
    var xs = $p1;
    return Fay$$_(Fay$$_(Prelude$length$39$)(0))(xs);
  });
};
var Prelude$length$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var xs = $tmp1.cdr;
        var acc = $p1;
        return Fay$$_(Fay$$_(Prelude$length$39$)(Fay$$_(Fay$$_(Fay$$add)(acc))(1)))(xs);
      }
      var acc = $p1;
      return acc;
    });
  };
};
var Prelude$reverse = function($p1){
  return new Fay$$$(function(){
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var x = $tmp1.car;
      var xs = $tmp1.cdr;
      return Fay$$_(Fay$$_(Prelude$$43$$43$)(Fay$$_(Prelude$reverse)(xs)))(Fay$$list([x]));
    }
    if (Fay$$_($p1) === null) {
      return null;
    }
    throw ["unhandled case in reverse",[$p1]];
  });
};
var Prelude$print = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],(function(x) { if (console && console.log) console.log(x) })(Fay$$fayToJs(["automatic"],$p1))));
  });
};
var Prelude$putStrLn = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],(function(x) { if (console && console.log) console.log(x) })(Fay$$fayToJs_string($p1))));
  });
};
var JQuery$emptyCallback = new Fay$$$(function(){
  return Fay$$_(Fay$$_(Prelude$$36$)(Prelude$$_const))(Fay$$_(Fay$$$_return)(Fay$$unit));
});
var JQuery$ajax = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var err = $p3;
        var succ = $p2;
        var ur = $p1;
        return Fay$$_(Fay$$_(Prelude$$36$)(JQuery$ajax$39$))((function(){
          var $36$_record_to_update = Object.create(Fay$$_(JQuery$defaultAjaxSettings));
          $36$_record_to_update.success = Fay$$_(Language$Fay$FFI$Defined)(succ);
          $36$_record_to_update.data$39$ = Language$Fay$FFI$Undefined;
          $36$_record_to_update.error$39$ = Fay$$_(Language$Fay$FFI$Defined)(err);
          $36$_record_to_update.url = Fay$$_(Language$Fay$FFI$Defined)(ur);
          return $36$_record_to_update;
        })());
      });
    };
  };
};
var JQuery$ajaxPost = function($p1){
  return function($p2){
    return function($p3){
      return function($p4){
        return new Fay$$$(function(){
          var err = $p4;
          var succ = $p3;
          var dat = $p2;
          var ur = $p1;
          return Fay$$_(Fay$$_(Prelude$$36$)(JQuery$ajax$39$))((function(){
            var $36$_record_to_update = Object.create(Fay$$_(JQuery$defaultAjaxSettings));
            $36$_record_to_update.success = Fay$$_(Language$Fay$FFI$Defined)(succ);
            $36$_record_to_update.data$39$ = Fay$$_(Language$Fay$FFI$Defined)(dat);
            $36$_record_to_update.error$39$ = Fay$$_(Language$Fay$FFI$Defined)(err);
            $36$_record_to_update.url = Fay$$_(Language$Fay$FFI$Defined)(ur);
            $36$_record_to_update.type$39$ = Fay$$_(Language$Fay$FFI$Defined)(Fay$$list("POST"));
            $36$_record_to_update.processData = Fay$$_(Language$Fay$FFI$Defined)(false);
            $36$_record_to_update.contentType = Fay$$_(Language$Fay$FFI$Defined)(Fay$$list("text/json"));
            $36$_record_to_update.dataType = Fay$$_(Language$Fay$FFI$Defined)(Fay$$list("json"));
            return $36$_record_to_update;
          })());
        });
      };
    };
  };
};
var JQuery$ajaxPostParam = function($p1){
  return function($p2){
    return function($p3){
      return function($p4){
        return function($p5){
          return new Fay$$$(function(){
            var err = $p5;
            var succ = $p4;
            var dat = $p3;
            var rqparam = $p2;
            var ur = $p1;
            return Fay$$_(Fay$$_(Prelude$$36$)(JQuery$ajax$39$))((function(){
              var $36$_record_to_update = Object.create(Fay$$_(JQuery$defaultAjaxSettings));
              $36$_record_to_update.success = Fay$$_(Language$Fay$FFI$Defined)(succ);
              $36$_record_to_update.data$39$ = Fay$$_(Fay$$_(Prelude$$36$)(Language$Fay$FFI$Defined))(Fay$$_(Fay$$_(JQuery$makeRqObj)(rqparam))(dat));
              $36$_record_to_update.error$39$ = Fay$$_(Language$Fay$FFI$Defined)(err);
              $36$_record_to_update.url = Fay$$_(Language$Fay$FFI$Defined)(ur);
              $36$_record_to_update.type$39$ = Fay$$_(Language$Fay$FFI$Defined)(Fay$$list("POST"));
              $36$_record_to_update.processData = Fay$$_(Language$Fay$FFI$Defined)(false);
              $36$_record_to_update.contentType = Fay$$_(Language$Fay$FFI$Defined)(Fay$$list("text/json"));
              $36$_record_to_update.dataType = Fay$$_(Language$Fay$FFI$Defined)(Fay$$list("json"));
              return $36$_record_to_update;
            })());
          });
        };
      };
    };
  };
};
var JQuery$makeRqObj = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["user","Object",[]],(function () { var o = {}; o[Fay$$fayToJs_string($p1)] = Fay$$fayToJs(["unknown"],$p2); return o; })());
    });
  };
};
var JQuery$AjaxSettings = function(accepts){
  return function(async){
    return function(beforeSend){
      return function(cache){
        return function(complete){
          return function(contentType){
            return function(crossDomain){
              return function(data$39$){
                return function(dataType){
                  return function(error$39$){
                    return function($_global){
                      return function(ifModified){
                        return function(isLocal){
                          return function(mimeType){
                            return function(password){
                              return function(processData){
                                return function(success){
                                  return function(timeout){
                                    return function(type$39$){
                                      return function(url){
                                        return function(username){
                                          return new Fay$$$(function(){
                                            return new $_JQuery$AjaxSettings(accepts,async,beforeSend,cache,complete,contentType,crossDomain,data$39$,dataType,error$39$,$_global,ifModified,isLocal,mimeType,password,processData,success,timeout,type$39$,url,username);
                                          });
                                        };
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
};
var JQuery$accepts = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).accepts;
  });
};
var JQuery$async = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).async;
  });
};
var JQuery$beforeSend = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).beforeSend;
  });
};
var JQuery$cache = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).cache;
  });
};
var JQuery$complete = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).complete;
  });
};
var JQuery$contentType = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).contentType;
  });
};
var JQuery$crossDomain = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).crossDomain;
  });
};
var JQuery$data$39$ = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).data$39$;
  });
};
var JQuery$dataType = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).dataType;
  });
};
var JQuery$error$39$ = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).error$39$;
  });
};
var JQuery$$_global = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).$_global;
  });
};
var JQuery$ifModified = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).ifModified;
  });
};
var JQuery$isLocal = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).isLocal;
  });
};
var JQuery$mimeType = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).mimeType;
  });
};
var JQuery$password = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).password;
  });
};
var JQuery$processData = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).processData;
  });
};
var JQuery$success = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).success;
  });
};
var JQuery$timeout = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).timeout;
  });
};
var JQuery$type$39$ = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).type$39$;
  });
};
var JQuery$url = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).url;
  });
};
var JQuery$username = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x).username;
  });
};
var JQuery$defaultAjaxSettings = new Fay$$$(function(){
  var AjaxSettings = new $_JQuery$AjaxSettings();
  AjaxSettings.accepts = Language$Fay$FFI$Undefined;
  AjaxSettings.async = Language$Fay$FFI$Undefined;
  AjaxSettings.beforeSend = Language$Fay$FFI$Undefined;
  AjaxSettings.cache = Language$Fay$FFI$Undefined;
  AjaxSettings.complete = Language$Fay$FFI$Undefined;
  AjaxSettings.contentType = Language$Fay$FFI$Undefined;
  AjaxSettings.crossDomain = Language$Fay$FFI$Undefined;
  AjaxSettings.data$39$ = Language$Fay$FFI$Undefined;
  AjaxSettings.dataType = Language$Fay$FFI$Undefined;
  AjaxSettings.error$39$ = Language$Fay$FFI$Undefined;
  AjaxSettings.$_global = Language$Fay$FFI$Undefined;
  AjaxSettings.ifModified = Language$Fay$FFI$Undefined;
  AjaxSettings.isLocal = Language$Fay$FFI$Undefined;
  AjaxSettings.mimeType = Language$Fay$FFI$Undefined;
  AjaxSettings.password = Language$Fay$FFI$Undefined;
  AjaxSettings.processData = Language$Fay$FFI$Undefined;
  AjaxSettings.success = Language$Fay$FFI$Undefined;
  AjaxSettings.timeout = Language$Fay$FFI$Undefined;
  AjaxSettings.type$39$ = Language$Fay$FFI$Undefined;
  AjaxSettings.url = Language$Fay$FFI$Undefined;
  AjaxSettings.username = Language$Fay$FFI$Undefined;
  return AjaxSettings;
});
var JQuery$ajax$39$ = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"], (function (o) {  delete o['instance'];  for (var p in o) {  if (/\$39\$/.test(p)) {  o[p.replace(/\$39\$/g, '')] = o[p];  delete o[p];  }  }  console.log(o);  return jQuery.ajax(o);  })(Fay$$fayToJs(["user","AjaxSettings",[["automatic"],["automatic"]]],$p1))));
  });
};
var JQuery$addClass = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['addClass'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$addClassWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['addClass'](Fay$$fayToJs(["function",[["double"],["string"],["action",[["string"]]]]],$p1))));
    });
  };
};
var JQuery$getAttr = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","JQuery",[]],$p2)['attr'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$setAttr = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['attr'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$setAttrWith = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['attr'](Fay$$fayToJs_string($p1), Fay$$fayToJs(["function",[["double"],["string"],["action",[["string"]]]]],$p2))));
      });
    };
  };
};
var JQuery$hasClass = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay_bool(Fay$$fayToJs(["user","JQuery",[]],$p2)['hasClass'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$getHtml = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","JQuery",[]],$p1)['html']()));
  });
};
var JQuery$setHtml = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['html'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$setHtmlWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['html'](Fay$$fayToJs(["function",[["double"],["string"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$getProp = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","JQuery",[]],$p2)['prop'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$setProp = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['prop'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$setPropWith = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['prop'](Fay$$fayToJs_string($p1), Fay$$fayToJs(["function",[["double"],["string"],["action",[["string"]]]]],$p2))));
      });
    };
  };
};
var JQuery$removeAttr = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['removeAttr'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$removeClass = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['removeClass'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$removeClassWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['removeClass'](Fay$$fayToJs(["function",[["double"],["string"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$removeProp = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['removeProp'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$toggleClass = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['toggleClass'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$toggleClassBool = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['toggleClass'](Fay$$fayToJs_string($p1), Fay$$fayToJs_bool($p2))));
      });
    };
  };
};
var JQuery$toggleAllClasses = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['toggleClass'](Fay$$fayToJs_bool($p1))));
    });
  };
};
var JQuery$toggleClassWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['toggleClass'](Fay$$fayToJs(["function",[["double"],["string"],["bool"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$toggleClassBoolWith = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['toggleClass'](Fay$$fayToJs(["function",[["double"],["string"],["bool"],["action",[["user","JQuery",[]]]]]],$p1), Fay$$fayToJs_bool($p2))));
      });
    };
  };
};
var JQuery$getVal = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","JQuery",[]],$p1)['val']()));
  });
};
var JQuery$setVal = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['val'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$setValWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['val'](Fay$$fayToJs(["function",[["double"],["string"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$setText = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['text'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$setTextWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['text'](Fay$$fayToJs(["function",[["double"],["string"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$getText = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","JQuery",[]],$p1)['text']()));
  });
};
var JQuery$holdReady = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery['holdReady'](Fay$$fayToJs_bool($p1))));
  });
};
var JQuery$selectElement = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery(Fay$$fayToJs(["user","Element",[]],$p1))));
  });
};
var JQuery$selectObject = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery(Fay$$fayToJs(["unknown"],$p1))));
  });
};
var JQuery$select = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery(Fay$$fayToJs_string($p1))));
  });
};
var JQuery$selectEmpty = new Fay$$$(function(){
  return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery()));
});
var JQuery$createJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery(Fay$$fayToJs_string($p1), Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var JQuery$ready = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],jQuery(Fay$$fayToJs(["action",[["unknown"]]],$p1))));
  });
};
var JQuery$noConflict = new Fay$$$(function(){
  return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery['noConflict']()));
});
var JQuery$noConflictBool = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],jQuery['noConflict'](Fay$$fayToJs_bool($p1))));
  });
};
var JQuery$getCss = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","JQuery",[]],$p2)['css'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$setCss = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['css'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$setCssWith = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['css'](Fay$$fayToJs_string($p1), Fay$$fayToJs(["function",[["double"],["string"],["action",[["string"]]]]],$p2))));
      });
    };
  };
};
var JQuery$getHeight = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['height']()));
  });
};
var JQuery$setHeight = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['height'](Fay$$fayToJs_double($p1))));
    });
  };
};
var JQuery$setHeightWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['height'](Fay$$fayToJs(["function",[["double"],["double"],["action",[["double"]]]]],$p1))));
    });
  };
};
var JQuery$getInnerHeight = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['innerHeight']()));
  });
};
var JQuery$getInnerWidth = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['innerWidth']()));
  });
};
var JQuery$getOuterHeight = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['outerHeight']()));
  });
};
var JQuery$getOuterHeightBool = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p2)['outerHeight'](Fay$$fayToJs_bool($p1))));
    });
  };
};
var JQuery$getOuterWidth = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['outerWidth']()));
  });
};
var JQuery$getOuterWidthBool = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p2)['outerWidth'](Fay$$fayToJs_bool($p1))));
    });
  };
};
var JQuery$getScrollLeft = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['scrollLeft']()));
  });
};
var JQuery$setScrollLeft = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['scrollLeft'](Fay$$fayToJs_double($p1))));
    });
  };
};
var JQuery$getScrollTop = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['scrollTop']()));
  });
};
var JQuery$setScrollTop = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['scrollTop'](Fay$$fayToJs_double($p1))));
    });
  };
};
var JQuery$getWidth = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","JQuery",[]],$p1)['width']()));
  });
};
var JQuery$setWidth = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['width'](Fay$$fayToJs_double($p1))));
    });
  };
};
var JQuery$setWidthWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['width'](Fay$$fayToJs(["function",[["double"],["double"],["action",[["double"]]]]],$p1))));
    });
  };
};
var JQuery$Show = new Fay$$$(function(){
  return new $_JQuery$Show();
});
var JQuery$Hide = new Fay$$$(function(){
  return new $_JQuery$Hide();
});
var JQuery$Toggle = new Fay$$$(function(){
  return new $_JQuery$Toggle();
});
var JQuery$FadeIn = new Fay$$$(function(){
  return new $_JQuery$FadeIn();
});
var JQuery$FadeOut = new Fay$$$(function(){
  return new $_JQuery$FadeOut();
});
var JQuery$FadeToggle = new Fay$$$(function(){
  return new $_JQuery$FadeToggle();
});
var JQuery$Instantly = new Fay$$$(function(){
  return new $_JQuery$Instantly();
});
var JQuery$Slow = new Fay$$$(function(){
  return new $_JQuery$Slow();
});
var JQuery$Fast = new Fay$$$(function(){
  return new $_JQuery$Fast();
});
var JQuery$Speed = function(slot1){
  return new Fay$$$(function(){
    return new $_JQuery$Speed(slot1);
  });
};
var JQuery$Animation = function(_type){
  return function(_speed){
    return function(_nextAnimation){
      return function(_element){
        return new Fay$$$(function(){
          return new $_JQuery$Animation(_type,_speed,_nextAnimation,_element);
        });
      };
    };
  };
};
var JQuery$_type = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x)._type;
  });
};
var JQuery$_speed = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x)._speed;
  });
};
var JQuery$_nextAnimation = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x)._nextAnimation;
  });
};
var JQuery$_element = function(x){
  return new Fay$$$(function(){
    return Fay$$_(x)._element;
  });
};
var JQuery$anim = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var el = $p2;
      var ty = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$_(JQuery$Animation)(ty))(JQuery$Fast))(Prelude$Nothing))(el);
    });
  };
};
var JQuery$speed = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var anim = $p2;
      var spd = $p1;
      return (function(){
        var $36$_record_to_update = Object.create(Fay$$_(anim));
        $36$_record_to_update._speed = spd;
        return $36$_record_to_update;
      })();
    });
  };
};
var JQuery$chainAnim = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var a2 = $p2;
      var a1 = $p1;
      return (function(){
        var $36$_record_to_update = Object.create(Fay$$_(a1));
        $36$_record_to_update._nextAnimation = Fay$$_(Prelude$Just)(a2);
        return $36$_record_to_update;
      })();
    });
  };
};
var JQuery$chainAnims = function($p1){
  return new Fay$$$(function(){
    if (Fay$$listLen(Fay$$_($p1),1)) {
      var a = Fay$$index(0,Fay$$_($p1));
      return a;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var a = $tmp1.car;
      var as = $tmp1.cdr;
      return Fay$$_(Fay$$_(JQuery$chainAnim)(a))(Fay$$_(JQuery$chainAnims)(as));
    }
    throw ["unhandled case in chainAnims",[$p1]];
  });
};
var JQuery$runAnimation = function($p1){
  return new Fay$$$(function(){
    var a = $p1;
    return (function(){
      var cb = new Fay$$$(function(){
        return (function($tmp1){
          if (Fay$$_($tmp1) instanceof $_Prelude$Just) {
            var a2 = Fay$$_($tmp1).slot1;
            return Fay$$_(Prelude$$_const)(Fay$$_(JQuery$runAnimation)(a2));
          }
          if (Fay$$_($tmp1) instanceof $_Prelude$Nothing) {
            return Fay$$_(Prelude$$_const)(Fay$$_(Fay$$$_return)(Fay$$unit));
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(JQuery$_nextAnimation)(a));
      });
      return Fay$$_(Fay$$_(Fay$$then)(Fay$$_(Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(Fay$$_(JQuery$_type)(a)))(Fay$$_(JQuery$_speed)(a)))(cb))(Fay$$_(JQuery$_element)(a))))(Fay$$_(Fay$$$_return)(Fay$$unit));
    })();
  });
};
var JQuery$animate = function($p1){
  return function($p2){
    return function($p3){
      return function($p4){
        return new Fay$$$(function(){
          return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p4)[(function () {  switch (Fay$$fayToJs(["user","AnimationType",[]],$p1)['instance']) {  case 'FadeIn': return 'fadeIn';  case 'FadeOut': return 'fadeOut';  case 'FadeToggle': return 'fadeToggle';  default: return Fay$$fayToJs(["user","AnimationType",[]],$p1)['instance']['toLowerCase']();  }  })()]((function () {  if (Fay$$fayToJs(["user","Speed",[]],$p2)['instance'] == 'Slow') {  return 'slow';  } else if (Fay$$fayToJs(["user","Speed",[]],$p2)['instance'] == 'Instantly') {  return null;  } else if (Fay$$fayToJs(["user","Speed",[]],$p2)['instance'] == 'Fast') {  return 'fast';  } else {  return Fay$$fayToJs(["user","Speed",[]],$p2)['slot1'];  }  })(), function() {  Fay$$fayToJs(["function",[["user","JQuery",[]],["action",[["unknown"]]]]],$p3)(jQuery(this));  })));
        });
      };
    };
  };
};
var JQuery$hide = function($p1){
  return new Fay$$$(function(){
    var spd = $p1;
    return Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(JQuery$Hide))(spd))(JQuery$emptyCallback);
  });
};
var JQuery$unhide = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['show']()));
  });
};
var JQuery$jshow = function($p1){
  return new Fay$$$(function(){
    var spd = $p1;
    return Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(JQuery$Show))(spd))(JQuery$emptyCallback);
  });
};
var JQuery$toggle = function($p1){
  return new Fay$$$(function(){
    var spd = $p1;
    return Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(JQuery$Toggle))(spd))(JQuery$emptyCallback);
  });
};
var JQuery$fadeIn = function($p1){
  return new Fay$$$(function(){
    var spd = $p1;
    return Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(JQuery$FadeIn))(spd))(JQuery$emptyCallback);
  });
};
var JQuery$fadeOut = function($p1){
  return new Fay$$$(function(){
    var spd = $p1;
    return Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(JQuery$FadeOut))(spd))(JQuery$emptyCallback);
  });
};
var JQuery$fadeToggle = function($p1){
  return new Fay$$$(function(){
    var spd = $p1;
    return Fay$$_(Fay$$_(Fay$$_(JQuery$animate)(JQuery$FadeToggle))(spd))(JQuery$emptyCallback);
  });
};
var JQuery$resize = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['resize'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$scroll = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['scroll'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$load = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['load'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$documentReady = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],jQuery(Fay$$fayToJs(["user","Document",[]],$p2))['ready'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$unload = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],jQuery(Fay$$fayToJs(["user","Window",[]],$p2))['unload'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$click = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['click'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$dblclick = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['dblclick'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$focusin = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['focusin'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$focusout = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['focusout'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$hover = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['hover'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mousedown = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mousedown'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mouseenter = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mouseenter'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mouseleave = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mouseleave'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mousemove = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mousemove'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mouseout = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mouseout'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mouseover = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mouseover'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$mouseup = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['mouseup'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$toggleEvents = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['toggle']['apply'](Fay$$fayToJs(["user","JQuery",[]],$p2), Fay$$fayToJs(["list",[["function",[["user","Event",[]],["action",[["unknown"]]]]]]],$p1))));
    });
  };
};
var JQuery$bind = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p3)['bind'](Fay$$fayToJs(["user","EventType",[]],$p1), Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p2))));
      });
    };
  };
};
var JQuery$bindPreventBubble = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p3)['bind'](Fay$$fayToJs(["user","EventType",[]],$p1),Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p2),false)));
      });
    };
  };
};
var JQuery$on = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p3)['on'](Fay$$fayToJs(["user","EventType",[]],$p1), Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p2))));
      });
    };
  };
};
var JQuery$onDelegate = function($p1){
  return function($p2){
    return function($p3){
      return function($p4){
        return new Fay$$$(function(){
          return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p4)['on'](Fay$$fayToJs(["user","EventType",[]],$p1),Fay$$fayToJs(["user","Selector",[]],$p2),Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p3))));
        });
      };
    };
  };
};
var JQuery$one = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p3)['one'](Fay$$fayToJs(["user","EventType",[]],$p1), Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p2))));
      });
    };
  };
};
var JQuery$trigger = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['trigger'](Fay$$fayToJs(["user","EventType",[]],$p1))));
    });
  };
};
var JQuery$triggerHandler = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['triggerHandler'](Fay$$fayToJs(["user","EventType",[]],$p1))));
    });
  };
};
var JQuery$delegateTarget = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","Element",[]],jQuery(Fay$$fayToJs(["user","Event",[]],$p1)['delegateTarget'])));
  });
};
var JQuery$isDefaultPrevented = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_bool(Fay$$fayToJs(["user","Event",[]],$p1)['isDefaultPrevented']()));
  });
};
var JQuery$isImmediatePropagationStopped = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_bool(Fay$$fayToJs(["user","Event",[]],$p1)['isImmediatePropagationStopped']()));
  });
};
var JQuery$isPropagationStopped = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","Element",[]],Fay$$fayToJs(["user","Event",[]],$p1)['isPropagationStopped']()));
  });
};
var JQuery$namespace = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","Event",[]],$p1)['namespace']));
  });
};
var JQuery$pageX = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","Event",[]],$p1)['pageX']));
  });
};
var JQuery$pageY = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","Event",[]],$p1)['pageY']));
  });
};
var JQuery$preventDefault = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","Event",[]],$p1)['preventDefault']()));
  });
};
var JQuery$target = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","Element",[]],Fay$$fayToJs(["user","Event",[]],$p1)['target']));
  });
};
var JQuery$timeStamp = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_double(Fay$$fayToJs(["user","Event",[]],$p1)['timeStamp']));
  });
};
var JQuery$eventType = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_string(Fay$$fayToJs(["user","Event",[]],$p1)['type']));
  });
};
var JQuery$which = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay_int(Fay$$fayToJs(["user","Event",[]],$p1)['which']));
  });
};
var JQuery$blur = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['blur'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$change = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['change'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$onFocus = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['focus'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$focus = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['focus']()));
  });
};
var JQuery$onselect = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['select'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$submit = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['submit'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$keydown = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['keydown'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$keypress = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['keypress'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$keyup = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p2)['keyup'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["unknown"]]]]],$p1))));
    });
  };
};
var JQuery$after = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['after'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$afterWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['after'](Fay$$fayToJs(["function",[["double"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$append = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['append'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$appendJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['append'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$appendWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['append'](Fay$$fayToJs(["function",[["double"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$appendTo = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['appendTo'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$appendToJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['appendTo'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$before = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['before'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$beforeWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['before'](Fay$$fayToJs(["function",[["double"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$WithoutDataAndEvents = new Fay$$$(function(){
  return new $_JQuery$WithoutDataAndEvents();
});
var JQuery$WithDataAndEvents = new Fay$$$(function(){
  return new $_JQuery$WithDataAndEvents();
});
var JQuery$DeepWithDataAndEvents = new Fay$$$(function(){
  return new $_JQuery$DeepWithDataAndEvents();
});
var JQuery$clone = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) instanceof $_JQuery$WithoutDataAndEvents) {
      return Fay$$_(JQuery$ffi)(Fay$$list("%2['clone'](false)"));
    }
    if (Fay$$_($p1) instanceof $_JQuery$WithDataAndEvents) {
      return Fay$$_(JQuery$ffi)(Fay$$list("%2['clone'](true, false)"));
    }
    if (Fay$$_($p1) instanceof $_JQuery$DeepWithDataAndEvents) {
      return Fay$$_(JQuery$ffi)(Fay$$list("%2['clone'](true, true)"));
    }
    throw ["unhandled case in clone",[$p1]];
  });
};
var JQuery$detach = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['detach']()));
  });
};
var JQuery$detachSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['detach'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$empty = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['empty']()));
  });
};
var JQuery$insertAfter = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['insertAfter'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$insertBefore = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['insertBefore'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$prepend = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prepend'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$prependWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prepend'](Fay$$fayToJs(["function",[["double"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$prependTo = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prependTo'](Fay$$fayToJs(["unknown"],$p1))));
    });
  };
};
var JQuery$remove = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['remove']()));
  });
};
var JQuery$removeSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['remove'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$replaceAll = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['replaceAll'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$replaceWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['replaceWith'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$replaceWithJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['replaceWith'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$replaceWithWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['replaceWith'](Fay$$fayToJs(["action",[["user","JQuery",[]]]],$p1))));
    });
  };
};
var JQuery$unwrap = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['unwrap']()));
  });
};
var JQuery$wrap = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrap'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$wrapWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrap'](Fay$$fayToJs(["function",[["double"],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$wrapAllHtml = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrapAll'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$wrapAllSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrapAll'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$wrapAllElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrapAll'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$wrapInnerHtml = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrapInner'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$wrapInnerSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrapInner'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$wrapInnerElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['wrapInner'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$addSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['add'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$addElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['add'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$addHtml = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['add'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$add = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['add'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$addSelectorWithContext = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['add'](Fay$$fayToJs_string($p1), Fay$$fayToJs(["user","JQuery",[]],$p2))));
      });
    };
  };
};
var JQuery$andSelf = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['andSelf']()));
  });
};
var JQuery$children = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['children']()));
  });
};
var JQuery$childrenMatching = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['children'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$closestSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['closest'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$closestWithContext = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['closest'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$closest = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['closest'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$closestElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['closest'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$contents = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['contents']()));
  });
};
var JQuery$each = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['each'](Fay$$fayToJs(["function",[["double"],["user","Element",[]],["action",[["bool"]]]]],$p1))));
    });
  };
};
var JQuery$end = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['end']()));
  });
};
var JQuery$eq = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['eq'](Fay$$fayToJs_double($p1))));
    });
  };
};
var JQuery$filter = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['filter'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$filterWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['filter'](Fay$$fayToJs(["function",[["double"],["action",[["bool"]]]]],$p1))));
    });
  };
};
var JQuery$filterElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['filter'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$filterJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['filter'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$findSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['find'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$findJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['find'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$findElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['find'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$first = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['first']()));
  });
};
var JQuery$has = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['has'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$hasElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['has'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$is = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['is'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$isWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['is'](Fay$$fayToJs(["function",[["double"],["bool"]]],$p1))));
    });
  };
};
var JQuery$isJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['is'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$isElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['is'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$last = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['last']()));
  });
};
var JQuery$jQueryMap = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['map'](Fay$$fayToJs(["function",[["double"],["user","Element",[]],["action",[["user","JQuery",[]]]]]],$p1))));
    });
  };
};
var JQuery$next = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['next']()));
  });
};
var JQuery$nextSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['next'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$nextAll = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['nextAll']()));
  });
};
var JQuery$nextAllSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['nextAll'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$nextUntil = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['nextUntil'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$nextUntilFiltered = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['nextUntil'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$nextUntilElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['nextUntil'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$nextUntilElementFiltered = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['nextUntil'](Fay$$fayToJs(["user","Element",[]],$p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$not = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['not'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$notElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['not'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$notElements = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['not'](Fay$$fayToJs(["list",[["user","Element",[]]]],$p1))));
    });
  };
};
var JQuery$notWith = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['not'](Fay$$fayToJs(["function",[["double"],["bool"]]],$p1))));
    });
  };
};
var JQuery$notJQuery = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['not'](Fay$$fayToJs(["user","JQuery",[]],$p1))));
    });
  };
};
var JQuery$offsetParent = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['offsetParent']()));
  });
};
var JQuery$parent = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['parent']()));
  });
};
var JQuery$parentSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['parent'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$parents = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['parents']()));
  });
};
var JQuery$parentsSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['parents'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$parentsUntil = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['parentsUntil'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$parentsUntilFiltered = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['parentsUntil'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$parentsUntilElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['parentsUntil'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$parentsUntilElementFiltered = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['parentsUntil'](Fay$$fayToJs(["user","Element",[]],$p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$prev = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['prev']()));
  });
};
var JQuery$prevSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prev'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$prevAll = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['prevAll']()));
  });
};
var JQuery$prevAllSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prevAll'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$prevUntil = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prevUntil'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$prevUntilFiltered = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['prevUntil'](Fay$$fayToJs_string($p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$prevUntilElement = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['prevUntil'](Fay$$fayToJs(["user","Element",[]],$p1))));
    });
  };
};
var JQuery$prevUntilElementFiltered = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['prevUntil'](Fay$$fayToJs(["user","Element",[]],$p1), Fay$$fayToJs_string($p2))));
      });
    };
  };
};
var JQuery$siblings = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['siblings']()));
  });
};
var JQuery$siblingsSelector = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['siblings'](Fay$$fayToJs_string($p1))));
    });
  };
};
var JQuery$slice = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['slice'](Fay$$fayToJs_double($p1))));
    });
  };
};
var JQuery$sliceFromTo = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p3)['slice'](Fay$$fayToJs_double($p1), Fay$$fayToJs_double($p2))));
      });
    };
  };
};
var JQuery$KeyUp = new Fay$$$(function(){
  return new $_JQuery$KeyUp();
});
var JQuery$KeyDown = new Fay$$$(function(){
  return new $_JQuery$KeyDown();
});
var JQuery$KeyLeft = new Fay$$$(function(){
  return new $_JQuery$KeyLeft();
});
var JQuery$KeyRight = new Fay$$$(function(){
  return new $_JQuery$KeyRight();
});
var JQuery$KeyRet = new Fay$$$(function(){
  return new $_JQuery$KeyRet();
});
var JQuery$SomeKey = function(slot1){
  return new Fay$$$(function(){
    return new $_JQuery$SomeKey(slot1);
  });
};
var JQuery$onKeycode = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var el = $p2;
      var callback = $p1;
      return Fay$$_(Fay$$_(JQuery$_onKeycode)(function($p1){
        var code = $p1;
        return Fay$$_(callback)((function($tmp1){
          if (Fay$$_($tmp1) === 38) {
            return JQuery$KeyUp;
          }
          if (Fay$$_($tmp1) === 40) {
            return JQuery$KeyDown;
          }
          if (Fay$$_($tmp1) === 37) {
            return JQuery$KeyLeft;
          }
          if (Fay$$_($tmp1) === 39) {
            return JQuery$KeyRight;
          }
          if (Fay$$_($tmp1) === 13) {
            return JQuery$KeyRet;
          }
          return Fay$$_(JQuery$SomeKey)(code);
        })(code));
      }))(el);
    });
  };
};
var JQuery$_onKeycode = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['keycode'](Fay$$fayToJs(["function",[["double"],["action",[["bool"]]]]],$p1))));
    });
  };
};
var JQuery$unKeycode = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['unkeycode']()));
  });
};
var JQuery$onClick = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['click'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["bool"]]]]],$p1))));
    });
  };
};
var JQuery$onChange = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['change'](Fay$$fayToJs(["action",[["unknown"]]],$p1))));
    });
  };
};
var JQuery$onSubmit = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['submit'](Fay$$fayToJs(["action",[["bool"]]],$p1))));
    });
  };
};
var JQuery$eventX = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay_double(Fay$$fayToJs(["user","Event",[]],$p1)['pageX'] - Fay$$fayToJs(["user","JQuery",[]],$p2)['get'](0)['offsetLeft']);
    });
  };
};
var JQuery$eventY = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay_double(Fay$$fayToJs(["user","Event",[]],$p1)['pageY'] - Fay$$fayToJs(["user","JQuery",[]],$p2)['get'](0)['offsetTop']);
    });
  };
};
var JQuery$onDblClick = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['dblclick'](Fay$$fayToJs(["function",[["user","Event",[]],["action",[["bool"]]]]],$p1))));
    });
  };
};
var JQuery$setDraggable = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p1)['draggable']()));
  });
};
var JQuery$validate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$fayToJs(["user","JQuery",[]],$p1)['validate']({ "submitHandler": Fay$$fayToJs(["action",[["unknown"]]],$p2) })));
    });
  };
};
var JQuery$onLivechange = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["user","JQuery",[]],Fay$$fayToJs(["user","JQuery",[]],$p2)['livechange'](50,Fay$$fayToJs(["action",[["unknown"]]],$p1))));
    });
  };
};
var Prelude$Just = function(slot1){
  return new Fay$$$(function(){
    return new $_Prelude$Just(slot1);
  });
};
var Prelude$Nothing = new Fay$$$(function(){
  return new $_Prelude$Nothing();
});
var Prelude$Left = function(slot1){
  return new Fay$$$(function(){
    return new $_Prelude$Left(slot1);
  });
};
var Prelude$Right = function(slot1){
  return new Fay$$$(function(){
    return new $_Prelude$Right(slot1);
  });
};
var Prelude$maybe = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) instanceof $_Prelude$Nothing) {
          var m = $p1;
          return m;
        }
        if (Fay$$_($p3) instanceof $_Prelude$Just) {
          var x = Fay$$_($p3).slot1;
          var f = $p2;
          return Fay$$_(f)(x);
        }
        throw ["unhandled case in maybe",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$Ratio = function(slot1){
  return function(slot2){
    return new Fay$$$(function(){
      return new $_Prelude$Ratio(slot1,slot2);
    });
  };
};
var Prelude$$62$$62$$61$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$bind(Fay$$fayToJs(["action",[["unknown"]]],$p1))(Fay$$fayToJs(["function",[["unknown"],["action",[["unknown"]]]]],$p2))));
    });
  };
};
var Prelude$$62$$62$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$then(Fay$$fayToJs(["action",[["unknown"]]],$p1))(Fay$$fayToJs(["action",[["unknown"]]],$p2))));
    });
  };
};
var Prelude$$_return = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],Fay$$return(Fay$$fayToJs(["unknown"],$p1))));
  });
};
var Prelude$when = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var m = $p2;
      var p = $p1;
      return Fay$$_(p) ? Fay$$_(Fay$$_(Fay$$then)(m))(Fay$$_(Fay$$$_return)(Fay$$unit)) : Fay$$_(Fay$$$_return)(Fay$$unit);
    });
  };
};
var Prelude$forM_ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var m = $p2;
      var $tmp1 = Fay$$_($p1);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        return Fay$$_(Fay$$_(Fay$$then)(Fay$$_(m)(x)))(Fay$$_(Fay$$_(Prelude$forM_)(xs))(m));
      }
      if (Fay$$_($p1) === null) {
        return Fay$$_(Fay$$$_return)(Fay$$unit);
      }
      throw ["unhandled case in forM_",[$p1,$p2]];
    });
  };
};
var Prelude$mapM_ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var m = $p1;
        return Fay$$_(Fay$$_(Fay$$then)(Fay$$_(m)(x)))(Fay$$_(Fay$$_(Prelude$mapM_)(m))(xs));
      }
      if (Fay$$_($p2) === null) {
        return Fay$$_(Fay$$$_return)(Fay$$unit);
      }
      throw ["unhandled case in mapM_",[$p1,$p2]];
    });
  };
};
var Prelude$$61$$60$$60$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(Fay$$_(Fay$$bind)(x))(f);
    });
  };
};
var Prelude$sequence = function($p1){
  return new Fay$$$(function(){
    var ms = $p1;
    return (function(){
      var k = function($p1){
        return function($p2){
          return new Fay$$$(function(){
            var m$39$ = $p2;
            var m = $p1;
            return Fay$$_(Fay$$_(Fay$$bind)(m))(function($p1){
              var x = $p1;
              return Fay$$_(Fay$$_(Fay$$bind)(m$39$))(function($p1){
                var xs = $p1;
                return Fay$$_(Fay$$$_return)(Fay$$_(Fay$$_(Fay$$cons)(x))(xs));
              });
            });
          });
        };
      };
      return Fay$$_(Fay$$_(Fay$$_(Prelude$foldr)(k))(Fay$$_(Fay$$$_return)(null)))(ms);
    })();
  });
};
var Prelude$sequence_ = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Fay$$$_return)(Fay$$unit);
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var m = $tmp1.car;
      var ms = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$then)(m))(Fay$$_(Prelude$sequence_)(ms));
    }
    throw ["unhandled case in sequence_",[$p1]];
  });
};
var Prelude$GT = new Fay$$$(function(){
  return new $_Prelude$GT();
});
var Prelude$LT = new Fay$$$(function(){
  return new $_Prelude$LT();
});
var Prelude$EQ = new Fay$$$(function(){
  return new $_Prelude$EQ();
});
var Prelude$compare = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(x))(y)) ? Prelude$GT : Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(y)) ? Prelude$LT : Prelude$EQ;
    });
  };
};
var Prelude$succ = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$add)(x))(1);
  });
};
var Prelude$pred = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$sub)(x))(1);
  });
};
var Prelude$enumFrom = function($p1){
  return new Fay$$$(function(){
    var i = $p1;
    return Fay$$_(Fay$$_(Fay$$cons)(i))(Fay$$_(Prelude$enumFrom)(Fay$$_(Fay$$_(Fay$$add)(i))(1)));
  });
};
var Prelude$enumFromTo = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var n = $p2;
      var i = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(i))(n)) ? null : Fay$$_(Fay$$_(Fay$$cons)(i))(Fay$$_(Fay$$_(Prelude$enumFromTo)(Fay$$_(Fay$$_(Fay$$add)(i))(1)))(n));
    });
  };
};
var Prelude$enumFromBy = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var by = $p2;
      var fr = $p1;
      return Fay$$_(Fay$$_(Fay$$cons)(fr))(Fay$$_(Fay$$_(Prelude$enumFromBy)(Fay$$_(Fay$$_(Fay$$add)(fr))(by)))(by));
    });
  };
};
var Prelude$enumFromThen = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var th = $p2;
      var fr = $p1;
      return Fay$$_(Fay$$_(Prelude$enumFromBy)(fr))(Fay$$_(Fay$$_(Fay$$sub)(th))(fr));
    });
  };
};
var Prelude$enumFromByTo = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var to = $p3;
        var by = $p2;
        var fr = $p1;
        return (function(){
          var neg = function($p1){
            return new Fay$$$(function(){
              var x = $p1;
              return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(to)) ? null : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(neg)(Fay$$_(Fay$$_(Fay$$add)(x))(by)));
            });
          };
          var pos = function($p1){
            return new Fay$$$(function(){
              var x = $p1;
              return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(x))(to)) ? null : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(pos)(Fay$$_(Fay$$_(Fay$$add)(x))(by)));
            });
          };
          return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(by))(0)) ? Fay$$_(neg)(fr) : Fay$$_(pos)(fr);
        })();
      });
    };
  };
};
var Prelude$enumFromThenTo = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var to = $p3;
        var th = $p2;
        var fr = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$enumFromByTo)(fr))(Fay$$_(Fay$$_(Fay$$sub)(th))(fr)))(to);
      });
    };
  };
};
var Prelude$fromIntegral = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Fay$$fayToJs_int($p1));
  });
};
var Prelude$fromInteger = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Fay$$fayToJs_int($p1));
  });
};
var Prelude$not = function($p1){
  return new Fay$$$(function(){
    var p = $p1;
    return Fay$$_(p) ? false : true;
  });
};
var Prelude$otherwise = true;
var Prelude$show = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_string(JSON.stringify(Fay$$fayToJs(["automatic"],$p1)));
  });
};
var Prelude$error = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay(["unknown"],(function() { throw Fay$$fayToJs_string($p1) })());
  });
};
var Prelude$$_undefined = new Fay$$$(function(){
  return Fay$$_(Prelude$error)(Fay$$list("Prelude.undefined"));
});
var Prelude$either = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) instanceof $_Prelude$Left) {
          var a = Fay$$_($p3).slot1;
          var f = $p1;
          return Fay$$_(f)(a);
        }
        if (Fay$$_($p3) instanceof $_Prelude$Right) {
          var b = Fay$$_($p3).slot1;
          var g = $p2;
          return Fay$$_(g)(b);
        }
        throw ["unhandled case in either",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$until = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var x = $p3;
        var f = $p2;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? x : Fay$$_(Fay$$_(Fay$$_(Prelude$until)(p))(f))(Fay$$_(f)(x));
      });
    };
  };
};
var Prelude$$36$$33$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(Fay$$_(Fay$$seq)(x))(Fay$$_(f)(x));
    });
  };
};
var Prelude$$_const = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var a = $p1;
      return a;
    });
  };
};
var Prelude$id = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return x;
  });
};
var Prelude$$46$ = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var x = $p3;
        var g = $p2;
        var f = $p1;
        return Fay$$_(f)(Fay$$_(g)(x));
      });
    };
  };
};
var Prelude$$36$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(f)(x);
    });
  };
};
var Prelude$flip = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var y = $p3;
        var x = $p2;
        var f = $p1;
        return Fay$$_(Fay$$_(f)(y))(x);
      });
    };
  };
};
var Prelude$curry = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var y = $p3;
        var x = $p2;
        var f = $p1;
        return Fay$$_(f)(Fay$$list([x,y]));
      });
    };
  };
};
var Prelude$uncurry = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var p = $p2;
      var f = $p1;
      return (function($tmp1){
        if (Fay$$listLen(Fay$$_($tmp1),2)) {
          var x = Fay$$index(0,Fay$$_($tmp1));
          var y = Fay$$index(1,Fay$$_($tmp1));
          return Fay$$_(Fay$$_(f)(x))(y);
        }
        return (function(){ throw (["unhandled case",$tmp1]); })();
      })(p);
    });
  };
};
var Prelude$snd = function($p1){
  return new Fay$$$(function(){
    if (Fay$$listLen(Fay$$_($p1),2)) {
      var x = Fay$$index(1,Fay$$_($p1));
      return x;
    }
    throw ["unhandled case in snd",[$p1]];
  });
};
var Prelude$fst = function($p1){
  return new Fay$$$(function(){
    if (Fay$$listLen(Fay$$_($p1),2)) {
      var x = Fay$$index(0,Fay$$_($p1));
      return x;
    }
    throw ["unhandled case in fst",[$p1]];
  });
};
var Prelude$div = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$gt)(x))(0)))(Fay$$_(Fay$$_(Fay$$lt)(y))(0)))) {
        return Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Prelude$quot)(Fay$$_(Fay$$_(Fay$$sub)(x))(1)))(y)))(1);
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$lt)(x))(0)))(Fay$$_(Fay$$_(Fay$$gt)(y))(0)))) {
          return Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Prelude$quot)(Fay$$_(Fay$$_(Fay$$add)(x))(1)))(y)))(1);
        }
      }
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$quot)(x))(y);
    });
  };
};
var Prelude$mod = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$gt)(x))(0)))(Fay$$_(Fay$$_(Fay$$lt)(y))(0)))) {
        return Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Prelude$rem)(Fay$$_(Fay$$_(Fay$$sub)(x))(1)))(y)))(y)))(1);
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$lt)(x))(0)))(Fay$$_(Fay$$_(Fay$$gt)(y))(0)))) {
          return Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Prelude$rem)(Fay$$_(Fay$$_(Fay$$add)(x))(1)))(y)))(y)))(1);
        }
      }
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$rem)(x))(y);
    });
  };
};
var Prelude$divMod = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$gt)(x))(0)))(Fay$$_(Fay$$_(Fay$$lt)(y))(0)))) {
        return (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var q = Fay$$index(0,Fay$$_($tmp1));
            var r = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$sub)(q))(1),Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Fay$$add)(r))(y)))(1)]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Fay$$_(Prelude$quotRem)(Fay$$_(Fay$$_(Fay$$sub)(x))(1)))(y));
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$and)(Fay$$_(Fay$$_(Fay$$lt)(x))(0)))(Fay$$_(Fay$$_(Fay$$gt)(y))(1)))) {
          return (function($tmp1){
            if (Fay$$listLen(Fay$$_($tmp1),2)) {
              var q = Fay$$index(0,Fay$$_($tmp1));
              var r = Fay$$index(1,Fay$$_($tmp1));
              return Fay$$list([Fay$$_(Fay$$_(Fay$$sub)(q))(1),Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Fay$$add)(r))(y)))(1)]);
            }
            return (function(){ throw (["unhandled case",$tmp1]); })();
          })(Fay$$_(Fay$$_(Prelude$quotRem)(Fay$$_(Fay$$_(Fay$$add)(x))(1)))(y));
        }
      }
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$quotRem)(x))(y);
    });
  };
};
var Prelude$min = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["unknown"],Math.min(Fay$$_(Fay$$fayToJs(["unknown"],$p1)),Fay$$_(Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var Prelude$max = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["unknown"],Math.max(Fay$$_(Fay$$fayToJs(["unknown"],$p1)),Fay$$_(Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var Prelude$recip = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(1))(x);
  });
};
var Prelude$negate = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return (-(Fay$$_(x)));
  });
};
var Prelude$abs = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(0)) ? Fay$$_(Prelude$negate)(x) : x;
  });
};
var Prelude$signum = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Fay$$gt)(x))(0)) ? 1 : Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(x))(0)) ? 0 : (-(1));
  });
};
var Prelude$pi = new Fay$$$(function(){
  return Fay$$jsToFay_double(Math.PI);
});
var Prelude$exp = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.exp(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$sqrt = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.sqrt(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$log = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.log(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$$42$$42$ = new Fay$$$(function(){
  return Prelude$unsafePow;
});
var Prelude$$94$$94$ = new Fay$$$(function(){
  return Prelude$unsafePow;
});
var Prelude$unsafePow = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay(["unknown"],Math.pow(Fay$$_(Fay$$fayToJs(["unknown"],$p1)),Fay$$_(Fay$$fayToJs(["unknown"],$p2))));
    });
  };
};
var Prelude$$94$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var b = $p2;
      var a = $p1;
      if (Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(b))(0))) {
        return Fay$$_(Prelude$error)(Fay$$list("(^): negative exponent"));
      } else {if (Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(b))(0))) {
          return 1;
        } else {if (Fay$$_(Fay$$_(Prelude$even)(b))) {
            return (function(){
              var x = new Fay$$$(function(){
                return Fay$$_(Fay$$_(Prelude$$94$)(a))(Fay$$_(Fay$$_(Prelude$quot)(b))(2));
              });
              return Fay$$_(Fay$$_(Fay$$mult)(x))(x);
            })();
          }
        }
      }
      var b = $p2;
      var a = $p1;
      return Fay$$_(Fay$$_(Fay$$mult)(a))(Fay$$_(Fay$$_(Prelude$$94$)(a))(Fay$$_(Fay$$_(Fay$$sub)(b))(1)));
    });
  };
};
var Prelude$logBase = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var b = $p1;
      return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Prelude$log)(x)))(Fay$$_(Prelude$log)(b));
    });
  };
};
var Prelude$sin = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.sin(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$tan = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.tan(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$cos = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.cos(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$asin = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.asin(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$atan = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.atan(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$acos = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_double(Math.acos(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$sinh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Prelude$exp)(x)))(Fay$$_(Prelude$exp)((-(Fay$$_(x)))))))(2);
  });
};
var Prelude$tanh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return (function(){
      var a = new Fay$$$(function(){
        return Fay$$_(Prelude$exp)(x);
      });
      var b = new Fay$$$(function(){
        return Fay$$_(Prelude$exp)((-(Fay$$_(x))));
      });
      return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$sub)(a))(b)))(Fay$$_(Fay$$_(Fay$$add)(a))(b));
    })();
  });
};
var Prelude$cosh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Prelude$exp)(x)))(Fay$$_(Prelude$exp)((-(Fay$$_(x)))))))(2);
  });
};
var Prelude$asinh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Prelude$log)(Fay$$_(Fay$$_(Fay$$add)(x))(Fay$$_(Prelude$sqrt)(Fay$$_(Fay$$_(Fay$$add)(Fay$$_(Fay$$_(Prelude$$42$$42$)(x))(2)))(1))));
  });
};
var Prelude$atanh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Prelude$log)(Fay$$_(Fay$$_(Fay$$divi)(Fay$$_(Fay$$_(Fay$$add)(1))(x)))(Fay$$_(Fay$$_(Fay$$sub)(1))(x)))))(2);
  });
};
var Prelude$acosh = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Prelude$log)(Fay$$_(Fay$$_(Fay$$add)(x))(Fay$$_(Prelude$sqrt)(Fay$$_(Fay$$_(Fay$$sub)(Fay$$_(Fay$$_(Prelude$$42$$42$)(x))(2)))(1))));
  });
};
var Prelude$properFraction = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return (function(){
      var a = new Fay$$$(function(){
        return Fay$$_(Prelude$truncate)(x);
      });
      return Fay$$list([a,Fay$$_(Fay$$_(Fay$$sub)(x))(Fay$$_(Prelude$fromIntegral)(a))]);
    })();
  });
};
var Prelude$truncate = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(x))(0)) ? Fay$$_(Prelude$ceiling)(x) : Fay$$_(Prelude$floor)(x);
  });
};
var Prelude$round = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_int(Math.round(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$ceiling = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_int(Math.ceil(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$floor = function($p1){
  return new Fay$$$(function(){
    return Fay$$jsToFay_int(Math.floor(Fay$$fayToJs_double($p1)));
  });
};
var Prelude$subtract = new Fay$$$(function(){
  return Fay$$_(Prelude$flip)(Fay$$sub);
});
var Prelude$even = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$eq)(Fay$$_(Fay$$_(Prelude$rem)(x))(2)))(0);
  });
};
var Prelude$odd = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Prelude$not)(Fay$$_(Prelude$even)(x));
  });
};
var Prelude$gcd = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var b = $p2;
      var a = $p1;
      return (function(){
        var go = function($p1){
          return function($p2){
            return new Fay$$$(function(){
              if (Fay$$_($p2) === 0) {
                var x = $p1;
                return x;
              }
              var y = $p2;
              var x = $p1;
              return Fay$$_(Fay$$_(go)(y))(Fay$$_(Fay$$_(Prelude$rem)(x))(y));
            });
          };
        };
        return Fay$$_(Fay$$_(go)(Fay$$_(Prelude$abs)(a)))(Fay$$_(Prelude$abs)(b));
      })();
    });
  };
};
var Prelude$quot = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(y))(0)) ? Fay$$_(Prelude$error)(Fay$$list("Division by zero")) : Fay$$_(Fay$$_(Prelude$quot$39$)(x))(y);
    });
  };
};
var Prelude$quot$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay_int(~~(Fay$$fayToJs_int($p1)/Fay$$fayToJs_int($p2)));
    });
  };
};
var Prelude$quotRem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$list([Fay$$_(Fay$$_(Prelude$quot)(x))(y),Fay$$_(Fay$$_(Prelude$rem)(x))(y)]);
    });
  };
};
var Prelude$rem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(y))(0)) ? Fay$$_(Prelude$error)(Fay$$list("Division by zero")) : Fay$$_(Fay$$_(Prelude$rem$39$)(x))(y);
    });
  };
};
var Prelude$rem$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      return Fay$$jsToFay_int(Fay$$fayToJs_int($p1) % Fay$$fayToJs_int($p2));
    });
  };
};
var Prelude$lcm = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === 0) {
        return 0;
      }
      if (Fay$$_($p1) === 0) {
        return 0;
      }
      var b = $p2;
      var a = $p1;
      return Fay$$_(Prelude$abs)(Fay$$_(Fay$$_(Fay$$mult)(Fay$$_(Fay$$_(Prelude$quot)(a))(Fay$$_(Fay$$_(Prelude$gcd)(a))(b))))(b));
    });
  };
};
var Prelude$find = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Prelude$Just)(x) : Fay$$_(Fay$$_(Prelude$find)(p))(xs);
      }
      if (Fay$$_($p2) === null) {
        return Prelude$Nothing;
      }
      throw ["unhandled case in find",[$p1,$p2]];
    });
  };
};
var Prelude$filter = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$filter)(p))(xs)) : Fay$$_(Fay$$_(Prelude$filter)(p))(xs);
      }
      if (Fay$$_($p2) === null) {
        return null;
      }
      throw ["unhandled case in filter",[$p1,$p2]];
    });
  };
};
var Prelude$$_null = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return true;
    }
    return false;
  });
};
var Prelude$map = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(f)(x)))(Fay$$_(Fay$$_(Prelude$map)(f))(xs));
      }
      throw ["unhandled case in map",[$p1,$p2]];
    });
  };
};
var Prelude$nub = function($p1){
  return new Fay$$$(function(){
    var ls = $p1;
    return Fay$$_(Fay$$_(Prelude$nub$39$)(ls))(null);
  });
};
var Prelude$nub$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p1) === null) {
        return null;
      }
      var ls = $p2;
      var $tmp1 = Fay$$_($p1);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$elem)(x))(ls)) ? Fay$$_(Fay$$_(Prelude$nub$39$)(xs))(ls) : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$nub$39$)(xs))(Fay$$_(Fay$$_(Fay$$cons)(x))(ls)));
      }
      throw ["unhandled case in nub'",[$p1,$p2]];
    });
  };
};
var Prelude$elem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var y = $tmp1.car;
        var ys = $tmp1.cdr;
        var x = $p1;
        return Fay$$_(Fay$$_(Fay$$or)(Fay$$_(Fay$$_(Fay$$eq)(x))(y)))(Fay$$_(Fay$$_(Prelude$elem)(x))(ys));
      }
      if (Fay$$_($p2) === null) {
        return false;
      }
      throw ["unhandled case in elem",[$p1,$p2]];
    });
  };
};
var Prelude$notElem = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var ys = $p2;
      var x = $p1;
      return Fay$$_(Prelude$not)(Fay$$_(Fay$$_(Prelude$elem)(x))(ys));
    });
  };
};
var Prelude$sort = new Fay$$$(function(){
  return Fay$$_(Prelude$sortBy)(Prelude$compare);
});
var Prelude$sortBy = function($p1){
  return new Fay$$$(function(){
    var cmp = $p1;
    return Fay$$_(Fay$$_(Prelude$foldr)(Fay$$_(Prelude$insertBy)(cmp)))(null);
  });
};
var Prelude$insertBy = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var x = $p2;
          return Fay$$list([x]);
        }
        var ys = $p3;
        var x = $p2;
        var cmp = $p1;
        return (function($tmp1){
          if (Fay$$_($tmp1) === null) {
            return Fay$$list([x]);
          }
          var $tmp2 = Fay$$_($tmp1);
          if ($tmp2 instanceof Fay$$Cons) {
            var y = $tmp2.car;
            var ys$39$ = $tmp2.cdr;
            return (function($tmp2){
              if (Fay$$_($tmp2) instanceof $_Prelude$GT) {
                return Fay$$_(Fay$$_(Fay$$cons)(y))(Fay$$_(Fay$$_(Fay$$_(Prelude$insertBy)(cmp))(x))(ys$39$));
              }
              return Fay$$_(Fay$$_(Fay$$cons)(x))(ys);
            })(Fay$$_(Fay$$_(cmp)(x))(y));
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(ys);
      });
    };
  };
};
var Prelude$conc = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var ys = $p2;
      var $tmp1 = Fay$$_($p1);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$conc)(xs))(ys));
      }
      var ys = $p2;
      if (Fay$$_($p1) === null) {
        return ys;
      }
      throw ["unhandled case in conc",[$p1,$p2]];
    });
  };
};
var Prelude$concat = new Fay$$$(function(){
  return Fay$$_(Fay$$_(Prelude$foldr)(Prelude$conc))(null);
});
var Prelude$concatMap = function($p1){
  return new Fay$$$(function(){
    var f = $p1;
    return Fay$$_(Fay$$_(Prelude$foldr)(Fay$$_(Fay$$_(Prelude$$46$)(Prelude$$43$$43$))(f)))(null);
  });
};
var Prelude$foldr = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var z = $p2;
          return z;
        }
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var x = $tmp1.car;
          var xs = $tmp1.cdr;
          var z = $p2;
          var f = $p1;
          return Fay$$_(Fay$$_(f)(x))(Fay$$_(Fay$$_(Fay$$_(Prelude$foldr)(f))(z))(xs));
        }
        throw ["unhandled case in foldr",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$foldr1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$listLen(Fay$$_($p2),1)) {
        var x = Fay$$index(0,Fay$$_($p2));
        return x;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(f)(x))(Fay$$_(Fay$$_(Prelude$foldr1)(f))(xs));
      }
      if (Fay$$_($p2) === null) {
        return Fay$$_(Prelude$error)(Fay$$list("foldr1: empty list"));
      }
      throw ["unhandled case in foldr1",[$p1,$p2]];
    });
  };
};
var Prelude$foldl = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var z = $p2;
          return z;
        }
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var x = $tmp1.car;
          var xs = $tmp1.cdr;
          var z = $p2;
          var f = $p1;
          return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(f))(Fay$$_(Fay$$_(f)(z))(x)))(xs);
        }
        throw ["unhandled case in foldl",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$foldl1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(f))(x))(xs);
      }
      if (Fay$$_($p2) === null) {
        return Fay$$_(Prelude$error)(Fay$$list("foldl1: empty list"));
      }
      throw ["unhandled case in foldl1",[$p1,$p2]];
    });
  };
};
var Prelude$$43$$43$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var y = $p2;
      var x = $p1;
      return Fay$$_(Fay$$_(Prelude$conc)(x))(y);
    });
  };
};
var Prelude$$33$$33$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var b = $p2;
      var a = $p1;
      return (function(){
        var go = function($p1){
          return function($p2){
            return new Fay$$$(function(){
              if (Fay$$_($p1) === null) {
                return Fay$$_(Prelude$error)(Fay$$list("(!!): index too large"));
              }
              if (Fay$$_($p2) === 0) {
                var $tmp1 = Fay$$_($p1);
                if ($tmp1 instanceof Fay$$Cons) {
                  var h = $tmp1.car;
                  return h;
                }
              }
              var n = $p2;
              var $tmp1 = Fay$$_($p1);
              if ($tmp1 instanceof Fay$$Cons) {
                var t = $tmp1.cdr;
                return Fay$$_(Fay$$_(go)(t))(Fay$$_(Fay$$_(Fay$$sub)(n))(1));
              }
              throw ["unhandled case in go",[$p1,$p2]];
            });
          };
        };
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(b))(0)) ? Fay$$_(Prelude$error)(Fay$$list("(!!): negative index")) : Fay$$_(Fay$$_(go)(a))(b);
      })();
    });
  };
};
var Prelude$head = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("head: empty list"));
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var h = $tmp1.car;
      return h;
    }
    throw ["unhandled case in head",[$p1]];
  });
};
var Prelude$tail = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("tail: empty list"));
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var t = $tmp1.cdr;
      return t;
    }
    throw ["unhandled case in tail",[$p1]];
  });
};
var Prelude$init = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("init: empty list"));
    }
    if (Fay$$listLen(Fay$$_($p1),1)) {
      var a = Fay$$index(0,Fay$$_($p1));
      return null;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var h = $tmp1.car;
      var t = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$cons)(h))(Fay$$_(Prelude$init)(t));
    }
    throw ["unhandled case in init",[$p1]];
  });
};
var Prelude$last = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("last: empty list"));
    }
    if (Fay$$listLen(Fay$$_($p1),1)) {
      var a = Fay$$index(0,Fay$$_($p1));
      return a;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var t = $tmp1.cdr;
      return Fay$$_(Prelude$last)(t);
    }
    throw ["unhandled case in last",[$p1]];
  });
};
var Prelude$iterate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var x = $p2;
      var f = $p1;
      return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$iterate)(f))(Fay$$_(f)(x)));
    });
  };
};
var Prelude$repeat = function($p1){
  return new Fay$$$(function(){
    var x = $p1;
    return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Prelude$repeat)(x));
  });
};
var Prelude$replicate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p1) === 0) {
        return null;
      }
      var x = $p2;
      var n = $p1;
      return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("replicate: negative length")) : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$replicate)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(x));
    });
  };
};
var Prelude$cycle = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("cycle: empty list"));
    }
    var xs = $p1;
    return (function(){
      var xs$39$ = new Fay$$$(function(){
        return Fay$$_(Fay$$_(Prelude$$43$$43$)(xs))(xs$39$);
      });
      return xs$39$;
    })();
  });
};
var Prelude$take = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p1) === 0) {
        return null;
      }
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var n = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("take: negative length")) : Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$take)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(xs));
      }
      throw ["unhandled case in take",[$p1,$p2]];
    });
  };
};
var Prelude$drop = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var xs = $p2;
      if (Fay$$_($p1) === 0) {
        return xs;
      }
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var xs = $tmp1.cdr;
        var n = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("drop: negative length")) : Fay$$_(Fay$$_(Prelude$drop)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(xs);
      }
      throw ["unhandled case in drop",[$p1,$p2]];
    });
  };
};
var Prelude$splitAt = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var xs = $p2;
      if (Fay$$_($p1) === 0) {
        return Fay$$list([null,xs]);
      }
      if (Fay$$_($p2) === null) {
        return Fay$$list([null,null]);
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var n = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Fay$$lt)(n))(0)) ? Fay$$_(Prelude$error)(Fay$$list("splitAt: negative length")) : (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var a = Fay$$index(0,Fay$$_($tmp1));
            var b = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(a),b]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Fay$$_(Prelude$splitAt)(Fay$$_(Fay$$_(Fay$$sub)(n))(1)))(xs));
      }
      throw ["unhandled case in splitAt",[$p1,$p2]];
    });
  };
};
var Prelude$takeWhile = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$takeWhile)(p))(xs)) : null;
      }
      throw ["unhandled case in takeWhile",[$p1,$p2]];
    });
  };
};
var Prelude$dropWhile = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? Fay$$_(Fay$$_(Prelude$dropWhile)(p))(xs) : Fay$$_(Fay$$_(Fay$$cons)(x))(xs);
      }
      throw ["unhandled case in dropWhile",[$p1,$p2]];
    });
  };
};
var Prelude$span = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return Fay$$list([null,null]);
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(p)(x)) ? (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var a = Fay$$index(0,Fay$$_($tmp1));
            var b = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(a),b]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Fay$$_(Prelude$span)(p))(xs)) : Fay$$list([null,Fay$$_(Fay$$_(Fay$$cons)(x))(xs)]);
      }
      throw ["unhandled case in span",[$p1,$p2]];
    });
  };
};
var Prelude$$_break = function($p1){
  return new Fay$$$(function(){
    var p = $p1;
    return Fay$$_(Prelude$span)(Fay$$_(Fay$$_(Prelude$$46$)(Prelude$not))(p));
  });
};
var Prelude$zipWith = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var b = $tmp1.car;
          var bs = $tmp1.cdr;
          var $tmp1 = Fay$$_($p2);
          if ($tmp1 instanceof Fay$$Cons) {
            var a = $tmp1.car;
            var as = $tmp1.cdr;
            var f = $p1;
            return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(f)(a))(b)))(Fay$$_(Fay$$_(Fay$$_(Prelude$zipWith)(f))(as))(bs));
          }
        }
        return null;
      });
    };
  };
};
var Prelude$zipWith3 = function($p1){
  return function($p2){
    return function($p3){
      return function($p4){
        return new Fay$$$(function(){
          var $tmp1 = Fay$$_($p4);
          if ($tmp1 instanceof Fay$$Cons) {
            var c = $tmp1.car;
            var cs = $tmp1.cdr;
            var $tmp1 = Fay$$_($p3);
            if ($tmp1 instanceof Fay$$Cons) {
              var b = $tmp1.car;
              var bs = $tmp1.cdr;
              var $tmp1 = Fay$$_($p2);
              if ($tmp1 instanceof Fay$$Cons) {
                var a = $tmp1.car;
                var as = $tmp1.cdr;
                var f = $p1;
                return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(Fay$$_(f)(a))(b))(c)))(Fay$$_(Fay$$_(Fay$$_(Fay$$_(Prelude$zipWith3)(f))(as))(bs))(cs));
              }
            }
          }
          return null;
        });
      };
    };
  };
};
var Prelude$zip = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var b = $tmp1.car;
        var bs = $tmp1.cdr;
        var $tmp1 = Fay$$_($p1);
        if ($tmp1 instanceof Fay$$Cons) {
          var a = $tmp1.car;
          var as = $tmp1.cdr;
          return Fay$$_(Fay$$_(Fay$$cons)(Fay$$list([a,b])))(Fay$$_(Fay$$_(Prelude$zip)(as))(bs));
        }
      }
      return null;
    });
  };
};
var Prelude$zip3 = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var c = $tmp1.car;
          var cs = $tmp1.cdr;
          var $tmp1 = Fay$$_($p2);
          if ($tmp1 instanceof Fay$$Cons) {
            var b = $tmp1.car;
            var bs = $tmp1.cdr;
            var $tmp1 = Fay$$_($p1);
            if ($tmp1 instanceof Fay$$Cons) {
              var a = $tmp1.car;
              var as = $tmp1.cdr;
              return Fay$$_(Fay$$_(Fay$$cons)(Fay$$list([a,b,c])))(Fay$$_(Fay$$_(Fay$$_(Prelude$zip3)(as))(bs))(cs));
            }
          }
        }
        return null;
      });
    };
  };
};
var Prelude$unzip = function($p1){
  return new Fay$$$(function(){
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      if (Fay$$listLen(Fay$$_($tmp1.car),2)) {
        var x = Fay$$index(0,Fay$$_($tmp1.car));
        var y = Fay$$index(1,Fay$$_($tmp1.car));
        var ps = $tmp1.cdr;
        return (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),2)) {
            var xs = Fay$$index(0,Fay$$_($tmp1));
            var ys = Fay$$index(1,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(xs),Fay$$_(Fay$$_(Fay$$cons)(y))(ys)]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Prelude$unzip)(ps));
      }
    }
    if (Fay$$_($p1) === null) {
      return Fay$$list([null,null]);
    }
    throw ["unhandled case in unzip",[$p1]];
  });
};
var Prelude$unzip3 = function($p1){
  return new Fay$$$(function(){
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      if (Fay$$listLen(Fay$$_($tmp1.car),3)) {
        var x = Fay$$index(0,Fay$$_($tmp1.car));
        var y = Fay$$index(1,Fay$$_($tmp1.car));
        var z = Fay$$index(2,Fay$$_($tmp1.car));
        var ps = $tmp1.cdr;
        return (function($tmp1){
          if (Fay$$listLen(Fay$$_($tmp1),3)) {
            var xs = Fay$$index(0,Fay$$_($tmp1));
            var ys = Fay$$index(1,Fay$$_($tmp1));
            var zs = Fay$$index(2,Fay$$_($tmp1));
            return Fay$$list([Fay$$_(Fay$$_(Fay$$cons)(x))(xs),Fay$$_(Fay$$_(Fay$$cons)(y))(ys),Fay$$_(Fay$$_(Fay$$cons)(z))(zs)]);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(Fay$$_(Prelude$unzip3)(ps));
      }
    }
    if (Fay$$_($p1) === null) {
      return Fay$$list([null,null,null]);
    }
    throw ["unhandled case in unzip3",[$p1]];
  });
};
var Prelude$lines = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return null;
    }
    var s = $p1;
    return (function(){
      var isLineBreak = function($p1){
        return new Fay$$$(function(){
          var c = $p1;
          return Fay$$_(Fay$$_(Fay$$or)(Fay$$_(Fay$$_(Fay$$eq)(c))("\r")))(Fay$$_(Fay$$_(Fay$$eq)(c))("\n"));
        });
      };
      return (function($tmp1){
        if (Fay$$listLen(Fay$$_($tmp1),2)) {
          var a = Fay$$index(0,Fay$$_($tmp1));
          if (Fay$$_(Fay$$index(1,Fay$$_($tmp1))) === null) {
            return Fay$$list([a]);
          }
          var a = Fay$$index(0,Fay$$_($tmp1));
          var $tmp2 = Fay$$_(Fay$$index(1,Fay$$_($tmp1)));
          if ($tmp2 instanceof Fay$$Cons) {
            var cs = $tmp2.cdr;
            return Fay$$_(Fay$$_(Fay$$cons)(a))(Fay$$_(Prelude$lines)(cs));
          }
        }
        return (function(){ throw (["unhandled case",$tmp1]); })();
      })(Fay$$_(Fay$$_(Prelude$$_break)(isLineBreak))(s));
    })();
  });
};
var Prelude$unlines = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return null;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var l = $tmp1.car;
      var ls = $tmp1.cdr;
      return Fay$$_(Fay$$_(Prelude$$43$$43$)(l))(Fay$$_(Fay$$_(Fay$$cons)("\n"))(Fay$$_(Prelude$unlines)(ls)));
    }
    throw ["unhandled case in unlines",[$p1]];
  });
};
var Prelude$words = function($p1){
  return new Fay$$$(function(){
    var str = $p1;
    return (function(){
      var words$39$ = function($p1){
        return new Fay$$$(function(){
          if (Fay$$_($p1) === null) {
            return null;
          }
          var s = $p1;
          return (function($tmp1){
            if (Fay$$listLen(Fay$$_($tmp1),2)) {
              var a = Fay$$index(0,Fay$$_($tmp1));
              var b = Fay$$index(1,Fay$$_($tmp1));
              return Fay$$_(Fay$$_(Fay$$cons)(a))(Fay$$_(Prelude$words)(b));
            }
            return (function(){ throw (["unhandled case",$tmp1]); })();
          })(Fay$$_(Fay$$_(Prelude$$_break)(isSpace))(s));
        });
      };
      var isSpace = function($p1){
        return new Fay$$$(function(){
          var c = $p1;
          return Fay$$_(Fay$$_(Prelude$elem)(c))(Fay$$list(" \t\r\n\u000c\u000b"));
        });
      };
      return Fay$$_(words$39$)(Fay$$_(Fay$$_(Prelude$dropWhile)(isSpace))(str));
    })();
  });
};
var Prelude$unwords = new Fay$$$(function(){
  return Fay$$_(Prelude$intercalate)(Fay$$list(" "));
});
var Prelude$and = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return true;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var x = $tmp1.car;
      var xs = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$and)(x))(Fay$$_(Prelude$and)(xs));
    }
    throw ["unhandled case in and",[$p1]];
  });
};
var Prelude$or = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return false;
    }
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var x = $tmp1.car;
      var xs = $tmp1.cdr;
      return Fay$$_(Fay$$_(Fay$$or)(x))(Fay$$_(Prelude$or)(xs));
    }
    throw ["unhandled case in or",[$p1]];
  });
};
var Prelude$any = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return false;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(Fay$$or)(Fay$$_(p)(x)))(Fay$$_(Fay$$_(Prelude$any)(p))(xs));
      }
      throw ["unhandled case in any",[$p1,$p2]];
    });
  };
};
var Prelude$all = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return true;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var p = $p1;
        return Fay$$_(Fay$$_(Fay$$and)(Fay$$_(p)(x)))(Fay$$_(Fay$$_(Prelude$all)(p))(xs));
      }
      throw ["unhandled case in all",[$p1,$p2]];
    });
  };
};
var Prelude$intersperse = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var sep = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$prependToAll)(sep))(xs));
      }
      throw ["unhandled case in intersperse",[$p1,$p2]];
    });
  };
};
var Prelude$prependToAll = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var sep = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(sep))(Fay$$_(Fay$$_(Fay$$cons)(x))(Fay$$_(Fay$$_(Prelude$prependToAll)(sep))(xs)));
      }
      throw ["unhandled case in prependToAll",[$p1,$p2]];
    });
  };
};
var Prelude$intercalate = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var xss = $p2;
      var xs = $p1;
      return Fay$$_(Prelude$concat)(Fay$$_(Fay$$_(Prelude$intersperse)(xs))(xss));
    });
  };
};
var Prelude$maximum = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("maximum: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Prelude$foldl1)(Prelude$max))(xs);
  });
};
var Prelude$minimum = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("minimum: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Prelude$foldl1)(Prelude$min))(xs);
  });
};
var Prelude$product = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("product: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(Fay$$mult))(1))(xs);
  });
};
var Prelude$sum = function($p1){
  return new Fay$$$(function(){
    if (Fay$$_($p1) === null) {
      return Fay$$_(Prelude$error)(Fay$$list("sum: empty list"));
    }
    var xs = $p1;
    return Fay$$_(Fay$$_(Fay$$_(Prelude$foldl)(Fay$$add))(0))(xs);
  });
};
var Prelude$scanl = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        var l = $p3;
        var z = $p2;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$cons)(z))((function($tmp1){
          if (Fay$$_($tmp1) === null) {
            return null;
          }
          var $tmp2 = Fay$$_($tmp1);
          if ($tmp2 instanceof Fay$$Cons) {
            var x = $tmp2.car;
            var xs = $tmp2.cdr;
            return Fay$$_(Fay$$_(Fay$$_(Prelude$scanl)(f))(Fay$$_(Fay$$_(f)(z))(x)))(xs);
          }
          return (function(){ throw (["unhandled case",$tmp1]); })();
        })(l));
      });
    };
  };
};
var Prelude$scanl1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return Fay$$_(Fay$$_(Fay$$_(Prelude$scanl)(f))(x))(xs);
      }
      throw ["unhandled case in scanl1",[$p1,$p2]];
    });
  };
};
var Prelude$scanr = function($p1){
  return function($p2){
    return function($p3){
      return new Fay$$$(function(){
        if (Fay$$_($p3) === null) {
          var z = $p2;
          return Fay$$list([z]);
        }
        var $tmp1 = Fay$$_($p3);
        if ($tmp1 instanceof Fay$$Cons) {
          var x = $tmp1.car;
          var xs = $tmp1.cdr;
          var z = $p2;
          var f = $p1;
          return (function($tmp1){
            var $tmp2 = Fay$$_($tmp1);
            if ($tmp2 instanceof Fay$$Cons) {
              var h = $tmp2.car;
              var t = $tmp2.cdr;
              return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(f)(x))(h)))(Fay$$_(Fay$$_(Fay$$cons)(h))(t));
            }
            return Prelude$$_undefined;
          })(Fay$$_(Fay$$_(Fay$$_(Prelude$scanr)(f))(z))(xs));
        }
        throw ["unhandled case in scanr",[$p1,$p2,$p3]];
      });
    };
  };
};
var Prelude$scanr1 = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        return null;
      }
      if (Fay$$listLen(Fay$$_($p2),1)) {
        var x = Fay$$index(0,Fay$$_($p2));
        return Fay$$list([x]);
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var x = $tmp1.car;
        var xs = $tmp1.cdr;
        var f = $p1;
        return (function($tmp1){
          var $tmp2 = Fay$$_($tmp1);
          if ($tmp2 instanceof Fay$$Cons) {
            var h = $tmp2.car;
            var t = $tmp2.cdr;
            return Fay$$_(Fay$$_(Fay$$cons)(Fay$$_(Fay$$_(f)(x))(h)))(Fay$$_(Fay$$_(Fay$$cons)(h))(t));
          }
          return Prelude$$_undefined;
        })(Fay$$_(Fay$$_(Prelude$scanr1)(f))(xs));
      }
      throw ["unhandled case in scanr1",[$p1,$p2]];
    });
  };
};
var Prelude$lookup = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      if (Fay$$_($p2) === null) {
        var _key = $p1;
        return Prelude$Nothing;
      }
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        if (Fay$$listLen(Fay$$_($tmp1.car),2)) {
          var x = Fay$$index(0,Fay$$_($tmp1.car));
          var y = Fay$$index(1,Fay$$_($tmp1.car));
          var xys = $tmp1.cdr;
          var key = $p1;
          return Fay$$_(Fay$$_(Fay$$_(Fay$$eq)(key))(x)) ? Fay$$_(Prelude$Just)(y) : Fay$$_(Fay$$_(Prelude$lookup)(key))(xys);
        }
      }
      throw ["unhandled case in lookup",[$p1,$p2]];
    });
  };
};
var Prelude$length = function($p1){
  return new Fay$$$(function(){
    var xs = $p1;
    return Fay$$_(Fay$$_(Prelude$length$39$)(0))(xs);
  });
};
var Prelude$length$39$ = function($p1){
  return function($p2){
    return new Fay$$$(function(){
      var $tmp1 = Fay$$_($p2);
      if ($tmp1 instanceof Fay$$Cons) {
        var xs = $tmp1.cdr;
        var acc = $p1;
        return Fay$$_(Fay$$_(Prelude$length$39$)(Fay$$_(Fay$$_(Fay$$add)(acc))(1)))(xs);
      }
      var acc = $p1;
      return acc;
    });
  };
};
var Prelude$reverse = function($p1){
  return new Fay$$$(function(){
    var $tmp1 = Fay$$_($p1);
    if ($tmp1 instanceof Fay$$Cons) {
      var x = $tmp1.car;
      var xs = $tmp1.cdr;
      return Fay$$_(Fay$$_(Prelude$$43$$43$)(Fay$$_(Prelude$reverse)(xs)))(Fay$$list([x]));
    }
    if (Fay$$_($p1) === null) {
      return null;
    }
    throw ["unhandled case in reverse",[$p1]];
  });
};
var Prelude$print = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],(function(x) { if (console && console.log) console.log(x) })(Fay$$fayToJs(["automatic"],$p1))));
  });
};
var Prelude$putStrLn = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],(function(x) { if (console && console.log) console.log(x) })(Fay$$fayToJs_string($p1))));
  });
};
var FayExample$main = new Fay$$$(function(){
  return Fay$$_(Fay$$_(Prelude$mapM_)(FayExample$addOnload))(Fay$$list([FayExample$onload]));
});
var FayExample$$_void = function($p1){
  return new Fay$$$(function(){
    var f = $p1;
    return Fay$$_(Fay$$_(Fay$$then)(f))(Fay$$_(Fay$$$_return)(Fay$$unit));
  });
};
var FayExample$addOnload = function($p1){
  return new Fay$$$(function(){
    return new Fay$$Monad(Fay$$jsToFay(["unknown"],window.addEventListener("load", Fay$$fayToJs(["action",[["unknown"]]],$p1))));
  });
};
var FayExample$onload = new Fay$$$(function(){
  return Fay$$_(Fay$$_(Prelude$$36$)(FayExample$$_void))(Fay$$_(Fay$$_(Fay$$bind)(Fay$$_(JQuery$select)(Fay$$list("h1"))))(function($p1){
    var title = $p1;
    return Fay$$_(Fay$$_(Fay$$then)(Fay$$_(Fay$$_(JQuery$setText)(Fay$$list("Awesome stuff")))(title)))(Fay$$_(Fay$$$_return)(Fay$$unit));
  }));
});
var $_Language$Fay$FFI$Nullable = function(slot1){
  this.slot1 = slot1;
};
var $_Language$Fay$FFI$Null = function(){
};
var $_Language$Fay$FFI$Defined = function(slot1){
  this.slot1 = slot1;
};
var $_Language$Fay$FFI$Undefined = function(){
};
var $_Prelude$Just = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Nothing = function(){
};
var $_Prelude$Left = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Right = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Ratio = function(slot1,slot2){
  this.slot1 = slot1;
  this.slot2 = slot2;
};
var $_Prelude$GT = function(){
};
var $_Prelude$LT = function(){
};
var $_Prelude$EQ = function(){
};
var $_JQuery$AjaxSettings = function(accepts,async,beforeSend,cache,complete,contentType,crossDomain,data$39$,dataType,error$39$,$_global,ifModified,isLocal,mimeType,password,processData,success,timeout,type$39$,url,username){
  this.accepts = accepts;
  this.async = async;
  this.beforeSend = beforeSend;
  this.cache = cache;
  this.complete = complete;
  this.contentType = contentType;
  this.crossDomain = crossDomain;
  this.data$39$ = data$39$;
  this.dataType = dataType;
  this.error$39$ = error$39$;
  this.$_global = $_global;
  this.ifModified = ifModified;
  this.isLocal = isLocal;
  this.mimeType = mimeType;
  this.password = password;
  this.processData = processData;
  this.success = success;
  this.timeout = timeout;
  this.type$39$ = type$39$;
  this.url = url;
  this.username = username;
};
var $_JQuery$Show = function(){
};
var $_JQuery$Hide = function(){
};
var $_JQuery$Toggle = function(){
};
var $_JQuery$FadeIn = function(){
};
var $_JQuery$FadeOut = function(){
};
var $_JQuery$FadeToggle = function(){
};
var $_JQuery$Instantly = function(){
};
var $_JQuery$Slow = function(){
};
var $_JQuery$Fast = function(){
};
var $_JQuery$Speed = function(slot1){
  this.slot1 = slot1;
};
var $_JQuery$Animation = function(_type,_speed,_nextAnimation,_element){
  this._type = _type;
  this._speed = _speed;
  this._nextAnimation = _nextAnimation;
  this._element = _element;
};
var $_JQuery$WithoutDataAndEvents = function(){
};
var $_JQuery$WithDataAndEvents = function(){
};
var $_JQuery$DeepWithDataAndEvents = function(){
};
var $_JQuery$KeyUp = function(){
};
var $_JQuery$KeyDown = function(){
};
var $_JQuery$KeyLeft = function(){
};
var $_JQuery$KeyRight = function(){
};
var $_JQuery$KeyRet = function(){
};
var $_JQuery$SomeKey = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Just = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Nothing = function(){
};
var $_Prelude$Left = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Right = function(slot1){
  this.slot1 = slot1;
};
var $_Prelude$Ratio = function(slot1,slot2){
  this.slot1 = slot1;
  this.slot2 = slot2;
};
var $_Prelude$GT = function(){
};
var $_Prelude$LT = function(){
};
var $_Prelude$EQ = function(){
};
var Fay$$fayToJsUserDefined = function(type,obj){
  var _obj = Fay$$_(obj);
  var argTypes = type[2];
  if (_obj instanceof $_Language$Fay$FFI$Nullable) {
    var obj_ = {"instance": "Nullable"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Language$Fay$FFI$Null) {
    var obj_ = {"instance": "Null"};
    return obj_;
  }
  if (_obj instanceof $_Language$Fay$FFI$Defined) {
    var obj_ = {"instance": "Defined"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Language$Fay$FFI$Undefined) {
    var obj_ = {"instance": "Undefined"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$Just) {
    var obj_ = {"instance": "Just"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Nothing) {
    var obj_ = {"instance": "Nothing"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$Left) {
    var obj_ = {"instance": "Left"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Right) {
    var obj_ = {"instance": "Right"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Ratio) {
    var obj_ = {"instance": "Ratio"};
    var obj_slot1 = Fay$$fayToJs_int(_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    var obj_slot2 = Fay$$fayToJs_int(_obj.slot2);
    if (undefined !== obj_slot2) {
      obj_['slot2'] = obj_slot2;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$GT) {
    var obj_ = {"instance": "GT"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$LT) {
    var obj_ = {"instance": "LT"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$EQ) {
    var obj_ = {"instance": "EQ"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$AjaxSettings) {
    var obj_ = {"instance": "AjaxSettings"};
    var obj_accepts = Fay$$fayToJs(["defined",[["string"]]],_obj.accepts);
    if (undefined !== obj_accepts) {
      obj_['accepts'] = obj_accepts;
    }
    var obj_async = Fay$$fayToJs(["defined",[["bool"]]],_obj.async);
    if (undefined !== obj_async) {
      obj_['async'] = obj_async;
    }
    var obj_beforeSend = Fay$$fayToJs(["defined",[["function",[["user","JQXHR",[]],["user","AjaxSettings",[argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],argTypes && (argTypes)[1] ? (argTypes)[1] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]],["action",[argTypes && (argTypes)[2] ? (argTypes)[2] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],_obj.beforeSend);
    if (undefined !== obj_beforeSend) {
      obj_['beforeSend'] = obj_beforeSend;
    }
    var obj_cache = Fay$$fayToJs(["defined",[["bool"]]],_obj.cache);
    if (undefined !== obj_cache) {
      obj_['cache'] = obj_cache;
    }
    var obj_complete = Fay$$fayToJs(["defined",[["function",[["user","JQXHR",[]],["string"],["action",[argTypes && (argTypes)[4] ? (argTypes)[4] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],_obj.complete);
    if (undefined !== obj_complete) {
      obj_['complete'] = obj_complete;
    }
    var obj_contentType = Fay$$fayToJs(["defined",[["string"]]],_obj.contentType);
    if (undefined !== obj_contentType) {
      obj_['contentType'] = obj_contentType;
    }
    var obj_crossDomain = Fay$$fayToJs(["defined",[["bool"]]],_obj.crossDomain);
    if (undefined !== obj_crossDomain) {
      obj_['crossDomain'] = obj_crossDomain;
    }
    var obj_data$39$ = Fay$$fayToJs(["defined",[argTypes && (argTypes)[7] ? (argTypes)[7] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]],_obj.data$39$);
    if (undefined !== obj_data$39$) {
      obj_['data$39$'] = obj_data$39$;
    }
    var obj_dataType = Fay$$fayToJs(["defined",[["string"]]],_obj.dataType);
    if (undefined !== obj_dataType) {
      obj_['dataType'] = obj_dataType;
    }
    var obj_error$39$ = Fay$$fayToJs(["defined",[["function",[["user","JQXHR",[]],["user","Maybe",[["string"]]],["user","Maybe",[["string"]]],["action",[argTypes && (argTypes)[9] ? (argTypes)[9] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],_obj.error$39$);
    if (undefined !== obj_error$39$) {
      obj_['error$39$'] = obj_error$39$;
    }
    var obj_global = Fay$$fayToJs(["defined",[["bool"]]],_obj.$_global);
    if (undefined !== obj_global) {
      obj_['$_global'] = obj_global;
    }
    var obj_ifModified = Fay$$fayToJs(["defined",[["bool"]]],_obj.ifModified);
    if (undefined !== obj_ifModified) {
      obj_['ifModified'] = obj_ifModified;
    }
    var obj_isLocal = Fay$$fayToJs(["defined",[["bool"]]],_obj.isLocal);
    if (undefined !== obj_isLocal) {
      obj_['isLocal'] = obj_isLocal;
    }
    var obj_mimeType = Fay$$fayToJs(["defined",[["string"]]],_obj.mimeType);
    if (undefined !== obj_mimeType) {
      obj_['mimeType'] = obj_mimeType;
    }
    var obj_password = Fay$$fayToJs(["defined",[["string"]]],_obj.password);
    if (undefined !== obj_password) {
      obj_['password'] = obj_password;
    }
    var obj_processData = Fay$$fayToJs(["defined",[["bool"]]],_obj.processData);
    if (undefined !== obj_processData) {
      obj_['processData'] = obj_processData;
    }
    var obj_success = Fay$$fayToJs(["defined",[["function",[argTypes && (argTypes)[16] ? (argTypes)[16] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],["action",[argTypes && (argTypes)[16] ? (argTypes)[16] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],_obj.success);
    if (undefined !== obj_success) {
      obj_['success'] = obj_success;
    }
    var obj_timeout = Fay$$fayToJs(["defined",[["double"]]],_obj.timeout);
    if (undefined !== obj_timeout) {
      obj_['timeout'] = obj_timeout;
    }
    var obj_type$39$ = Fay$$fayToJs(["defined",[["string"]]],_obj.type$39$);
    if (undefined !== obj_type$39$) {
      obj_['type$39$'] = obj_type$39$;
    }
    var obj_url = Fay$$fayToJs(["defined",[["string"]]],_obj.url);
    if (undefined !== obj_url) {
      obj_['url'] = obj_url;
    }
    var obj_username = Fay$$fayToJs(["defined",[["string"]]],_obj.username);
    if (undefined !== obj_username) {
      obj_['username'] = obj_username;
    }
    return obj_;
  }
  if (_obj instanceof $_JQuery$Show) {
    var obj_ = {"instance": "Show"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$Hide) {
    var obj_ = {"instance": "Hide"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$Toggle) {
    var obj_ = {"instance": "Toggle"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$FadeIn) {
    var obj_ = {"instance": "FadeIn"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$FadeOut) {
    var obj_ = {"instance": "FadeOut"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$FadeToggle) {
    var obj_ = {"instance": "FadeToggle"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$Instantly) {
    var obj_ = {"instance": "Instantly"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$Slow) {
    var obj_ = {"instance": "Slow"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$Fast) {
    var obj_ = {"instance": "Fast"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$Speed) {
    var obj_ = {"instance": "Speed"};
    var obj_slot1 = Fay$$fayToJs_double(_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_JQuery$Animation) {
    var obj_ = {"instance": "Animation"};
    var obj__type = Fay$$fayToJs(["user","AnimationType",[]],_obj._type);
    if (undefined !== obj__type) {
      obj_['_type'] = obj__type;
    }
    var obj__speed = Fay$$fayToJs(["user","Speed",[]],_obj._speed);
    if (undefined !== obj__speed) {
      obj_['_speed'] = obj__speed;
    }
    var obj__nextAnimation = Fay$$fayToJs(["user","Maybe",[["user","Animation",[]]]],_obj._nextAnimation);
    if (undefined !== obj__nextAnimation) {
      obj_['_nextAnimation'] = obj__nextAnimation;
    }
    var obj__element = Fay$$fayToJs(["user","JQuery",[]],_obj._element);
    if (undefined !== obj__element) {
      obj_['_element'] = obj__element;
    }
    return obj_;
  }
  if (_obj instanceof $_JQuery$WithoutDataAndEvents) {
    var obj_ = {"instance": "WithoutDataAndEvents"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$WithDataAndEvents) {
    var obj_ = {"instance": "WithDataAndEvents"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$DeepWithDataAndEvents) {
    var obj_ = {"instance": "DeepWithDataAndEvents"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$KeyUp) {
    var obj_ = {"instance": "KeyUp"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$KeyDown) {
    var obj_ = {"instance": "KeyDown"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$KeyLeft) {
    var obj_ = {"instance": "KeyLeft"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$KeyRight) {
    var obj_ = {"instance": "KeyRight"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$KeyRet) {
    var obj_ = {"instance": "KeyRet"};
    return obj_;
  }
  if (_obj instanceof $_JQuery$SomeKey) {
    var obj_ = {"instance": "SomeKey"};
    var obj_slot1 = Fay$$fayToJs_double(_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Just) {
    var obj_ = {"instance": "Just"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Nothing) {
    var obj_ = {"instance": "Nothing"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$Left) {
    var obj_ = {"instance": "Left"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Right) {
    var obj_ = {"instance": "Right"};
    var obj_slot1 = Fay$$fayToJs(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$Ratio) {
    var obj_ = {"instance": "Ratio"};
    var obj_slot1 = Fay$$fayToJs_int(_obj.slot1);
    if (undefined !== obj_slot1) {
      obj_['slot1'] = obj_slot1;
    }
    var obj_slot2 = Fay$$fayToJs_int(_obj.slot2);
    if (undefined !== obj_slot2) {
      obj_['slot2'] = obj_slot2;
    }
    return obj_;
  }
  if (_obj instanceof $_Prelude$GT) {
    var obj_ = {"instance": "GT"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$LT) {
    var obj_ = {"instance": "LT"};
    return obj_;
  }
  if (_obj instanceof $_Prelude$EQ) {
    var obj_ = {"instance": "EQ"};
    return obj_;
  }
  return obj;
};
var Fay$$jsToFayUserDefined = function(type,obj){
  var argTypes = type[2];
  if (obj["instance"] === "Nullable") {
    return new $_Language$Fay$FFI$Nullable(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Null") {
    return new $_Language$Fay$FFI$Null();
  }
  if (obj["instance"] === "Defined") {
    return new $_Language$Fay$FFI$Defined(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Undefined") {
    return new $_Language$Fay$FFI$Undefined();
  }
  if (obj["instance"] === "Just") {
    return new $_Prelude$Just(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Nothing") {
    return new $_Prelude$Nothing();
  }
  if (obj["instance"] === "Left") {
    return new $_Prelude$Left(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Right") {
    return new $_Prelude$Right(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Ratio") {
    return new $_Prelude$Ratio(Fay$$jsToFay_int(obj["slot1"]),Fay$$jsToFay_int(obj["slot2"]));
  }
  if (obj["instance"] === "GT") {
    return new $_Prelude$GT();
  }
  if (obj["instance"] === "LT") {
    return new $_Prelude$LT();
  }
  if (obj["instance"] === "EQ") {
    return new $_Prelude$EQ();
  }
  if (obj["instance"] === "AjaxSettings") {
    return new $_JQuery$AjaxSettings(Fay$$jsToFay(["defined",[["string"]]],obj["accepts"]),Fay$$jsToFay(["defined",[["bool"]]],obj["async"]),Fay$$jsToFay(["defined",[["function",[["user","JQXHR",[]],["user","AjaxSettings",[argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],argTypes && (argTypes)[1] ? (argTypes)[1] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]],["action",[argTypes && (argTypes)[2] ? (argTypes)[2] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],obj["beforeSend"]),Fay$$jsToFay(["defined",[["bool"]]],obj["cache"]),Fay$$jsToFay(["defined",[["function",[["user","JQXHR",[]],["string"],["action",[argTypes && (argTypes)[4] ? (argTypes)[4] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],obj["complete"]),Fay$$jsToFay(["defined",[["string"]]],obj["contentType"]),Fay$$jsToFay(["defined",[["bool"]]],obj["crossDomain"]),Fay$$jsToFay(["defined",[argTypes && (argTypes)[7] ? (argTypes)[7] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]],obj["data'"]),Fay$$jsToFay(["defined",[["string"]]],obj["dataType"]),Fay$$jsToFay(["defined",[["function",[["user","JQXHR",[]],["user","Maybe",[["string"]]],["user","Maybe",[["string"]]],["action",[argTypes && (argTypes)[9] ? (argTypes)[9] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],obj["error'"]),Fay$$jsToFay(["defined",[["bool"]]],obj["global"]),Fay$$jsToFay(["defined",[["bool"]]],obj["ifModified"]),Fay$$jsToFay(["defined",[["bool"]]],obj["isLocal"]),Fay$$jsToFay(["defined",[["string"]]],obj["mimeType"]),Fay$$jsToFay(["defined",[["string"]]],obj["password"]),Fay$$jsToFay(["defined",[["bool"]]],obj["processData"]),Fay$$jsToFay(["defined",[["function",[argTypes && (argTypes)[16] ? (argTypes)[16] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],["action",[argTypes && (argTypes)[16] ? (argTypes)[16] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"]]]]]]],obj["success"]),Fay$$jsToFay(["defined",[["double"]]],obj["timeout"]),Fay$$jsToFay(["defined",[["string"]]],obj["type'"]),Fay$$jsToFay(["defined",[["string"]]],obj["url"]),Fay$$jsToFay(["defined",[["string"]]],obj["username"]));
  }
  if (obj["instance"] === "Show") {
    return new $_JQuery$Show();
  }
  if (obj["instance"] === "Hide") {
    return new $_JQuery$Hide();
  }
  if (obj["instance"] === "Toggle") {
    return new $_JQuery$Toggle();
  }
  if (obj["instance"] === "FadeIn") {
    return new $_JQuery$FadeIn();
  }
  if (obj["instance"] === "FadeOut") {
    return new $_JQuery$FadeOut();
  }
  if (obj["instance"] === "FadeToggle") {
    return new $_JQuery$FadeToggle();
  }
  if (obj["instance"] === "Instantly") {
    return new $_JQuery$Instantly();
  }
  if (obj["instance"] === "Slow") {
    return new $_JQuery$Slow();
  }
  if (obj["instance"] === "Fast") {
    return new $_JQuery$Fast();
  }
  if (obj["instance"] === "Speed") {
    return new $_JQuery$Speed(Fay$$jsToFay_double(obj["slot1"]));
  }
  if (obj["instance"] === "Animation") {
    return new $_JQuery$Animation(Fay$$jsToFay(["user","AnimationType",[]],obj["_type"]),Fay$$jsToFay(["user","Speed",[]],obj["_speed"]),Fay$$jsToFay(["user","Maybe",[["user","Animation",[]]]],obj["_nextAnimation"]),Fay$$jsToFay(["user","JQuery",[]],obj["_element"]));
  }
  if (obj["instance"] === "WithoutDataAndEvents") {
    return new $_JQuery$WithoutDataAndEvents();
  }
  if (obj["instance"] === "WithDataAndEvents") {
    return new $_JQuery$WithDataAndEvents();
  }
  if (obj["instance"] === "DeepWithDataAndEvents") {
    return new $_JQuery$DeepWithDataAndEvents();
  }
  if (obj["instance"] === "KeyUp") {
    return new $_JQuery$KeyUp();
  }
  if (obj["instance"] === "KeyDown") {
    return new $_JQuery$KeyDown();
  }
  if (obj["instance"] === "KeyLeft") {
    return new $_JQuery$KeyLeft();
  }
  if (obj["instance"] === "KeyRight") {
    return new $_JQuery$KeyRight();
  }
  if (obj["instance"] === "KeyRet") {
    return new $_JQuery$KeyRet();
  }
  if (obj["instance"] === "SomeKey") {
    return new $_JQuery$SomeKey(Fay$$jsToFay_double(obj["slot1"]));
  }
  if (obj["instance"] === "Just") {
    return new $_Prelude$Just(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Nothing") {
    return new $_Prelude$Nothing();
  }
  if (obj["instance"] === "Left") {
    return new $_Prelude$Left(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Right") {
    return new $_Prelude$Right(Fay$$jsToFay(argTypes && (argTypes)[0] ? (argTypes)[0] : (type)[0] === "automatic" ? ["automatic"] : ["unknown"],obj["slot1"]));
  }
  if (obj["instance"] === "Ratio") {
    return new $_Prelude$Ratio(Fay$$jsToFay_int(obj["slot1"]),Fay$$jsToFay_int(obj["slot2"]));
  }
  if (obj["instance"] === "GT") {
    return new $_Prelude$GT();
  }
  if (obj["instance"] === "LT") {
    return new $_Prelude$LT();
  }
  if (obj["instance"] === "EQ") {
    return new $_Prelude$EQ();
  }
  return obj;
};

// Exports
this.FayExample$addOnload = FayExample$addOnload;
this.FayExample$main = FayExample$main;
this.FayExample$onload = FayExample$onload;
this.FayExample$$_void = FayExample$$_void;

// Built-ins
this._ = Fay$$_;
this.$           = Fay$$$;
this.$fayToJs    = Fay$$fayToJs;
this.$jsToFay    = Fay$$jsToFay;

};
;
var main = new FayExample();
main._(main.FayExample$main);

