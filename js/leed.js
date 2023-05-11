/**
 * 
 */
import { db_getUser } from "./dbTools.js";
import { printError, throwError } from "./error.js";


export const CACHE_LEED_KEY ="L";

const CACHE_DELIM = "|";



const CURRENT_LEED = blankLeedObject();




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
        "price": "40"
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

    BLANK_LEED.note = null;
    BLANK_LEED.details = null;
    BLANK_LEED.reqs = null;

    BLANK_LEED.price = null;

    BLANK_LEED.node = null;

    return BLANK_LEED;
  }
  
  




/**
 * will NEVER be null
 */
export function getCurrentLeed() {

    if (CURRENT_LEED == null)
        throwError("getCurrentLeed", "CURRENT_LEED is null");

    return CURRENT_LEED;
}



/**
 * 
 */
export function setCurrentLeed( domNode, jsonObj ) {

    if (jsonObj == null)
        throwError("setCurrentLeed", "leed JSON is null");

    if (domNode == null)
        throwError("setCurrentLeed", "DOM node is null");

        
    CURRENT_LEED.node = domNode;
  
    CURRENT_LEED.id = jsonObj.id;
    CURRENT_LEED.creator = jsonObj.creator;

    CURRENT_LEED.trade = jsonObj.trade;
    
    CURRENT_LEED.zip = jsonObj.zip;
    CURRENT_LEED.loc = null;

    CURRENT_LEED.start = jsonObj.start;
    CURRENT_LEED.end = jsonObj.end;

    CURRENT_LEED.note = jsonObj.note;
    CURRENT_LEED.det = null;
    CURRENT_LEED.reqs = null;

    CURRENT_LEED.price = null;

    saveCacheLeed( CURRENT_LEED );
}





/**
 * 
 */
export function clearCurrentLeed() {

    CURRENT_LEED.node = null;
  
    CURRENT_LEED.id = null;
    CURRENT_LEED.creator = null;

    CURRENT_LEED.trade =null;
    
    CURRENT_LEED.zip = null;
    CURRENT_LEED.loc = null;

    CURRENT_LEED.start = null;
    CURRENT_LEED.end = null;

    CURRENT_LEED.note = null;
    CURRENT_LEED.det = null;
    CURRENT_LEED.reqs = null;

    CURRENT_LEED.price = null;

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
export function saveCacheLeed( leed_fromDB ) {

    if (leed_fromDB == null)
        throwError("cacheLeed", "Cannot cache null leed");

    let leedJSON = null;
    try {
        leedJSON = JSON.stringify( leed_fromDB );
    } catch (error) {
        printError("cacheLeed", "Cannot convert leed to JSON");
        console.error(leed_fromDB);
        throwError("cacheLeed", "Invalid leed for cache");
    }
   

    window.sessionStorage.setItem( CACHE_LEED_KEY, leedJSON );
}







/**
 * MAY return null 
 *
 */
export function loadCacheLeed() {

    const leedJSON = window.sessionStorage.getItem( CACHE_LEED_KEY );
    if (leedJSON == null) {
        return null;
    }

    let cacheObj = null;
    try {
        cacheObj = JSON.parse( leedJSON );

    } catch (error) {
        printError("loadCacheLeed", "Cannot parse JSON: " + leedJSON);
        return null;
    }

    return cacheObj;

}








// FIXME FIXME FIXME
// should we cache leedz / reload them when showing new calendar
// do we go back to DB every time?
/**
 * 
 *
 
function loadLeedzFromCache( theDay ) {

    // GET CACHE 
    let dateString = theDay.getAttribute("LEEDZ_DATE");
    
    // lists of JSON leedz are cached to dateStrings
    let JSON_leedz = window.sessionStorage.getItem(dateString);
    if (JSON_leedz == null || JSON_leedz == "" || JSON_leedz == CACHE_DELIM) return;


    // LOAD LEEDZ
    // load the cache leedz for this dateString
    const theLeedz = JSON_leedz.split( CACHE_DELIM );
    
    // for each JSON leed loaded from CACHE
    for (var i = 0; i < theLeedz.length; i++) {
  
        var theJSON = theLeedz[i];
        if ((theJSON == null) || (theJSON == "") || (theJSON == CACHE_DELIM)) continue; // just be safe

        // (re)create leed node using cache data
        var theLeed = JSON.parse( theJSON );
   
        // is the user stil subscribed to leedz of this trade?
        if ( isSubscribed( theLeed.trade ) ) {
            
            // FUTURE FUTURE FUTURE
            // did the user post this leed?
           
            // get the color and create a leed
            var trade_color = getColorForTrade( theLeed.trade );
            createCalendarLeed( theDay, trade_color, theLeed);
        
        } else {
            // user has unsubscribed since last cache save
            // remove leed from cache and DO NOT add to calendar
            theLeedz[i] = null;
        }
    }

    // RESET CACHE

    JSON_leedz = ""; // start wtih fresh JSON
    // only save back to cache leedz that have not been nulled out (unsubscribed)
    theLeedz.forEach( (leed) => {
        if (leed != null) JSON_leedz = JSON_leedz + JSON.stringify(leed) + CACHE_DELIM;
    });

    // put JSON back where it came from
    window.sessionStorage.setItem(dateString, JSON_leedz);
    
}

*/


/** 
    BLANK_LEED.id = null;
    BLANK_LEED.creator = null;

    BLANK_LEED.trade = null;
    
    BLANK_LEED.loc = null;
    BLANK_LEED.zip = null;
    BLANK_LEED.start = null;
    BLANK_LEED.end = null;

    BLANK_LEED.note = null;
    BLANK_LEED.details = null;
    BLANK_LEED.reqs = null;

    BLANK_LEED.price = null;

 * the leed has updated info
 * JSON-serialize the changes
 */
export function saveLeedChanges( leedObj ) {

  if (leedObj == null)
    throwError("saveLeedChanges", "null leed object");

  if (CURRENT_LEED == null)
    throwError("saveLeedChanges", "CURRENT_LEED is null");

  if (leedObj.id == null)
      throwError("saveLeedChanges", "leed id must be set");

  CURRENT_LEED.id = leedObj.id;

  if (leedObj.creator != null)
    CURRENT_LEED.creator = leedObj.creator;

  if (leedObj.trade != null)
    CURRENT_LEED.trade = leedObj.trade;


  if (leedObj.loc != null)
    CURRENT_LEED.website = leedObj.website;



    // FIXME FIXME FIXME
    // get the ZIP from last 5 digits of address after trim
  if (leedObj.zip != null)
    CURRENT_LEED.zip = leedObj.zip;
    // FIXME FIXME FIXME

  if (leedObj.start != null)
    CURRENT_LEED.start = leedObj.start;

  if (leedObj.end != null)
    CURRENT_LEED.end = leedObj.end;



  if (leedObj.note != null)
    CURRENT_LEED.note = leedObj.note;
    
  if (leedObj.details != null)
    CURRENT_LEED.details = leedObj.details;

  if (leedObj.reqs != null)
    CURRENT_LEED.reqs = leedObj.reqs;


  if (leedObj.price != null)
    CURRENT_LEED.price = leedObj.price;


  
  cacheLeed( CURRENT_LEED );
  
  // FIXME FIXME FIXME
  // post User changes to server
  // FIXME FIXME FIXME
  // db_updateUser()
  console.log("******** POSTING LEED CHANGES TO SERVER ******* ");
  console.log(CURRENT_LEED);


}


