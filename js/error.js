/**
 * 
 */


const BUG_EMAIL = "scottgrossworks@gmail.com";
const ERR_KEY = "er";


let IS_SHOWING = false;


class LeedzError extends Error {

  constructor(message) {
      super(message);
      this.name = "LeedzError";
      this.src = null;
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

    const the_error = new LeedzError(errMsg);
    the_error.src = src;

    throw the_error;
}



export function errorModalClose() {

    if (! IS_SHOWING) return;

    let error = document.getElementById("error_modal");
    error.style.display = "none";

    error.setAttribute(ERR_KEY, "");

    IS_SHOWING = false;
}



/**
 * CLOSE (ANY) MODAL DIALOG
 */
export function modalClose( force ) {

  if (force) errorModalClose();

  // close all modal dialogs
  var modals = document.getElementsByClassName("info_modal");
  for (var i = 0; i < modals.length; i++) {
    
    if (modals[i].id == "error_modal") {
      continue;

    } else if (force) {
      modals[i].style.display = "none";
    
    } else if (!  modals[i].classList.contains("modal_noclose")) {
      modals[i].style.display = "none";
    }

  }
}
window.modalClose = modalClose;


/**
 * 
 *
 */
export function errorModal( error, noclose ) {

  // Change back to normal cursor
  document.body.style.cursor = 'default';

  let modal = document.getElementById("error_modal");
  if (noclose) {
    modal.classList.add('modal_noclose');
  } else {
    modal.classList.remove('modal_noclose');
  }
  let errorString = modal.getAttribute( ERR_KEY );

  if ((errorString == null) || errorString == "") {
    errorString = error + "<BR>";
  } else {
    errorString = errorString + "<BR>" + error;
  }

  modal.setAttribute(ERR_KEY, errorString);

  let theMsg = modal.children[2]; /* the error text */
  theMsg.style.width = "90%";

  let email_link = "<a href='mailto:" + BUG_EMAIL + "'> Report Bug</a>";
  theMsg.innerHTML = errorString + "<BR><BR>" + email_link;


  modal.style.display = "block";
  
  IS_SHOWING = true;
}





