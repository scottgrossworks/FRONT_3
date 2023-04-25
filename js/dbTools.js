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

const LEED_ID_URL_PARAM = "l";




/**
 * returns JSON list [ { key = "value" }, { key = "value" }, ... ] object
 * 
 */
export async function db_getTrades() {

    const theURL = new URL(API_GATEWAY + "/getTrades");

    
    try {

        let response = await doFetch( theURL );

        let json_obj = response.json();

        return json_obj;

    } catch (error) {

        printError("db_getTrades()", error);
        throwError( error );

    }
    return null;

}


/**
 * returns JSON user object
 */
export async function db_getUser( username ) {
    
    if (username == null) {
        throwError("db_getUser()", "no username provided");
    }

    const theURL = new URL(API_GATEWAY + "/getUser");
    let searchParams = new URLSearchParams();
    searchParams.append( USERNAME_URL_PARAM, username );
    theURL.search = searchParams;

    let response = null;
    let json_obj = null;

    // GET JSON from http server
    try {

        console.log("ABOUT TO getUser.doFetch()");

        // will throw its own exceptions on network error
        response = await doFetch(theURL);
        if (response == null) throw new Error("doFetch() returns null");

        console.log("BACK FROM getUser.doFetch()");



    } catch (error) {
        printError("doFetch(" + theURL + ")", error.message);
        throwError("db_getUser()", error);
    }


    console.log("db_getUser -- got user data=" + response);


    // PARSE and validate the JSON
    try {
        json_obj = response.json();        
        if (json_obj == null) throw new Error("response.json() returns null");


    } catch (error) {
        printError("response.json()", error.message);
        throwError("db_getUser()", error);
    }

    return json_obj;  // SHOULD NOT BE NULL
}






/**
 * Get the full leed details for this leed
 * 
 */
export async function db_getDeetz( leed_id ) {
    
    
    const theURL = new URL(API_GATEWAY + "/getDeetz");
    let searchParams = new URLSearchParams();
    searchParams.append( LEED_ID_URL_PARAM, leed_id );

    let response = null;
    let json_obj = null;

    
    // GET JSON from http server
    try {
        // will throw its own exceptions on network error
        response = await doFetch(theURL);
        if (response == null) throw new Error("doFetch() returns null");

    } catch (error) {
        printError("doFetch(" + theURL + ")", error.message);
        throwError("db_getDeetz()", error);
    }

    // PARSE and validate the JSON
    try {
        json_obj = response.json();        
        if (json_obj == null) throw new Error("response.json() returns null");


    } catch (error) {
        printError("response.json()", error.message);
        throwError("db_getDeetz()", error);
    }

    return json_obj;  // SHOULD NOT BE NULL


}




/**
 * 
 * 
 */
export async function db_getLeedz( trade_name, start_date, end_date ) {

    if (trade_name == null || start_date == null || end_date == null ) {
        throwError("db_getLeedz()", "null / undefined args");
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
        response = await doFetch(theURL);
        if (response == null) throw new Error("doFetch() returns null");

    } catch (error) {
        printError("doFetch()", error);
        throwError("db_getLeedz()", error.message);
    }

    // PARSE and validate the JSON
    try {
        json_obj = response.json();        
        if (json_obj == null) throw new Error("response.json() returns null");


    } catch (error) {
        printError("response.json()", error);
        throwError("db_getLeedz()", error.message);
    }

    return json_obj;  // SHOULD NOT BE NULL
}




/**
 * 
 *
 */
const fetch_headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', };
async function doFetch( theURL ) {

    return fetch(theURL, {
        method: "GET",
        headers: fetch_headers,
        mode: "no-cors"
      })

    .catch(error => {
        
        printError("doFetch()", error);
        throwError("doFetch()", error.message);
    });

}


