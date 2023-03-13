/**
 * 
 */


export const SUBSCRIBED = [];


export function initUser() {

    // recover cached list of subscriptions if any
    let cachedSubs = sessionStorage.getItem("SUBS");
    let cache = [];
    if (cachedSubs != null) cache = cachedSubs.split(',');
    // add each one to SUBSCRIBED
    cache.forEach( sub => SUBSCRIBED.push( sub ) );
       

    // FIXME FIXME FIXME
    // load user subscriptions from DB
    // SUBSCRIBED.push("caricatures");

    // save to session storage in case of refresh
    window.sessionStorage.setItem("SUBS", SUBSCRIBED);
}




/**
 * @param String name of trade
 * @returns boolean true if the radio button for trade_name is turned in
 */
export function isSubscribed( trade_name ) {

    const equalsTrade = (element) => (element == trade_name);
    var index = SUBSCRIBED.findIndex( equalsTrade );
    
    return (index > -1); // true if index is 0,1,2....
    
  }

  

/**
 * 
 * @param String trade_name 
 */
export function saveSubscription( trade_name ) {

    if (SUBSCRIBED.indexOf(trade_name) == -1) { // not in list already
      SUBSCRIBED.push( trade_name );
      window.sessionStorage.setItem("SUBS", SUBSCRIBED);
    }
  }
  
  
  /**
   * 
   * @param String trade_name 
   */
  export function removeSubscription( trade_name ) {
  
    SUBSCRIBED.splice( SUBSCRIBED.indexOf(trade_name), 1);
    window.sessionStorage.setItem("SUBS", SUBSCRIBED);
  }
  