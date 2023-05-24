/**
 * dbTools.js
 * 
 *  
 */


import { printError, throwError } from "./error.js";



export const API_GATEWAY = "http://localhost:3000/"

export const USERNAME_URL_PARAM = "un";

export const SUBS_URL_PARAM = "sb";
export const START_DATE_URL_PARAM = "ds";
export const END_DATE_URL_PARAM = "de";

export const LEED_ID_URL_PARAM = "id";




/**
 * returns JSON list [ { key = "value" }, { key = "value" }, ... ] object
 * 
 */
export async function db_getTrades() {

    try {

        const theURL = new URL(API_GATEWAY + "getTrades");
        let json_obj= null;
          
        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });

        
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
    let json_obj = null;

    try {

        const theURL = new URL(API_GATEWAY + "getUser");
        const params = new URLSearchParams({ [USERNAME_URL_PARAM]: username });
        theURL.search = params.toString();
        
        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });



    } catch (error) {
        printError("db_getUser()", error.message);
        throwError("db_getUser()", error);
    }


    return json_obj;  // SHOULD NOT BE NULL
}    






/**
 * Get the full leed details for this leed
 * 
 */
export async function db_getDeetz( leed_id ) {
    
    // GET JSON from http server

    let json_obj = null;
    try {
    
        const theURL = new URL(API_GATEWAY + "getDeetz");
        let searchParams = new URLSearchParams();
        searchParams.append( LEED_ID_URL_PARAM, leed_id );
        theURL.search = searchParams.toString();


        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });

    
    } catch (error) {
        printError("db_getDeetz()", error.message);
        throwError("db_getDeetz()", error);
    }

    return json_obj;  // SHOULD NOT BE NULL


}




/**
 * 
 * 
 */
export async function db_getLeedz( subs, start_date, end_date ) {

    if (subs == null || start_date == null || end_date == null ) {
        throwError("db_getLeedz()", "null / undefined args");
    }
    

    let subs_string = "";
    for (const trade_name of subs) {
        subs_string += trade_name + ",";
    }
    subs_string = subs_string.slice(0, -1);

    let json_obj = null;

    try {

        const theURL = new URL(API_GATEWAY + "getLeedz");
        let searchParams = new URLSearchParams();
        searchParams.append( SUBS_URL_PARAM, subs_string );
        searchParams.append( START_DATE_URL_PARAM, start_date );
        searchParams.append( END_DATE_URL_PARAM, end_date );
        theURL.search = searchParams.toString();

        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });


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
async function doGet( theURL ) {

    return fetch(theURL,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Connection':'close'
            },
        timeout:"4000"
        }
    ).then(response => {
    
        if (! response.ok) {
           throw new Error('Network response was not ok');
        }
        return response.json();
    })

    .catch(error => {
        printError("fetch", error);
        throwError("fetch", error);
    });

}
      





/**
 * 
 *
 */
async function doPost( theURL, params ) {

    return fetch(theURL,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Connection':'close'
            },
        timeout:"4000",
        body:params
        }
    ).then(response => {
    
        if (! response.ok) {
           throw new Error('Network response was not ok');
        }
        
        return response.json();
    })
    .catch(error => {
        printError("fetch", error);
        throwError("fetch", error);
    });
}