/**
 * 
 */
import { getCurrentUser, isSubscribed } from "./user.js";
import { errorModal, printError, throwError } from "./error.js";
import { db_getLeedz, db_updateLeed, CHG_LEED, DEL_LEED, BUY_LEED, ADD_LEED, REP_LEED, DB_FAIL } from "./dbTools.js";

import { getMonth,getYear } from "./dates.js";



/**

LEED PREVIEW
        {
            "sk": 12345678, 
            "ti": "This is Leed ID 1001 fun times",
            "cr": "dave.reyes", 
            "zp": "90034", 
            "st": 1680635460000, 
            "et": 1680639060000, 
            "pk": "leed#caricatures"
            "op": "0000021122110"
        },

LEED DETAILS
    {
        "sk": 12345678,
        "pk": "leed#airbrush", 
        "lc": "1001 Airbrush Lane, Los Angeles, CA 90056",  
        "dt": "1004 staff app1 These are the potentially-longwinded leed details for staff appreciation party, leed id: 1004",
        "rq": "1004 staff app2 These are the requirements for the gig.  This may include things like insurance, call-time, NDAs and attire.",
        "em": "scottgrossworks@gmail.com",
        "ph": "1234567890",
        "pr": "40",
        
    }

    1/2024
    Added SQUARE Payment QuickCheckout Link
    sq_url
    SQUARE Order ID
    sq_oid
    not part of options or anything shown to client 
*
*/




export const LEED_KEYS = {
  
  ID: 0,
  TI: 1,
  CR: 2,
  TN: 3,
  ZP: 4,

  LC: 5,
  ST: 6,
  ET: 7,
  EM: 8,
  PH: 9,
  DT: 10,
  RQ: 11,
  
  PR: 12,
};






//
// 13 chars long
// 3 states
// 0 - locked showing
// 1 - showing
// 2 - hidden
//
//
// HIDE_ALL_OPTS = "0000022222220"
export const SHOW_ALL_OPTS = "0000000000000";
export const START_OPTS = "0000020022110";
export const OPTS_LOCKED  = 0;
export const OPTS_SHOWING = 1;
export const OPTS_HIDDEN  = 2;

export const MAX_LEED_PRICE = 200;

export const CURRENT_LEED_KEY ="CL";
export const LEEDZ_CAL_KEY = "LC";


const CACHE_DELIM = "|";

let CURRENT_LEED = blankLeedObject();


/**
 * 
 */
export function changeLeedOpts( theLeed, index, newVal ) {
  
  if (! theLeed) {
    throwError("changeLeedOpts", "null Leed object");
  }

  // can't do a direct op[index] = newVal
  // must do a substring + insert + concatenate
  theLeed.op = theLeed.op.substring(0, index) + newVal + theLeed.op.substring( index + 1 );
  // console.log("LEED OPTS=" + theLeed.op);
}


/**
 *
 * 
 */
export async function loadLeedzFromDB( subs, firstDay, lastDay, zip_home, zip_radius, theCallback ) {
    

  // API request --> DB 
  // load leedz for this trade and date range showing
  //
  let results = null;
  try {
      // 
      //  client <---> API Gateway <===> DB
      //
      // get the leedz for all trade names in subs and the dates showing
      results = await db_getLeedz( subs, firstDay, lastDay, zip_home, zip_radius );


  } catch (error) {   
      printError( "DB getLeedz", error.message );
      printError( "Received JSON", results);
      
      // EXIT FUNCTION HERE
      // throwError( "loadLeedzFromDB", error);
      errorModal("Cannot load Leedz from DB: " + error.message, false); 
      return;
  }


  console.log(results);

    // query returns empty result set
    if (results.length == 0) {

      // CLEAR the CACHE for this date
      var cache_key = LEEDZ_CAL_KEY + getMonth() + getYear();
      window.localStorage.setItem( cache_key, "");

    } else { 

      saveLeedzToCache( results, getMonth(), getYear() );
    
    }

    // the callback function will populate the calendar and update the cache
    theCallback( results );
}




/**
 * create an empty JSON-compatible leed object
 */
export function blankLeedObject() {
  
    const BLANK_LEED = new Object();

    BLANK_LEED.id = null;
    BLANK_LEED.ti = null;

    BLANK_LEED.cr = null;

    BLANK_LEED.tn = null;

    BLANK_LEED.zp = null;
    BLANK_LEED.lc = null;

    BLANK_LEED.st = null;
    BLANK_LEED.et = null;

    BLANK_LEED.em = null;
    BLANK_LEED.ph = null;

    BLANK_LEED.dt = null;
    BLANK_LEED.rq = null;

    BLANK_LEED.pr = null;

    BLANK_LEED.op = START_OPTS;

    // Square QuickPayment Link / Order ID
    BLANK_LEED.sq_url = null;
    BLANK_LEED.sq_oid = null;

    return BLANK_LEED;
  }
  
  



/**
 * will NEVER be null
 */
export function getCurrentLeed() {

    if (! CURRENT_LEED)
        throwError("getCurrentLeed", "CURRENT_LEED is null");

    if (CURRENT_LEED.id == null) {
        // CURRENT_LEED is blank
        // go back to cache
        loadCacheLeed();  
    }


    return CURRENT_LEED;
}



/**
 *
 * 1/2024 added Square info
 * going with bracket notation for more robust implementation in cases where key or values are undefined
 */
export function setCurrentLeed( jsonObj ) {
    
	if (! jsonObj)
        throwError("setCurrentLeed", "leed JSON is null");
  

    if (jsonObj['sk']) CURRENT_LEED.id = jsonObj['sk'];
   
    if (jsonObj['ti']) CURRENT_LEED.ti = jsonObj['ti'];
    
    if (jsonObj['cr']) CURRENT_LEED.cr = jsonObj['cr'];

    // user#scott.gross
    if (jsonObj['pk']) CURRENT_LEED.tn = jsonObj['pk'].substr(5);

    if (jsonObj['zp']) CURRENT_LEED.zp = jsonObj['zp'];
    if (jsonObj['lc']) CURRENT_LEED.lc = jsonObj['lc'];
    
    if (jsonObj['st']) CURRENT_LEED.st = jsonObj['st'];
    if (jsonObj['et']) CURRENT_LEED.et = jsonObj['et'];

    if (jsonObj['em']) CURRENT_LEED.em = jsonObj['em'];

    if ((jsonObj['ph']) && (jsonObj['ph'] != '0')) {
		CURRENT_LEED.ph = jsonObj['ph'];
    } 
    
    if (jsonObj['dt']) CURRENT_LEED.dt = jsonObj['dt'];
    if (jsonObj['rq']) CURRENT_LEED.rq = jsonObj['rq'];

    if (jsonObj['pr']) CURRENT_LEED.pr = jsonObj['pr'];

    if (jsonObj['op']) CURRENT_LEED.op = jsonObj['op'];

    // SQUARE PAYMENT LINK / ORDER ID
    if ( jsonObj['sq_url'] )  CURRENT_LEED.sq_url = jsonObj['sq_url'];
    if ( jsonObj['sq_oid'] )  CURRENT_LEED.sq_oid = jsonObj['sq_oid'];

    cacheCurrentLeed( CURRENT_LEED );

    return CURRENT_LEED;
}



/**
 * 
 */
export function clearCurrentLeed() {

    CURRENT_LEED.id = null;

    CURRENT_LEED.ti = null;

    CURRENT_LEED.cr = null;

    CURRENT_LEED.tn =null;
    
    CURRENT_LEED.zp = null;
    CURRENT_LEED.lc = null;

    CURRENT_LEED.em = null;
    CURRENT_LEED.ph = null;

    CURRENT_LEED.st = null;
    CURRENT_LEED.et = null;

    CURRENT_LEED.dt = null;
    CURRENT_LEED.rq = null;

    CURRENT_LEED.pr = null;

    CURRENT_LEED.op = START_OPTS;

    // SQUARE PAYMENT LINK /  OrderID
    CURRENT_LEED.sq_url = null;
    CURRENT_LEED.sq_oid = null;
    
    cacheCurrentLeed( blankLeedObject() );
    
}





/**
 * 
 */
export function isLeedActive() {
    
    if (! CURRENT_LEED)
        throwError("isLeedActive", "CURRENT_LEED is null");

    return (CURRENT_LEED.id != null);
}





/**
 * 
 *
 */
export function cacheCurrentLeed( theLeed ) {

    if (! theLeed)
        throwError("cacheLeed", "Cannot cache null leed");

    let leedJSON = null;
    try {
        leedJSON = JSON.stringify( theLeed );
    } catch (error) {
        printError("cacheLeed", "Cannot convert leed to JSON");
        console.error(theLeed);
        throwError("cacheLeed", "Invalid leed for cache");
    }
   

    window.localStorage.setItem( CURRENT_LEED_KEY, leedJSON );
}






/**
 * MAY return null 
 *
 */
 function loadCacheLeed() {

    const leedJSON = window.localStorage.getItem( CURRENT_LEED_KEY );
    if (! leedJSON) {
      // this is not an error -- will happen any time program starts with empty cache  
      // printError("loadCacheLeed", "No value in cache for key: " + CURRENT_LEED_KEY);
        CURRENT_LEED = blankLeedObject();
        return;
    }

    let cacheObj = null;
    try {
        cacheObj = JSON.parse( leedJSON );

    } catch (error) {
        printError("loadCacheLeed", "Invalid JSON: " + leedJSON);
        throwError("loadCahceLeed", "Cannot load leed from cache KEY=" + CURRENT_LEED_KEY);
    }

    CURRENT_LEED.id = cacheObj['id'];

    CURRENT_LEED.tn = cacheObj['tn'];

    CURRENT_LEED.cr = cacheObj['cr'];

    CURRENT_LEED.ti = cacheObj['ti'];

    CURRENT_LEED.zp = cacheObj['zp'];

    CURRENT_LEED.st = cacheObj['st'];

    CURRENT_LEED.et = cacheObj['et'];

    CURRENT_LEED.lc = cacheObj['lc'];

    CURRENT_LEED.em = cacheObj['em'];

    CURRENT_LEED.ph = cacheObj['ph'];

    CURRENT_LEED.dt = cacheObj['dt'];

    CURRENT_LEED.rq = cacheObj['rq'];

    CURRENT_LEED.pr = cacheObj['pr'];

    CURRENT_LEED.op = cacheObj['op'];

    // SQUARE PAYMENT LINK / ORDER ID
    CURRENT_LEED.sq_url = cacheObj['sq_url'];
    CURRENT_LEED.sq_oid = cacheObj['sq_oid'];

}





/**
 *
 */
export function saveLeedzToCache( new_leedz, the_month, the_year ) {


  let cache_leedz = [];
  for (var i = 0;i < new_leedz.length; i++) {
    var new_leed = new_leedz[i];
    // console.log( "LEED ID==" + i + "==" + new_leed.id );
    cache_leedz.push( new_leed );
  }

  // RESTORE CACHE
  // serialize array using CACHE_DELIM
  let JSON_leedz = "";
  cache_leedz.forEach( (leed) => {
      JSON_leedz = JSON_leedz + JSON.stringify(leed) + CACHE_DELIM;  
  });


  // rewrite to session storage
  // 
  var cache_key = LEEDZ_CAL_KEY + the_month + the_year;
  window.localStorage.setItem( cache_key, JSON_leedz);

}




/**
 * will check to see if user is still subscribed to cached trade
 * updates cache accordingly
 */
export function loadLeedzFromCache( the_month, the_year ) {

    // GET CACHE 
    // lists of JSON leedz are cached by month 
    var cache_key = LEEDZ_CAL_KEY + the_month + the_year;

    let JSON_leedz = window.localStorage.getItem( cache_key );

    if ( (! JSON_leedz) || JSON_leedz == "" || JSON_leedz == CACHE_DELIM) {
      // there may be nothing in the cache -- this is not an eror 
      return [];
    }

    // LOAD LEEDZ
    // load the cache leedz for this dateString
    const cacheLeedz = JSON_leedz.split( CACHE_DELIM );
    let retLeedz = [];



    // for each JSON leed loaded from CACHE
    for (var i = 0; i < cacheLeedz.length; i++) {
  
        var theJSON = cacheLeedz[i];
        if ((! theJSON) || (theJSON == "") || (theJSON == CACHE_DELIM)) continue; // just be safe

        // (re)create leed node using cache data
        var theLeed = JSON.parse( theJSON );
   
        // is the user stil subscribed to leedz of this trade?
        // pk = "leed#caricatures"
        let trade_name = theLeed.pk.substr(5);
        if ( isSubscribed( trade_name ) ) {
            // if user has unsubscribed since last cache save
            // do NOT return it or re-add it to the cache
            retLeedz.push( theLeed );       
        }
      }
                

    // REWRITE CACHE
    // reserialize retLeedz into a String with delimeters
    JSON_leedz = ""; // start wtih fresh JSON

    if (retLeedz.length > 0) {
      retLeedz.forEach( (leed) => {
          JSON_leedz = JSON_leedz + JSON.stringify(leed) + CACHE_DELIM;
      });
    }


    // put JSON back where it came from
    window.localStorage.setItem( cache_key, JSON_leedz);


    // return the list of (still subscribed) leedz from cache
    return retLeedz;
    
}




/** 
 *
 * the leed has updated info
 * JSON-serialize the changes
 */
export async function saveLeedChanges( leedObj ) {

  
  if (! leedObj)
    throwError("saveLeedChanges", "null leed object");

  if (CURRENT_LEED == null)
    throwError("saveLeedChanges", "CURRENT_LEED is null");


  /*
   * cannot be changed
    */
    CURRENT_LEED.id = leedObj.id;

    CURRENT_LEED.cr = leedObj.cr;

    CURRENT_LEED.ti = leedObj.ti;

    CURRENT_LEED.tn = leedObj.tn;

    CURRENT_LEED.zp = leedObj.zp;

    CURRENT_LEED.lc = leedObj.lc;

    CURRENT_LEED.st = leedObj.st;

    CURRENT_LEED.et = leedObj.et;

    CURRENT_LEED.em = leedObj.em;

    CURRENT_LEED.ph = leedObj.ph;

    CURRENT_LEED.dt = leedObj.dt;

    CURRENT_LEED.rq = leedObj.rq;

    CURRENT_LEED.pr = leedObj.pr;

  if ((leedObj.op != null) && (leedObj.op.length != 0))
    CURRENT_LEED.op = leedObj.op;
  else
    CURRENT_LEED.op = START_OPTS;

    // SQUARE PAYMENT LINK / ORDER ID
    if (leedObj.sq_url) CURRENT_LEED.sq_url = leedObj.sq_url;
    if (leedObj.sq_oid) CURRENT_LEED.sq_oid = leedObj.sq_oid;

    try {
      // cache this Leed   
      cacheCurrentLeed( CURRENT_LEED );
  
    } catch (error) {
      throwError("cacheCurrentLeed", error);
    }


    // console.log("----------> ******** POSTING LEED CHANGES TO SERVER ******* ");
    // console.log(CURRENT_LEED);
 
    // API request --> DB 
    // save leed to DB
    //
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        results = await db_updateLeed( CHG_LEED, getCurrentUser(false), CURRENT_LEED );

        // should never happen
        if (results == null) {
          throwError("Update Leed", "Null response received from server");
        }

        /**
         * 
         *    result = "{'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1}" 
         *    {'id': 1259743,'ti':This is the title,'pr':44,'cd': 1}
         * 1 == SUCCESS
         */
        // received error code
        if (results.cd == DB_FAIL) {
          throwError("Update Leed", results.er);
        }


    } catch (error) {   
        printError( "db_updateLeed", error.message );
        printError( "Received JSON", results);
        

        // EXIT FUNCTION HERE
        // throwError( "Update Leed", error); 
        errorModal("Cannot update leed: " + error.message, false);
        return results;

    }


    return results;
}








/**
 * 
 */
export async function createDBLeed( current_user, leedObj ) {

  if (! leedObj)
    throwError("saveLeedChanges", "null leed object");

    // console.log("----------> ******** POSTING NEW LEED TO SERVER ******* ");
    // console.log(leedObj);
 
    // API request --> DB 
    // save leed to DB
    //
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        results = await db_updateLeed( ADD_LEED, current_user, leedObj );

        // should never happen
        if (results == null) {
          throwError("Add Leed", "Null response received from server");
        }

        /**
         * 
         *    result = "{'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1}" 
         *    {'id': 1259743,'ti':This is the title,'pr':44,'cd': 1}
         * 1 == SUCCESS
         */
        // received error code
        if (results.cd == DB_FAIL) {
          printError("db_updateLeed", results.er);
          throwError("Create Leed", results.er);
        }


    } catch (error) {   
        printError( "Add Leed", error.message );
        printError( "Received JSON", results);
        
        // EXIT FUNCTION HERE
        throwError( "Cannot Add Leed", error); 
        // return results;

    } 


    return results;
}













/** 
 * STEP 1 of BUY LEED process
 * call Leedz API buyLeed() -- return Square Order data
 */
export async function buyCurrentLeed() {

  if (! CURRENT_LEED)
    throwError("buyCurrentLeed", "CURRENT_LEED is null");

    const current_user = getCurrentUser(false);
 
    // API request --> DB 
    // save leed to DB
    //
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        results = await db_updateLeed( BUY_LEED, current_user, CURRENT_LEED );
        
        // should never happen
        if (results == null) {
          throwError("Buy Leed", "Null response received from server");
        }

        // received error code
        if (results.cd == DB_FAIL) {
          throwError("Buy Leed", results.msg);
        }


    } catch (error) {   
        printError( "db_updateLeed", error.message );
        printError( "Received JSON", results);
        
        // EXIT FUNCTION HERE
        // throwError("Buy Leed", error);
        errorModal("Cannot buy leed: " + error.message, false);
        return results; 

    }


    return results;
}







/** 
 *
 * DELETE the Leed
 */
export async function deleteCurrentLeed() {

  if (! CURRENT_LEED)
    throwError("deleteCurrentLeed", "CURRENT_LEED is null");

    const current_user = getCurrentUser(false);
 
    // API request --> DB 
    // delete leed to DB
    //
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        results = await db_updateLeed( DEL_LEED, current_user, CURRENT_LEED );
        
        // should never happen
        if (! results) {
          throwError("Delete Leed", "Null response received from server");
        }

        // received error code
        if (results.cd == DB_FAIL) {
          throwError("Delete Leed", results.msg);
        }


    } catch (error) {   
        printError( "db_updateLeed", error.message );
        printError( "Received JSON", results);
        
        // EXIT FUNCTION HERE
        // throwError("Delete Leed", error);
        // errorModal("Cannot delete leed: " + error.message, true); 
        return results;
    }

  
    console.log("BACK FROM DB DELETE RESULTS=" + results);

    return results;
}




/** 
 *
 * REPORT the Leed
 */
export async function reportCurrentLeed() {

  if (! CURRENT_LEED)
    throwError("reportCurrentLeed", "CURRENT_LEED is null");
 
    console.log("----------> ******** REPORTING CURRENT LEED TO SERVER ******* ");

    // API request --> DB 
    // report leed to DB
    //
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        results = await db_updateLeed( REP_LEED, getCurrentUser(false), CURRENT_LEED );
        
        // should never happen
        if (results == null) {
          throwError("Report Leed", "Null response received from server");
        }

        // received error code
        if (results.cd == DB_FAIL) {
          throwError("Report Leed", results.msg);
        }


    } catch (error) {   
        printError( "DB Report Leed", error.message );
        printError( "Received JSON", results);
        
        // EXIT FUNCTION HERE
        // throwError( "db_reportLeed", error); 
        errorModal("Error reporting leed: " + error.message, false); 
        return results;
    }


    console.log("BACK FROM DB REPORT RESULTS=" + results);
    return results;
}

