/**
 * dbTools.js
 * 
 *  
 */


import { printError, throwError } from "./error.js";

const API_GATEWAY = "http://localhost:3000/"

const USERNAME_URL_PARAM = "u";

const TRADE_NAME_URL_PARAM = "t";
const START_DATE_URL_PARAM = "s";
const END_DATE_URL_PARAM = "e";



/**
 * returns JSON list [ { key = "value" }, { key = "value" }, ... ] object
 * 
 */
export async function getTrades() {

    const theURL = new URL(API_GATEWAY + "/getTrades");

    
    try {
        let response = doFetch( theURL );
        let json_obj = JSON.parse( response );

        return json_obj;

    } catch (error) {

        printError("getTrades() JSON parse syntax error", error.message);
        throwError( error );

    }
    return null;

}


/**
 * returns JSON user object
 */
export async function getUser( username ) {
    
    if (username == null) {
        throwError("getUser()", "no username provided");
    }

    const theURL = new URL(API_GATEWAY + "/getUser");
    let searchParams = new URLSearchParams();
    searchParams.append( USERNAME_URL_PARAM, username );
    theURL.search = searchParams;

    let response = null;
    let json_obj = null;

    // GET JSON from http server
    try {
        // will throw its own exceptions on network error
        response = doFetch(theURL);
        if (response == null) throw new Error("doFetch() returns null");

    } catch (error) {
        printError("doFetch(" + theURL + ")", error.message);
        throwError("getUser()", error);
    }

    // PARSE and validate the JSON
    try {
        json_obj = JSON.parse(response);        
        if (json_obj == null) throw new Error("JSON.parse() returns null");


    } catch (error) {
        printError("JSON.parse()", error.message);
        throwError("getUser()", error);
    }

    return json_obj;  // SHOULD NOT BE NULL
}






/**
 * 
 * 
 */
export async function getDeetz( leed_id ) {
    return null;
}



/**
 * 
 * 
 */
export async function getLeedz( trade_name, start_date, end_date ) {

    if (trade_name == null || start_date == null || end_date == null ) {
        throwError("getLeedz()", "null / undefined args");
    }
  
    const theURL = new URL(API_GATEWAY + "/getLeedz");
    let searchParams = new URLSearchParams();
    searchParams.append( TRADE_NAME_URL_PARAM, trade_name );
    searchParams.append( START_DATE_URL_PARAM, start_date );
    searchParams.append( END_DATE_URL_PARAM, end_date );
    theURL.search = searchParams;

    let response = null;
    let json_obj = null;



    // GET JSON from http server
    try {
        // will throw its own exceptions on network error
        response = doFetch(theURL);
        if (response == null) throw new Error("doFetch() returns null");

    } catch (error) {
        printError("doFetch()", error.message);
        throwError("getLeedz()", error);
    }

    // PARSE and validate the JSON
    try {
        json_obj = JSON.parse(response);        
        if (json_obj == null) throw new Error("JSON.parse() returns null");


    } catch (error) {
        printError("JSON.parse()", error.message);
        throwError("getLeedz()", error);
    }

    return json_obj;  // SHOULD NOT BE NULL
}




/**
 * 
 *
 */
async function doFetch( theURL ) {

    return fetch(theURL, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

    .catch(error => {
        
        printError("doFetch()", theURL);
        throwError("doFetch()", error.message);
    });

}



/**
 * 
 *
async function doFetch( theURL ) {

    return fetch(theURL, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
    .then(response => response.json())
    .catch(error => {
        
        console.error("Error with URL: " + theURL);
        // parsing error
        if (error instanceof SyntaxError) {
            console.error("Fetch JSON Syntax Error: " + error.message);
        } else {
            console.error("Fetch Error: " + error.message);    
        }
        return {};
    });

}
*/