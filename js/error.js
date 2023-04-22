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

    errorMsg = "[" + src + "]=>" + error;
    console.error("Throwing Error: " + errorMsg);        

    throw new LeedzError(errorMsg);
}