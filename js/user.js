/**
 * USER object 
 * 
 */


import { db_getUser, db_updateUser, DEL_USER, CHG_USER, DB_FAIL } from "./dbTools.js";
import { printError, throwError } from "./error.js";



export const CACHE_USER_KEY = "U";
export const MAX_USER_SUBS = 6;

const GUEST_USER = blankUserObject();
GUEST_USER.un = "guest.user";
GUEST_USER.em = "scottgrossworks@gmail.com";

let CURRENT_USER = blankUserObject();


/**
 * create an empty JSON-compatible user object
 * 
 * 
 * 
 *  "cr": "dave.reyes",
    "sb": [ "airbrush", "caricatures", "martial arts"],
    "zp": "93551",
    "zr": "50", 
    "ab": "I am a caricature artist in LA",
    "ws": "http://doctorreyes.com",
    "id": "0",
    "lp": ["2005", "1005", "3001"],
    "bg":["1", "2", "4"],
    "em": "wizzardblitz@netzero.net", 
    "tn": "user#dave.reyes"
    }
 *
 */
    export function blankUserObject() {
  
      const BLANK_USER = new Object();
      
      BLANK_USER.un = null;
      BLANK_USER.em = null;
      BLANK_USER.ws = null;
      BLANK_USER.ab = null
    
      BLANK_USER.zp = 0;
      BLANK_USER.zr = 0;
    
      BLANK_USER.sb = [];
      BLANK_USER.bg = [];
    
      // 1/2024 SQUARE STATUS
      BLANK_USER.sq_st = null;
    
      return BLANK_USER;
    }




/**
 * 
 * DOES this window contain AWS auth tokens?
 * break out all individual tokens into key-value pairs
 * 
 */
export function getUserLogin( userLogin ) {

  try {

    const loginTokens = parseWindowURL();

    if (! loginTokens) {
      return;
    }

    // console.log("GOT TOKENS!!!");
    // console.log(loginTokens);

    // ID TOKEN
    //
    if ("id_token" in loginTokens) {
      
      decodeJWT(loginTokens["id_token"], userLogin);
      userLogin['id_token'] = loginTokens['id_token'];

    } else {
      var msg = "Cannot decode JWT ID token";
      printError("User Login", msg);
      // do not fail -- will use guest account
      return;
    }

    // ACCESS TOKEN
    // will not get here if there is no ID token validation
    //
    if ("access_token" in loginTokens) {
      userLogin['access_token'] = loginTokens['access_token']; 
    }


  } catch (err) {
    var msg = "Error parsing login tokens: " + err.message;
    printError("User Login", msg);
    throwError(msg);
  }
}


//
// use above
//
function parseWindowURL() {
  // Get the URL from the address bar
  // Split the URL into the base URL and the fragment

  let fragment;
  let index = window.location.href.indexOf('?');
  if (index == -1) {
    index = window.location.href.indexOf('#');
  }

  if (index == -1) {
    // printError("Parse URL", "No '?' or '#' found in URL: " + window.location.href);
    return null;
  }


  fragment = window.location.href.substring(index + 1);
  if (! fragment) return null;

  // Split the fragment into key-value pairs
  const keyValuePairs = fragment.split("&");

  // Create an object to store the key-value pairs
  const result = {};

  // Iterate over the key-value pairs and store them in the object
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    result[key] = value;
  });

  // Return the object with the key-value pairs
  return result;
}


//
// un - USERNAME
// em - EMAIL
//
// used above
//
function decodeJWT(jwt, userInfo) {
  const [header, payload] = jwt.split('.').slice(0,2)
    .map(el => el.replace(/-/g, '+').replace(/_/g, '/'))
    .map(el => JSON.parse(window.atob(el)));

    userInfo["un"] = payload["cognito:username"];
    userInfo["em"] = payload["email"];
  
    return userInfo;
}









/**
 * delete current user account
 */
export async function deleteCurrentUser() {

  if (! CURRENT_USER)
    throwError("deleteCurrentUser", "CURRENT_USER should never be null");


  if (isGuestUser( true ))
    throwError("deleteCurrentUser", "Cannot delete Guest User");


    let resObj = [];   
    try {
      // get the user object
      await db_updateUser( DEL_USER, CURRENT_USER )
      .then(data => {

        if (data == null) throw new Error("null response from GET");
        resObj = data[0];

        // received error code
        if (resObj.res == DB_FAIL) {
          throwError("Delete User", resObj.msg);
        }


      })
      .catch(error => {

        let msg = "Error deleting user [ " + CURRENT_USER.un + " ]:" + error.message;
        printError("deleteCurrentUser", msg);
        throwError('Delete User', msg);
      });


    
    } catch (error) {
      throwError( "deleteCurrentUser", error);
    }

    // if it doesn't throw an error -- SUCCESS!
    CURRENT_USER = GUEST_USER;
    
    // save modified CURRENT_USER to session storage
    saveCacheUser( CURRENT_USER );


}







/**
 * 
 * @returns true if we are using the GUEST account
 */
export function isGuestUser( guest_user ) {

  if ( guest_user )
    return CURRENT_USER === GUEST_USER;
  else 
    return CURRENT_USER !== GUEST_USER;
}



/**
 * return the current user object
 * refresh from cache if requested
 */
export function getCurrentUser( useCache ) {

  console.log("getCurrentUser(" + useCache + ")");

  if (! CURRENT_USER)
    throwError("getCurrentUser", "CURRENT_USER should never be null");

  if (isGuestUser( true )) return GUEST_USER;

  // search the cache
  if (useCache) {
    // is there a cache user?
    const cacheUser = loadCacheUser();
    if (cacheUser != null) {
      CURRENT_USER = cacheUser;
    }
  }

  // console.log("GOT USER==" + useCache + "==" + new Date().getTime());
  if (useCache) console.log(CURRENT_USER);

  // may be blank - won't be null
  return CURRENT_USER;
}




/**
 * Do a force reload of the current (cached) user profile from DB
 */
export async function reloadCurrentUser( useCache ) {

  try {

      getCurrentUser( useCache );

      if (! CURRENT_USER.un) throwError("reloadCurrentUser", "No current user found");

      await initUser( CURRENT_USER.un );

      return CURRENT_USER;

  } catch (error) {
    throw error;
  }
}




/**
 * @param username then user login
 * 
 * go back to DB to get fresh user json for login
 * or throw Error
 */
export async function initUser( login ) {

    //   client <---> API Gateway <===> DB
    //
    // GET the user JSON data from the server
    // UPDATE CURRENT_USER with new values from DB
    //
    let resObj = null;

    try {
      // get the user object
      await db_getUser( login )
      .then(data => {

        if (data == null) throw new Error("Server Error: Cannot Get User");

        resObj = data;

      })
      .catch(error => {

        if (error.status == 204) {
          var msg = "User " + login + " not found.";
          throwError("Get User", msg);

        } else {
          var msg =  "Error initializing user [ " + login + " ]: " + error.message;
          printError("db_getUser", msg);
          throwError('Init User', error);
        }

      });


      // THIS MUST MATCH DYNAMO DB SCHEMA
      //
      // copy the new values into CURRENT_USER

      // some fields are mandatory and will always contain values
      // some are optional and may be null
      // if statements are in case cache v  ersion is more recent
      // 
      CURRENT_USER.un = resObj['sk'];
      if (! resObj['em'])
        throwError("No email set for username: " + resObj['sk']);

      CURRENT_USER.em = resObj['em'];

      CURRENT_USER.ws = (resObj['ws']) ? resObj['ws'] : null;
      CURRENT_USER.ab = (resObj['ab']) ? resObj['ab'] : null;

      CURRENT_USER.zp = (resObj['zp'] && resObj['zp'] != '0') ? resObj['zp'] : 0;
      CURRENT_USER.zr = (resObj['zr'] && resObj['zr'] != '0') ? resObj['zr'] : 0;

      // TRADES SUBSCRIPTIONS
      CURRENT_USER.sb =  (resObj['sb']) ? resObj['sb'].split(',').map(element=>element.trim()) : [];

      // USER BADGES
      CURRENT_USER.bg =  (resObj['bg']) ? resObj['bg'].split(',').map(element=>parseInt(element.trim())) : [];

      // 1/2024
      // SQUARE STATUS
      CURRENT_USER.sq_st = (resObj['sq_st']) ? resObj['sq_st'] : null;

    } catch (error) {

      printError( "getUser", error.message );
      throwError( "initUser", error); // !!!
    }

    // save modified CURRENT_USER to session storage
    saveCacheUser( CURRENT_USER );

    return CURRENT_USER;
  }








/**
 * save CURRENT_USER to cache and then to DB
 */

export async function saveCurrentUser() {

  if (! CURRENT_USER)
    throwError("saveCurrentUser", "No CURRENT_USER initialized");

  if (isGuestUser( true )) return;

  // save changes to CACHE
  saveCacheUser( CURRENT_USER );
  
  // send user updates --> DB
  try {
      db_updateUser( CHG_USER, CURRENT_USER );		

  } catch ( error ) {

      printError("db_updateUser", error);
      throwError("Save Current User", error.message);
  }

}




/**
 * the user has updated info
 * JSON-serialize the changes
 */
export async function saveUserChanges( userObj ) {


  if (! userObj)
    throwError("saveUserChanges", "null user object");

  if (! CURRENT_USER)
    throwError("saveUserChanges", "No CURRENT_USER initialized");

  // will not change
  // CURRENT_USER.un = userObj.un;
  
  // will not change
  // CURRENT_USER.em = userObj.em;

    CURRENT_USER.ws = userObj['ws'];

    CURRENT_USER.zp = (userObj['zp'] && userObj['zp'] != '0') ? userObj['zp'] : 0;

    CURRENT_USER.zr = (userObj['zr'] && userObj['zr'] != '0') ? userObj['zr'] : 0;

    CURRENT_USER.ab = userObj['ab'];

    CURRENT_USER.sb = userObj['sb'];

    CURRENT_USER.bg = userObj['bg'];
  
    CURRENT_USER.sq_st = userObj['sq_st'];


  try {
    saveCurrentUser();

  } catch (error) {
    
    printError("saveCurrentUser", error);
    throwError("Save User Changes", error.message);
  }
}







/**
 * return user object currently in cache
 * MAY return null
 */
function loadCacheUser() {
  

    let userJSON = window.localStorage.getItem( CACHE_USER_KEY );
    let userObj = null;
    if (! userJSON) {
      // NOT an error -- will happen any time app started with fresh cache and new user
      console.log("Leedz user cache", "No value for cache key=" + CACHE_USER_KEY);
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

    
    // console.log("LOAD USER CACHE=" + new Date().getTime());
    // console.log(userObj);

    return userObj;
}





/**
 * Serialize and save a user object to cache
 */
function saveCacheUser( userObj ) {

    // console.log("SAVE CACHE USER=" + new Date().getTime());  
    // console.log(userObj);

    if (! userObj) {
      printError("saveCacheUser()", "attempt to save empty user object");
      return;
    }

    try { 
      let userJSON = JSON.stringify (userObj);
      window.localStorage.setItem( CACHE_USER_KEY , userJSON);


    } catch (error) {
      printError("Save cache user", error.message);
      window.localStorage.setItem( CACHE_USER_KEY , null);
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

    if (CURRENT_USER.sb.length == 0) return false;

    const equalsTrade = (element) => (element == trade_name);
    var index = CURRENT_USER.sb.findIndex( equalsTrade );

    return (index > -1); // true if index is 0,1,2....
    
  }

  