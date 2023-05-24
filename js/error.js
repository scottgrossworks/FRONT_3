/**
 * 
 */


const BUG_EMAIL = "scottgrossworks@gmail.com";


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
    
    console.error(src + "=>" + errMsg);
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
    errMsg = src + "=>" + errMsg;
    console.error("Throwing Error: " + errMsg);        

    throw new LeedzError(errMsg);
}





export function errorModal( error, no_close ) {

  let modal = document.getElementById("error_modal");
  modal.setAttribute("no_close", no_close);

  let errorString = modal.getAttribute("err_str");

  if ((errorString == null) || errorString == "") {
    errorString = error + "<BR>";
  } else {
    errorString = errorString + "<BR>" + error;
  }

  modal.setAttribute("err_str", errorString);

  let theMsg = modal.children[1]; /* the error text */
  theMsg.style.width = "90%";

  let email_link = "<a href='mailto:" + BUG_EMAIL + "'> Report Bug</a>";
  theMsg.innerHTML = errorString + "<BR><BR>" + email_link;

  modal.style.display = "block";
}





