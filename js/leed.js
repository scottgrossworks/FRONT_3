/**
 * 
 */
import { isSubscribed } from "./user.js";
import { printError, throwError } from "./error.js";
import { db_getLeedz } from "./dbTools.js";




export const CACHE_LEED_KEY ="LD";
export const CACHE_LEEDZ_CAL_KEY = "LC";

const CACHE_DELIM = "|";

const CURRENT_LEED = blankLeedObject();





/**
 *
 * 
 */
export async function loadLeedzFromDB( subs, firstDay, lastDay ) {
    

  // API request --> DB 
  // load leedz for this trade and date range showing
  //
  let results = null;
  try {
      // 
      //  client <---> API Gateway <===> DB
      //
      // get the leedz for all trade names in subs and the dates showing
      results = await db_getLeedz( subs, firstDay, lastDay );


  } catch (error) {   
      printError( "DB getLeedz", error.message );
      printError( "Received JSON", results);
      
      // EXIT FUNCTION HERE
      throwError( "loadLeedzFromDB", error); 
  }

  // query returns empty result set
  // if (results.length == 0) { ; }

  return results;
}








/**

LEED PREVIEW
        {
            "id": 1001, 
            "creator": "dave.reyes", 
            "zip": "90034", 
            "start": 1680635460000, 
            "end": 1680639060000, 
            "trade": "caricatures",
            "note": "This is Leed ID 1001 fun times"
        },

LEED DETAILS
    {
        "id": 1004,
        "trade": "airbrush", 
        "loc": "1001 Airbrush Lane, Los Angeles, CA 90056",  
        "det": "1004 staff app1 These are the potentially-longwinded leed details for staff appreciation party, leed id: 1004",
        "reqs": "1004 staff app2 These are the requirements for the gig.  This may include things like insurance, call-time, NDAs and attire.",
        "em": "scottgrossworks@gmail.com",
        "ph": "123456789",
        "pr": "40"
    }

*/

/**
 * create an empty JSON-compatible leed object
 */
export function blankLeedObject() {
  
    const BLANK_LEED = new Object();

    BLANK_LEED.id = null;
    BLANK_LEED.creator = null;

    BLANK_LEED.trade = null;
    
    BLANK_LEED.loc = null;
    BLANK_LEED.zip = null;
    BLANK_LEED.start = null;
    BLANK_LEED.end = null;

    BLANK_LEED.em = null;
    BLANK_LEED.ph = null;

    BLANK_LEED.note = null;
    BLANK_LEED.det = null;
    BLANK_LEED.reqs = null;

    BLANK_LEED.pr = null;

    // opts should be 0000101100  long digit
    // FIXME FIXME FIXME convert between opts as digit and array of key=value pairs
    BLANK_LEED.opts = {};

    return BLANK_LEED;
  }
  
  




/**
 * will NEVER be null
 */
export function getCurrentLeed() {

    if (CURRENT_LEED == null)
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
 */
export function setCurrentLeed( jsonObj ) {

    if (jsonObj == null)
        throwError("setCurrentLeed", "leed JSON is null");
  

    CURRENT_LEED.id = jsonObj.id;

    if (jsonObj.creator != null) CURRENT_LEED.creator = jsonObj.creator;

    if (jsonObj.trade != null) CURRENT_LEED.trade = jsonObj.trade;
    if (jsonObj.zip != null) CURRENT_LEED.zip = jsonObj.zip;
    if (jsonObj.loc != null) CURRENT_LEED.loc = jsonObj.loc;
    
    if (jsonObj.start != null) CURRENT_LEED.start = jsonObj.start;
    if (jsonObj.end != null) CURRENT_LEED.end = jsonObj.end;

    if (jsonObj.em != null) CURRENT_LEED.em = jsonObj.em;
    if (jsonObj.ph != null) CURRENT_LEED.ph = jsonObj.ph;

    if (jsonObj.note != null) CURRENT_LEED.note = jsonObj.note;
    if (jsonObj.det != null) CURRENT_LEED.det = jsonObj.det;
    if (jsonObj.reqs != null) CURRENT_LEED.reqs = jsonObj.reqs;

    if (jsonObj.pr != null) CURRENT_LEED.pr = jsonObj.pr;

    // FIXME FIXME FIXME convert between opts as digit and array of key=value pairs
    if ((jsonObj.opts != null) && (jsonObj.opts.length != 0)) CURRENT_LEED.opts = jsonObj.opts;


    // console.log("CACHING LEED");
    // console.log(CURRENT_LEED);


    saveCacheLeed( CURRENT_LEED );
}





/**
 * 
 */
export function clearCurrentLeed() {

    CURRENT_LEED.id = null;
    CURRENT_LEED.creator = null;

    CURRENT_LEED.trade =null;
    
    CURRENT_LEED.zip = null;
    CURRENT_LEED.loc = null;

    CURRENT_LEED.em = null;
    CURRENT_LEED.ph = null;

    CURRENT_LEED.start = null;
    CURRENT_LEED.end = null;

    CURRENT_LEED.note = null;
    CURRENT_LEED.det = null;
    CURRENT_LEED.reqs = null;

    CURRENT_LEED.pr = null;

    // opts should be long digit
    CURRENT_LEED.opts = {};

}





/**
 * 
 */


export function isLeedActive() {
    
    if (CURRENT_LEED == null)
        throwError("isLeedActive", "CURRENT_LEED is null");

    return (CURRENT_LEED.id != null);
}







/**
 * 
 *
 */
export function saveCacheLeed( theLeed ) {

    if (theLeed == null)
        throwError("cacheLeed", "Cannot cache null leed");

    let leedJSON = null;
    try {
        leedJSON = JSON.stringify( theLeed );
    } catch (error) {
        printError("cacheLeed", "Cannot convert leed to JSON");
        console.error(theLeed);
        throwError("cacheLeed", "Invalid leed for cache");
    }
   

    window.sessionStorage.setItem( CACHE_LEED_KEY, leedJSON );
}







/**
 * MAY return null 
 *
 */
 function loadCacheLeed() {

    const leedJSON = window.sessionStorage.getItem( CACHE_LEED_KEY );
    if (leedJSON == null) {
        // printError("loadCacheLeed", "No value in cache for key: " + CACHE_LEED_KEY);
        return;
    }

    let cacheObj = null;
    try {
        cacheObj = JSON.parse( leedJSON );

    } catch (error) {
        printError("loadCacheLeed", "Invalid JSON: " + leedJSON);
        throwError("loadCahceLeed", "Cannot load leed from cache");
    }
    

    CURRENT_LEED.id = cacheObj.id;
    CURRENT_LEED.creator = cacheObj.creator;

    CURRENT_LEED.trade =cacheObj.trade;
    
    CURRENT_LEED.zip = cacheObj.zip;
    CURRENT_LEED.loc = cacheObj.loc;

    CURRENT_LEED.start = cacheObj.start;
    CURRENT_LEED.end = cacheObj.end;

    CURRENT_LEED.em = cacheObj.em;
    CURRENT_LEED.ph = cacheObj.ph;

    CURRENT_LEED.note = cacheObj.note;
    CURRENT_LEED.det = cacheObj.det;
    CURRENT_LEED.reqs = cacheObj.reqs;

    CURRENT_LEED.pr = cacheObj.pr;

    CURRENT_LEED.opts = cacheObj.opts;

}


function JSON_to_Array(jsonString) {
  
  if (jsonString == null || jsonString == "" || jsonString == CACHE_DELIM)
      return [];
  
  try {
    // split the string into an array of JSON strings
    var jsonStrings = jsonString.split('|');
    var jsonArray = [];

    for (var i = 0; i < jsonStrings.length; i++) {
      
      if (jsonStrings[i] == "") continue;
      
      try {
        jsonArray.push(JSON.parse(jsonStrings[i]));
      } catch (error) {
        printError("JSON.parse", jsonStrings[i]);
      }

    }
    return jsonArray;
  
  } catch (error) {
    printError("JSON_to_Array", "JSON Error: " + jsonString);
    return [];
  }
}



/**
 *
 */
export function saveLeedzToCache( new_leedz, the_month, the_year ) {


  var cache_key = CACHE_LEEDZ_CAL_KEY + the_month + the_year;
  let cache_string = window.sessionStorage.getItem( cache_key );  
  let cache_leedz = JSON_to_Array(cache_string);


  for (let i = 0; i < new_leedz.length; i++) {
    var new_leed = new_leedz[i];

    // look for a matching leed id already in the cache 
    for (let y = 0; y < cache_leedz.length; y++) {
      if (new_leed.id == cache_leedz[y].id) {
        cache_leedz[y] = new_leed;
        new_leed = null;
        break;
      }
    }

    if (new_leed != null) {
      // new_leed was not spliced into from_cache 
      // append it to the end
      cache_leedz.push( new_leed );
    }
  }

  // console.log("IN SAVE LEEDZ");
  // console.log(cache_leedz);

  // RESTORE CACHE
  // serialize array using CACHE_DELIM
  let JSON_leedz = "";
  cache_leedz.forEach( (leed) => {
      JSON_leedz = JSON_leedz + JSON.stringify(leed) + CACHE_DELIM;  
  });

  
    // rewrite to session storage
    // key = monthyear
    window.sessionStorage.setItem( cache_key, JSON_leedz);

}






/**
 * will check to see if user is still subscribed to cached trade
 * updates cache accordingly
 */
export function loadLeedzFromCache( the_month, the_year ) {

    // GET CACHE 
    // lists of JSON leedz are cached by month 
    var cache_key = CACHE_LEEDZ_CAL_KEY + the_month + the_year;
    let JSON_leedz = window.sessionStorage.getItem( cache_key );
    if (JSON_leedz == null || JSON_leedz == "" || JSON_leedz == CACHE_DELIM) {
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
        if ((theJSON == null) || (theJSON == "") || (theJSON == CACHE_DELIM)) continue; // just be safe

        // (re)create leed node using cache data
        var theLeed = JSON.parse( theJSON );
   
        // is the user stil subscribed to leedz of this trade?
        if ( isSubscribed( theLeed.trade ) ) {
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
    window.sessionStorage.setItem( cache_key, JSON_leedz);

    // return the list of (still subscribed) leedz from cache
    return retLeedz;
    
}





/** 
 *
 * the leed has updated info
 * JSON-serialize the changes
 */
export function saveLeedChanges( leedObj ) {

  console.log("saveLeedChanges()");
  console.log(leedObj);
  

  if (leedObj == null)
    throwError("saveLeedChanges", "null leed object");

  if (CURRENT_LEED == null)
    throwError("saveLeedChanges", "CURRENT_LEED is null");


  /*
   * cannot be changed
   *
  CURRENT_LEED.id = leedObj.id;
  CURRENT_LEED.creator = leedObj.creator;
  */


  if (leedObj.trade != null)
    CURRENT_LEED.trade = leedObj.trade;


  if (leedObj.zip != null)
    CURRENT_LEED.zip = leedObj.zip;

    
  if (leedObj.loc != null)
    CURRENT_LEED.loc = leedObj.loc;


  if (leedObj.start != null)
    CURRENT_LEED.start = leedObj.start;


  if (leedObj.end != null)
    CURRENT_LEED.end = leedObj.end;


  if (leedObj.em != null)
    CURRENT_LEED.em = leedObj.em;

    
  if (leedObj.ph != null)
    CURRENT_LEED.ph = leedObj.ph;


  if (leedObj.note != null)
    CURRENT_LEED.note = leedObj.note;
    
  if (leedObj.det != null)
    CURRENT_LEED.det = leedObj.det;

  if (leedObj.reqs != null)
    CURRENT_LEED.reqs = leedObj.reqs;


  if (leedObj.pr != null)
    CURRENT_LEED.pr = leedObj.pr;

  if ((leedObj.opts != null) && (leedObj.opts.length != 0))
    CURRENT_LEED.opts = leedObj.opts;

  
  // cache this Leed   
  saveCacheLeed( CURRENT_LEED );
  


  
  // FIXME FIXME FIXME
  // post User changes to server
  // FIXME FIXME FIXME
  // db_updateUser()
  console.log("******** POSTING LEED CHANGES TO SERVER ******* ");
  console.log("OPTS=" + leedObj.opts);
  console.log(CURRENT_LEED);
  // FIXME FIXME FIXME

}


