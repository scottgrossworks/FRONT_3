/**
 * 
 */


class LeedzError extends Error {
    constructor(message) {
      super(message);
      this.name = "LeedzError"; 
    }
  }


/**
 *
 */
export function printError( src, error ) {

    let errMsg = null;
    if (error instanceof Error) {
        errMsg = error.message;
    } else {
        errMsg = error;
    }
    
    console.error("[" + src + "] => " + errMsg);
  }



/**
 * 
 */
export function throwError(src, error) {

    let errMsg = null;
    if (error instanceof Error) {
      errMsg = error.message;
     }  else {
        errMsg = error;
    }
    errMsg = "[" + src + "]=>" + errMsg;
    // console.error("Throwing Error: " + errMsg);        

    throw new LeedzError(errMsg);
}