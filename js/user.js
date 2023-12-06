/**
 * 
 */


import { db_getUser, db_updateUser, DEL_USER, CHG_USER, DB_FAIL } from "./dbTools.js";
import { printError, throwError } from "./error.js";




/**
 * 
 * 
 * 
 */
export function getUserLogin( userLogin ) {

  try {

    const loginTokens = parseWindowURL();

    console.log("!!!!!!!!!!   HELLO >>>>>>>>PARSE URL GOT USER LOGIN!!!!");
    console.log(loginTokens);


    if ("id_token" in loginTokens) {
      
      decodeJWT(loginTokens["id_token"], userLogin);
      return;
   
    } else {
      throwError("Cannot decode JWT ID token");
    }


  } catch (err) {
    printError("User Login", "Error parsing login tokens: " + err.message);
    throw err;
  }
}


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



// use above
//
function parseWindowURL() {
  // Get the URL from the address bar
  // Split the URL into the base URL and the fragment

  console.log("RAW=" + window.location.href);

  let fragment;
  let index = window.location.href.indexOf('?');
  if (index == -1) {
    index = window.location.href.indexOf('#');
  }

  if (index == -1) {
    throwError("No '?' or '#' found in URL: " + window.location.href);
  }
  fragment = window.location.href.substring(index + 1);

  console.log("!!!!! FRAGMENT=" + fragment);

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




export const CACHE_USER_KEY = "U";
export const MAX_USER_SUBS = 6;

const GUEST_USER = blankUserObject();
GUEST_USER.un = "guest.user";
GUEST_USER.em = "scottgrossworks@gmail.com";

let CURRENT_USER = blankUserObject();






/**
 * delete current user account
 */
export async function deleteCurrentUser() {

  if (CURRENT_USER == null)
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
 * return the current user object
 * refresh from cache if requested
 */
export function getCurrentUser( useCache ) {

  if (CURRENT_USER == null)
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

  // may be blank - won't be null
  return CURRENT_USER;
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
    if (cacheUser.un == login) {
      // this is the same user from another browser window -- do NOT go back to server
      CURRENT_USER == cacheUser;


    } else {

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
        CURRENT_USER.un = resObj.sk;
        if (! resObj.em)
          throwError("No email set for username: " + resObj.sk);

        CURRENT_USER.em = resObj.em;

        CURRENT_USER.ws = (resObj.ws != null) ? resObj.ws : null;
        CURRENT_USER.ab = (resObj.ab != null) ? resObj.ab : null;
        CURRENT_USER.zp = (resObj.zp != null) ? resObj.zp : null;
        CURRENT_USER.zr = (resObj.zr != null) ? resObj.zr : null;

        // TRADES SUBSCRIPTIONS
        CURRENT_USER.sb =  (resObj.sb == undefined || resObj.sb == null || resObj.sb == "") ? [] : resObj.sb.split(',').map(element=>element.trim());

        // USER BADGES
        CURRENT_USER.bg =  (resObj.bg == undefined || resObj.bg == null || resObj.bg == "") ? [] : resObj.bg.split(',').map(element=>parseInt(element.trim()));

        

      } catch (error) {

        printError( "getUser", error.message );
        throwError( "initUser", error); // !!!
      }

      // save modified CURRENT_USER to session storage
      saveCacheUser( CURRENT_USER );
    }
    
    // console.log("%cuser.initUser(): " + CURRENT_USER.un, "color:darkorange");
    console.log(CURRENT_USER);

  }





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

  BLANK_USER.zp = null;
  BLANK_USER.zr = null;

  BLANK_USER.sb = [];
  BLANK_USER.bg = [];

  return BLANK_USER;
}





/**
 * save CURRENT_USER to cache and then to DB
 */

export async function saveCurrentUser() {

  if (CURRENT_USER == null)
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

  console.log("user.saveCurrentUser()  ******** SUCCESS! ******* ");
  console.log(CURRENT_USER);

}




/**
 * the user has updated info
 * JSON-serialize the changes
 */
export async function saveUserChanges( userObj ) {


  if (userObj == null)
    throwError("saveUserChanges", "null user object");

  if (CURRENT_USER == null)
    throwError("saveUserChanges", "No CURRENT_USER initialized");


  console.log("SAVING USER CHANGES!!");
  console.log(userObj);

  if (userObj.un != null)
    CURRENT_USER.un = userObj.un;

  if (userObj.em != null)
    CURRENT_USER.em = userObj.em;

    if (userObj.ws != null)
    CURRENT_USER.ws = userObj.ws;

  if (userObj.zp != null)
    CURRENT_USER.zp = userObj.zp;

  if (userObj.zr != null)
    CURRENT_USER.zr = userObj.zr;

  if (userObj.ab != null)
    CURRENT_USER.ab = userObj.ab;

  if (userObj.sb != null)
    CURRENT_USER.sb = userObj.sb;

  if (userObj.bg != null)
    CURRENT_USER.bg = userObj.bg;

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
    if (userJSON == undefined || userJSON == null) {
      // NOT an error -- will happen any time app started with fresh cache and new user
      // printError("loadCacheUser", "No value for cache key=" + CACHE_USER_KEY);
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
      window.localStorage.setItem( CACHE_USER_KEY , userJSON);


    } catch (error) {
      printError("saveCacheUser()", error.message);
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

  

/**
 * 
 */
export async function saveSubscription( trade_name ) {

    if (CURRENT_USER.sb.length == MAX_USER_SUBS) {
      var error = "MAX subscriptions reached: " + MAX_USER_SUBS;
      printError("saveSubscription", error);
      throwError("Save Subscription", error);
    }

    if (CURRENT_USER.sb.indexOf(trade_name) == -1) { // not in list already
      CURRENT_USER.sb.push( trade_name );
    }

    saveCacheUser( CURRENT_USER );

    // GUEST_USER can save / remove subscriptions from the current session cache user but
    // no subscription added to DB
    if ( isGuestUser( true ) ) return;

    // if not guest user
    // Trade Subscribe to DB
      
    //   client <---> API Gateway <===> DB
    //
    let resObj = [];   
    try {
      
        await db_updateUser( CHG_USER, CURRENT_USER )
        .then(data => {

        if (data == null) throw new Error("null response from GET");
        
        resObj = data[0];
        if (resObj.res == DB_FAIL) {
          // ERROR CODE
          throwError("Trade Subscribe", resObj.msg);
        }
        
        // else -- SUCCESS! subscription saved

        })
        .catch(error => {
          printError("db_updateUser", error);
          throwError('Trade Subscribe',  + error);
        });

    } catch (error) {
      let msg = 'Error subscribing to trade [ ' + trade_name + ' ]:' + error.message;
      throwError('Trade Subscribe', msg);
    }
    
}
            

  





  
  /**
   * @param String trade_name 
   */
  export async function removeSubscription( trade_name ) {
     
    if (CURRENT_USER.sb.length == 0) {
      printError("removeSubscription", "Empty list for: " + trade_name);
      return;
    }

    CURRENT_USER.sb.splice( CURRENT_USER.sb.indexOf(trade_name), 1);

    saveCacheUser( CURRENT_USER );


    // GUEST_USER can save / remove subscriptions from the current session cache user but
    // no subscription added to DB
    if ( isGuestUser( true ) ) return;

    // if not guest user
    // remove subscription from DB
    //
    // console.log("user.removeSubscription() " + trade_name + " ......");


        //   client <---> API Gateway <===> DB
      //
      //
      let resObj = [];   
      try {
        // get the user object
          await db_updateUser( REM_SUB, CURRENT_USER )
          .then(data => {
  
          if (data == null) throw new Error("null response from GET");
          
          resObj = data[0];
          if (resObj.res == 0) {
            // ERROR CODE
            throwError("db_updateUser", resObj.msg);
          }
          
          // else -- SUCCESS! subscription removed
  
          })
          .catch(error => {
            printError("db_updateUser", error);
            throwError('Remove Subscription',  + error);
          });

      } catch (error) {
        let msg = 'Error removing subscription to trade [ ' + trade_name + ' ]:' + error.message;
        throwError('Remove Subscription', msg);
      }

}





/**
 * return the list of subscriptions for the current user
 */
export function getSubscriptions() {
  
  if (CURRENT_USER == null)
    throwError("getSubscriptions()", new Error("CURRENT_USER is null"));

    // probably would be better to make a copy and return that
    return CURRENT_USER.sb;
  } 