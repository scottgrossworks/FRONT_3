/**
 * 
 */
import { db_getUser } from "./dbTools.js";
import { printError, throwError } from "./error.js";



const GUEST_USER = blankUserObject();
GUEST_USER.username = "guest.user";
GUEST_USER.email = "scottgrossworks@gmail.com";

let CURRENT_USER = blankUserObject();




/**
 * return the current user object
 */
export function getCurrentUser() {
  return CURRENT_USER;
}






/**
 * 
 * CREATE and CACHE a fully-formed JSON user object CURRENT_USER
 * [ { username: "value", email, "value", ... } ] 
 * 
 * or throw Error
 */
export async function initUser( username ) {

    // GET the user JSON from the cache if any
    loadCacheUser( username );



    let resObj = [];

    //   client <---> API Gateway <===> DB
    //
    // GET the user JSON data from the server
    //
 
    try {
      // get the user object
      await db_getUser( username )
      .then(data => {

        if (data == null) throw new Error("null response from GET");
        resObj = data[0];

      })
      .catch(error => {
        printError("db_getUser()", error);
        throwError('db_getUser())', 'Problem with fetch operation:' + error.message);
      });

   
      // the DB might contain new values
      // update CURRERNT_USER
      CURRENT_USER.username = resObj.creator;
      CURRENT_USER.zip_home = resObj.zip_home;
      CURRENT_USER.zip_radius = resObj.zip_radius;
      CURRENT_USER.email = resObj.email;
      CURRENT_USER.subs = (resObj.subs != null) ? resObj.subs : [];
      CURRENT_USER.leedz_bought = (resObj.leedz_bought != null) ? resObj.leedz_bought : [];

      console.log("CURRENT USER IS SET=" + CURRENT_USER.username);

    } catch (error) {

      printError( "getUser()", error.message );
      throwError( "initUser()", error); // !!!
    }


    // save modified CURRENT_USER to session storage
    saveCacheUser( CURRENT_USER );
}





/**
 * create an empty JSON-compatible user object
 */
function blankUserObject() {
  
  const BLANK_USER = new Object();
  BLANK_USER.username = null;
  BLANK_USER.email = null;
  BLANK_USER.zip_home = null;
  BLANK_USER.zip_radius = null;
  BLANK_USER.subs = [];
  BLANK_USER.leedz_bought = [];

  return BLANK_USER;
}


/**
 * return user object currently in cache
 */
function loadCacheUser( username ) {
  
    // look in CACHE
    const key = "user#" + username;
    let userJSON = window.sessionStorage.getItem( key );
    let userObj = null;
    if (userJSON == undefined || userJSON == null) {
      return userObj; // return NULL and be done
    }

    // CACHE contains JSON
    // verfiy it and create object
      try {
        userObj = JSON.parse( userJSON );
    
      } catch (error) {
        printError("loadCacheUser(" + username + ")" , "Cannot parse JSON: " + userJSON);
        return null;
      }

    return userObj;
}



/**
 * Serialize and save a user object to cache
 */
function saveCacheUser( userObj ) {

    if (userObj == undefined || userObj == null) {
      printError("saveCacheUser()", "attempt to save empty user object");
      return;
    }

    try {
      let userJSON = JSON.stringify (userObj);
      window.sessionStorage.setItem("USER", userJSON);


    } catch (error) {
      printError("saveCacheUser()", error.message);
      window.sessionStorage.setItem("USER", null);
    }
}



/**
 * set CURRENT_USER to the default user with blank profile
 */
export function guestUser() {

  CURRENT_USER = GUEST_USER;

  // clear the cache of any prev user data
  saveCacheUser( GUEST_USER );
}






/**
 * @param String name of trade
 * @returns boolean true if the radio button for trade_name is turned in
 */
export function isSubscribed( trade_name ) {

    if (CURRENT_USER.subs.length == 0) return false;

    const equalsTrade = (element) => (element == trade_name);
    var index = CURRENT_USER.subs.findIndex( equalsTrade );
    
    return (index > -1); // true if index is 0,1,2....
    
  }

  

/**
 * 
 * @param String trade_name 
 */
export function saveSubscription( trade_name ) {

    if (CURRENT_USER.subs.indexOf(trade_name) == -1) { // not in list already
      CURRENT_USER.subs.push( trade_name );
    }

    saveCacheUser( CURRENT_USER );
  }
  
  
  /**
   * 
   * @param String trade_name 
   */
  export function removeSubscription( trade_name ) {
     
    if (CURRENT_USER.subs.length == 0) {
      console.error("Cannot removeSubscription() from empty list: " + trade_name);
      return;
    }

    CURRENT_USER.subs.splice( CURRENT_USER.subs.indexOf(trade_name), 1);

    saveCacheUser( CURRENT_USER );
  }
  


/**
 * return the list of subscriptions for the current user
 */
export function getSubscriptions() {
  
  if (CURRENT_USER == null)
    throwError("getSubscriptions()", new Error("CURRENT_USER is null"));

  
  console.log("GETTING USER SUBS");
  for (const sub of CURRENT_USER.subs) {
    console.log("sub=" + sub);
  }


    // probably would be better to make a copy and return that
    return CURRENT_USER.subs;
  } 