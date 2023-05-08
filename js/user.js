/**
 * 
 */
import { db_getUser } from "./dbTools.js";
import { printError, throwError } from "./error.js";

export const CACHE_USER_KEY = "USER";

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
 * 
 * CREATE and CACHE a fully-formed JSON user object CURRENT_USER
 * [ { username: "value", email, "value", ... } ] 
 * 
 * or throw Error
 */
export async function initUser( username ) {

  
    CURRENT_USER = getCurrentUser(false);

    // is there a cache user?
    const cacheUser = loadCacheUser();
    if (cacheUser != null) {

      // if the usernames match
      // start init() with the last saved cache user
      if (cacheUser.username == CURRENT_USER.username) {
        CURRENT_USER = cacheUser;
      } 
      // else -- the cache user does not match
      // we will overwrite the cache user at the end of initUser()

    }   
    

    // console.log("initUser()");
    // console.log(CURRENT_USER);

    let resObj = [];

    //   client <---> API Gateway <===> DB
    //
    // GET the user JSON data from the server
    // UPDATE CURRENT_USER with new values from DB
    //
 
    try {
      // get the user object
      await db_getUser( username )
      .then(data => {

        if (data == null) throw new Error("null response from GET");
        resObj = data[0];

      })
      .catch(error => {
        printError("db_getUser", error);
        throwError('db_getUser', 'Problem with fetch operation:' + error.message);
      });


      // update CURRERNT_USER
      // some fields are mandatory and will always contain values
      // some are optional and may be null
      // if statements are in case cache version is more recent
      // 
      CURRENT_USER.username = resObj.creator;
      CURRENT_USER.email = resObj.email;

      if (resObj.website != null)
        CURRENT_USER.webite = resObj.website;
  
      if (resObj.about != null)
       CURRENT_USER.about = resObj.about;

      if (resObj.zip_home != null)
        CURRENT_USER.zip_home = resObj.zip_home;
  
      if (resObj.zip_radius != null)
        CURRENT_USER.zip_radius = resObj.zip_radius;
 
      CURRENT_USER.subs = (resObj.subs != null) ? resObj.subs : [];
      CURRENT_USER.leedz_bought = (resObj.leedz_bought != null) ? resObj.leedz_bought : [];

    } catch (error) {

      printError( "getUser", error.message );
      throwError( "initUser", error); // !!!
    }

    // save modified CURRENT_USER to session storage
    saveCacheUser( CURRENT_USER );


    console.log("%cLOADED USER", "color:orange");
    console.log(CURRENT_USER);

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

  return BLANK_USER;
}








// FIXME FIXME FIXME FIXME
/**
 * the user has updated info
 * JSON-serialize the changes
 */
export function saveUserChanges( userObj ) {


  if (userObj == null)
    throwError("saveUserChanges()", "null user object");

  if (CURRENT_USER == null)
    throwError("saveUserChanges()", "No CURRENT_USER initialized");


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

    // probably would be better to make a copy and return that
    return CURRENT_USER.subs;
  } 