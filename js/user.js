/**
 * 
 */
import { db_getUser } from "./dbTools.js";
import { printError, throwError } from "./error.js";

export const CACHE_USER_KEY = "U";
export const MAX_USER_SUBS = 5;

const GUEST_USER = blankUserObject();
GUEST_USER.username = "guest.user";
GUEST_USER.email = "scottgrossworks@gmail.com";

let CURRENT_USER = blankUserObject();





/**
 * return the current user object
 * refresh from cache if requested
 */
export function getCurrentUser( useCache ) {

  if (CURRENT_USER == null)
    throwError("getCurrentUser", "CURRENT_USER should never be null");

  // search the cache
  if (useCache) {
    // is there a cache user?
    const cacheUser = loadCacheUser();
    if (cacheUser != null) {
      CURRENT_USER = cacheUser;
    }
  }

  // may be blank - won't be null
  return CURRENT_USER;
}



/**
 * 
 * @returns true if we are using the GUEST account
 */
export function isGuestUser() {
  return CURRENT_USER === GUEST_USER;
}




/**
 * @param username then user login
 * 
 * If this is the same as the cache user - load the cache user
 * If this is a new username, go back to the DB for a new user object
 * 
 * CREATE and CACHE a fully-formed JSON user object CURRENT_USER
 * [ { username: "value", email, "value", ... } ] 
 * 
 * or throw Error
 */
export async function initUser( login ) {

    const cacheUser = getCurrentUser(true);
    if (cacheUser.username == login) {
      // this is the same user from another browser window -- do NOT go back to server
      // CURRENT_USER == cacheUser;

    } else {

      //   client <---> API Gateway <===> DB
      //
      // GET the user JSON data from the server
      // UPDATE CURRENT_USER with new values from DB
      //
      let resObj = [];   
      try {
        // get the user object
        await db_getUser( login )
        .then(data => {
  
          if (data == null) throw new Error("null response from GET");
          resObj = data[0];
  
        })
        .catch(error => {
          printError("initUser", "Error initializing user: " + login);
          printError("db_getUser", error);
          throwError('db_getUser', 'Problem with fetch operation:' + error.message);
        });

        // copy the new values into CURRENT_USER

        // some fields are mandatory and will always contain values
        // some are optional and may be null
        // if statements are in case cache version is more recent
        // 
        CURRENT_USER.username = resObj.creator;
        CURRENT_USER.email = resObj.email;

        CURRENT_USER.website = (resObj.website != null) ? resObj.website : null;
        CURRENT_USER.about = (resObj.about != null) ? resObj.about : null;
        CURRENT_USER.zip_home = (resObj.zip_home != null) ? resObj.zip_home : null;
        CURRENT_USER.zip_radius = (resObj.zip_radius != null) ? resObj.zip_radius : null;

        CURRENT_USER.subs = (resObj.subs != null) ? resObj.subs : [];
        CURRENT_USER.leedz_bought = (resObj.leedz_bought != null) ? resObj.leedz_bought : [];


        // USER BADGES
        CURRENT_USER.badges = (resObj.badges != null) ? resObj.badges : [];
        

      } catch (error) {

        printError( "getUser", error.message );
        throwError( "initUser", error); // !!!
      }

      // save modified CURRENT_USER to session storage
      saveCacheUser( CURRENT_USER );
    }
    
    // console.log("%cLOADED USER: " + CURRENT_USER.username, "color:darkorange");
    // console.log(CURRENT_USER);

  }





/**
 * create an empty JSON-compatible user object
 */
export function blankUserObject() {
  
  const BLANK_USER = new Object();
  
  BLANK_USER.username = null;
  BLANK_USER.email = null;
  BLANK_USER.website = null;
  BLANK_USER.about = null

  BLANK_USER.zip_home = null;
  BLANK_USER.zip_radius = null;

  BLANK_USER.subs = [];
  BLANK_USER.leedz_bought = [];
  BLANK_USER.badges = [];

  return BLANK_USER;
}








// FIXME FIXME FIXME FIXME
/**
 * the user has updated info
 * JSON-serialize the changes
 */
export function saveUserChanges( userObj ) {


  if (userObj == null)
    throwError("saveUserChanges", "null user object");

  if (CURRENT_USER == null)
    throwError("saveUserChanges", "No CURRENT_USER initialized");


  if (userObj.username != null)
    CURRENT_USER.username = userObj.username;

  if (userObj.email != null)
    CURRENT_USER.email = userObj.email;

    if (userObj.website != null)
    CURRENT_USER.website = userObj.website;

  if (userObj.zip_home != null)
    CURRENT_USER.zip_home = userObj.zip_home;

  if (userObj.zip_radius != null)
    CURRENT_USER.zip_radius = userObj.zip_radius;

  if (userObj.about != null)
    CURRENT_USER.about = userObj.about;

  if (userObj.subs != null)
    CURRENT_USER.subs = userObj.subs;

  if (userObj.leedz_bought != null)
    CURRENT_USER.leedz_bought = userObj.leedz_bought;

  if (userObj.badges != null)
    CURRENT_USER.badges = userObj.badges;

  

  saveCacheUser( CURRENT_USER );
  
  // FIXME FIXME FIXME
  // post User changes to server
  // FIXME FIXME FIXME
  // db_updateUser()
  console.log("******** POSTING USER CHANGES TO SERVER ******* ");
  console.log(CURRENT_USER);


}


















/**
 * return user object currently in cache
 * MAY return null
 */
function loadCacheUser() {
  
    let userJSON = window.sessionStorage.getItem( CACHE_USER_KEY );
    let userObj = null;
    if (userJSON == undefined || userJSON == null) {

      printError("loadCacheUser", "No value for cache key=" + CACHE_USER_KEY);
      return null; // return NULL and be done
    }

    // CACHE contains JSON
    // verfiy it and create object
    try {
      userObj = JSON.parse( userJSON );
  
    } catch (error) {
      printError("loadCacheUser", "Cannot parse JSON: " + userJSON);
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
      window.sessionStorage.setItem( CACHE_USER_KEY , userJSON);


    } catch (error) {
      printError("saveCacheUser()", error.message);
      window.sessionStorage.setItem( CACHE_USER_KEY , null);
    }
}





/**
 * set CURRENT_USER to the default user with blank profile
 */
export function guestUser() {

  CURRENT_USER = GUEST_USER;

  // clear the cache of any prev user data
  saveCacheUser( GUEST_USER );

  return GUEST_USER;
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

  if (CURRENT_USER.subs.length == MAX_USER_SUBS) {
    var error = "MAX subscriptions reached: " + MAX_USER_SUBS;
    printError("Save Subscription", error);
    throwError("Save Subscription", error);
  }

    if (CURRENT_USER.subs.indexOf(trade_name) == -1) { // not in list already
      CURRENT_USER.subs.push( trade_name );
    }

    saveCacheUser( CURRENT_USER );

    //
    // FIXME FIXME FIXME
    // if not guest user
    // save subscription to the database
    //


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


    //
    // FIXME FIXME FIXME
    // if not guest user
    // remove subscription to the database
    //

  }
  


/**
 * return the list of subscriptions for the current user
 */
export function getSubscriptions() {
  
  if (CURRENT_USER == null)
    throwError("getSubscriptions()", new Error("CURRENT_USER is null"));

    // probably would be better to make a copy and return that
    return CURRENT_USER.subs;
  } 