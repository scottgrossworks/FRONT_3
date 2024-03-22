/**
 * 
 * 
 * 
 * 3/2024 -- adding click-on-superscript feature
 */

import { loadCacheLeedz, removeLeedzForTrade } from "./calendar.js";
import { getCurrentUser, saveCurrentUser } from "./user.js";
import { db_getTrades, db_getLeedz } from "./dbTools.js";
import { printError, errorModal, modalClose } from "./error.js";
import { hideActionWindow } from "./action.js";
import { DTtoPretty, getTodayUTC } from "./dates.js";
import { MAX_USER_SUBS } from "./user.js";
import { showWaitingModal } from "./leed_edit.js";



// { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
 

Storage.prototype.setObj = function(key, obj) {
  return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
  return JSON.parse(this.getItem(key))
}




/**
 * 
 * trades come from DB SORTED by num_leedz + --> -
 */
export async function initTrades() {

  let trades = [];

  const currentUser = getCurrentUser(false);

  try {
      await getAllTrades().then((response) => trades = response ); 

   
      if ((! trades) || trades.length == 0) {
        throw new Error("server returned no trades. ");
      }

      // init TRADES struct
      // initialize the spectrum of colors
      createTradesAndColors( trades );  

      if (  currentUser.sb.length == 0 ) { 
        console.log("No subscriptions: using Top Trades")
        // the trades should be sorted by num_leedz
        // the guest user's subs are the top n leedz
        for (let i = 0; i < MAX_USER_SUBS; i++) {
          currentUser.sb.push( trades[i].sk );
        }
        saveCurrentUser();
      }
  	
      initTradesColumn( tradeListener );

    
    } catch (error) {
      
      // DO NOT FAIL -- show error modal dialog and print error to console
      var msg = error.message + ".  Cannot load trades, please refresh page "
      printError("Init Trades Column", msg);
      errorModal( msg , true );
      throw error;

    }

	  // printColors();
}



/**
 * populates TRADES_LIST
 */
export async function getAllTrades() {

  let retJSON = null;

    try {

      await db_getTrades().then((response) => retJSON = response ); 

      // if it stays null or there's any problem, report it but do not fail
      if (retJSON == null) throw new Error("NO trades received from server");

      // SHOULD be sorted by num_leedz 
      return retJSON;

    } catch (error) {

      printError("db_getTrades()", error );
      printError("getAllTrades()", "Using EMPTY trades list");
      throw error;
      
    }
  }





/**
 * 
 * @param String name of trade
 * @returns String color corresponding to it in the trades column
 */
export function getColorForTrade(trade_name) {
  
  // is there a color in cache for this name?
  let the_trade = window.localStorage.getObj( trade_name );
  
  if (the_trade != null) {
     
    return the_trade[0];
  
  } else {

    const the_color = getUniqueColor();
    // create new entry in session cache
    window.localStorage.setObj(trade_name, [ the_color, 0, false ]);
    
    return the_color;
  }
  
}


/**
 * return the [ color, numLeedz, sub ] triple
 */
export function getTradeInfo(trade_name) {
  
  // is there a color in cache for this name?
  let info_triple = window.localStorage.getObj( trade_name );
  
  return info_triple;

}



/**
 *
 * all_trades is the array 
 * 
 * ONLY display the trades to which the user is subscribed
 * [
 * {
   tn: "caricatures",
   nl: 5
 * }, .... 
 * ]
*/
function initTradesColumn( tradeListener ) {

  // 1/2024
  // go back to cache here as a failsafe because sometimes we are not refreshing trades when
  // we return to this page from a helper .html
  const current_user = getCurrentUser( true );

  // import DOM elements from html
  const theList = document.querySelector("#trades_list");
  // start with a fresh list
  while (theList.childElementCount > 1) {
    theList.removeChild( theList.lastElementChild );
  }

  if (current_user.sb.length == 0)
    return;

  const theTemplate = document.querySelector("#template_each_trade");

  // for each subscription
  current_user.sb.forEach(( sub ) => {
  
    // clone a new node
    const newNode = theTemplate.content.cloneNode(true).querySelector(".each_trade");
  
    // TRADES
    // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
    let the_trade = window.localStorage.getObj(sub);
 
    if (the_trade) {  // failsafe to avoid errors if a trade has been removed 

      var num_leedz = the_trade[1];
      // add num_leedz as an attribute
      newNode.setAttribute("nl", num_leedz);
      // set the leed count as a superscript
      let sup = newNode.querySelector("sup");
      sup.textContent = num_leedz;

      // showAllLeedz()
      // 3/2024
      // set the href for <sup> to trigger the JavaScript function
      sup.addEventListener("click", () => {
          showAllLeedz(current_user, sub);
      });

    } else {
        return; // continue from top
    }

     
    // set the label
    let theLabel = newNode.querySelector("label");
    theLabel.textContent = sub;


    let checkBox = newNode.querySelector(".trade_checkbox");
    let radioButton = newNode.querySelector(".trade_radio");

     
    //
    // CHECKBOX CLICK LISTENER
    //

    checkBox.addEventListener("click", function( event ) {
  
      tradeListener( sub, this, radioButton, theLabel );
      
    });



    //
    // RADIO BUTTON CLICK LISTENER
    //
    radioButton.addEventListener("click", function( event ) {
  
      tradeListener( sub, checkBox, this, theLabel );

    });


    //
    // LABEL CLICK LISTENER
    //
    theLabel.addEventListener("click", function( event ) {

      tradeListener( sub, checkBox, radioButton, this );
      
    });

    
    turnTrade_On(checkBox, radioButton, theLabel, sub);


    // add trade to the UI
    // in a position sorted by num_leedz
    addTradeSorted( theList, newNode );
  });


}



/**
 * Called from superscript in trades column
 * Will load ALL leedz for given trade
 * @param { Object } currentUser user object
 * @param {String} trade name of trade 
 */
async function showAllLeedz( currentUser, trade ) {

    showWaitingModal("Loading the Leedz . . .");

    // API request --> DB 
    // load leedz for this trade and date range showing
    //
    const START = `${getTodayUTC().getTime()}`;
    const END = "2000000000000";
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        // get the leedz for all trade names in subs and the dates showing
        results = await db_getLeedz( [ trade ], START, END, currentUser.zp, currentUser.zr );


    } catch (error) {   
        printError( "showAllLeedz", error.message );
        printError( "Received JSON", results);
        
        // EXIT FUNCTION HERE
        // throwError( "loadLeedzFromDB", error);
        errorModal("Cannot show all Leedz from DB: " + error.message, false); 
        return;
    }

    // console.log(results);
    // call callback
    if (results.length != 0) {
      showLeedzList( trade, results );
    }

}
window.showAllLeedz = showAllLeedz;





/**
 * build the leedz_list UI
 * 
 * @param { String } the_trade name of trade
 * @param { Object[] } the_leedz list of leedz returned from DB
 */
function showLeedzList( the_trade, the_leedz ) {
     

    // import DOM elements from html
    const theList = document.querySelector("#leedz_list");
    const theTemplate = document.querySelector("#template_each_leed");

    const trade_color = getColorForTrade( the_trade );

    var trade_name = document.querySelector("#leedz_list_trade");
    var radioButton = trade_name.querySelector(".trade_radio");
    radioButton.style.backgroundColor = trade_color;

    var theLabel = trade_name.querySelector(".trade_label");
    theLabel.textContent = the_trade;


    for (each_leed in the_leedz) {

      var theClone = theTemplate.content.cloneNode(true);
      var theNode = theClone.querySelector(".each_leed");

      var theDate = theNode.querySelector(".leed_date");
      var formatted_date = DTtoPretty( each_leed.st );
      theDate.textContent = formatted_date;
   
      var theTitle = theNode.querySelector(".leed_label");
      theTitle.textContent = each_leed.ti;
      // FOOBAR FOOBAR FOOBAR
      // add link to getDeetz action window
      // and close this window
    
    
      theList.appendChild( theNode );
    } 
    
    const calendar_main = document.getElementById("#calendar_main");
    const leedz_list_main = document.getElementById("#leedz_list_main");
    
    modalClose(false);

    calendar_main.classList.add(".hide_column");
    leedz_list_main.classList.remove(".hide_column");
}



/**
 * Keep the trades column sorted by num_leedz
 * 
 */
function addTradeSorted( list, node ) {

    var index = 1;  // skip the first template element
    var length = list.children.length;
    const node_nl = parseInt( node.getAttribute('nl'));
    while (index < length) {
          
      if ( node_nl > parseInt( list.children[index].getAttribute('nl') )) {
        list.insertBefore(node, list.children[index]);
        return;
      
      } else {
        index++;
      }
    }
    // if we get here, insert at the end
    list.append(node);

}





/**
 * Callback function for the trade in the trades list
 * 
 * @param {String} trade  name of trade 
 * @param {*} checkBox   checkbox node
 * @param {*} radioButton  colored radio button node
 * @param {*} theLabel   text label
 * @returns 
 */
function tradeListener(trade, checkBox, radioButton, theLabel) {


  try {

       // clear the action window
       hideActionWindow();

      // TRADES
      // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }

      if ( window.localStorage.getObj(trade)[2]  ) { // TRADE is ON

        turnTrade_Off(checkBox, radioButton, theLabel, trade );

        removeLeedzForTrade( trade );

      } else { // TRADE is OFF

        turnTrade_On(checkBox, radioButton, theLabel, trade );
       
        loadCacheLeedz( trade );
      }

      
  } catch (error) {
    errorModal(error, false);
    return false;
  }

}
window.tradeListener = tradeListener;










/**
 * @param numOfSteps: Total number steps to get color, means total colors
 * @param step: The step number, means the order of the color
 */
function createColor(numOfSteps, step) {
  // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
  // Adam Cole, 2011-Sept-14

  var r, g, b;
  var h = step / numOfSteps;
  var i = ~~(h * 6);
  var f = h * 6 - i;
  var q = 1 - f;
  switch(i % 6){
      case 0: r = 1; g = f; b = 0; break;
      case 1: r = q; g = 1; b = 0; break;
      case 2: r = 0; g = 1; b = f; break;
      case 3: r = 0; g = q; b = 1; break;
      case 4: r = f; g = 0; b = 1; break;
      case 5: r = 1; g = 0; b = q; break;
  }
  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 215)).toString(16)).slice(-2) + ("00" + (~ ~(b * 225)).toString(16)).slice(-2);
  return (c);
}

//  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);




/*
 *  
 */
function getUniqueColor() {

  const numKeys = Object.keys(localStorage).length;
  const randomIndex = Math.floor(Math.random() * numKeys);

  let the_color = createColor( numKeys, randomIndex );
  
  return the_color;
}


/*
 * Seed the colors in TRADES
 * number of colors == number of trades
 * 
 * using sessionCache so that
 * mapping colors->trade persists even when browser refreshed
 * 
 * all_trades:
 * [
 * {
    tn: "caricatures",
    nl: 5,
 * }, .... 
 * ]
 * 
 */
export function createTradesAndColors( all_trades ) {
    
    // for each trade....
    for (let i = 0; i < all_trades.length; i++ ) {
 

      //  THIS MUST MATCH DYNAMODB SCHEMA
      // ARRAY
      // sk: trade_name
      // nl: num_leedz
      /**
       * [     
       *  0:{sk: 'boxer', , nl: '33'}
       *  1:{sk: 'airbrush', nl: '28'}
       *  2:{sk: 'caricatures', pk: 'trade', nl: '17'}
       *  3:{sk: 'ballerina',  nl: '11'}
       *  ]
      */

      //
      var trade_name = all_trades[i].sk;
      var num_leedz = all_trades[i].nl;
     

      // TRADES
      // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
      // is there ALREADY a color assigned to this trade_name in cache?
      var cache_trade = window.localStorage.getObj( trade_name );
      if (cache_trade == null) {
         // create a new color and assign it to trade_name
        var theColor = getUniqueColor();
        window.localStorage.setObj(trade_name, [ theColor, num_leedz, false ]); 
        
      
      } else {
        var theColor = cache_trade[0];
        // if there is a color assigned -- update values
        window.localStorage.setObj(trade_name, [theColor, num_leedz, false ]); 
       }
    }
  }




/*
 * 
 */
export function printColors() {
  
  for (let trade of Object.keys(localStorage) ) {
    
    let theKey = window.localStorage.getObj(trade);

    if (theKey[0] != undefined && theKey.length == 3) {
      var theColor = theKey[0];
      var numLeedz = theKey[1];
      console.log("%c" + trade + ": " + theColor  + " numLeedz: " + numLeedz, "color:" + theColor + ";");
    } 
  }
}






/*
 *
 */
export function turnTrade_On( checkBox, radioButton, theLabel, trade_name ) {

  // TRADES
  // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
  // mark the trade as SHOWING
  const the_color = window.localStorage.getObj(trade_name)[0];
  const num_leedz = window.localStorage.getObj(trade_name)[1];
  window.localStorage.setObj(trade_name, [ the_color, num_leedz, true ] );


  // DEBUG
  // var theString = "* TURN ON=" + trade_name + "color=" + the_color;
  // console.log("%c" + theString, "color: " + the_color + ";"); 

  // FIXME 2/2023 
  // should all be done in css but the initial setting doesn't persist
  // color the radio button
  // turn on the check box and the radio button

  if (checkBox != null) {
    checkBox.checked = true;
    checkBox.classList.add("trade_active");
  }
  
  radioButton.checked = true;
  radioButton.style.backgroundColor = the_color;
  radioButton.classList.add("trade_active");

  // recolor the label
  theLabel.style.color = "black";

}



/*
 *
 */
export function turnTrade_Off( checkBox, radioButton, theLabel, trade_name ) {
  


  // TRADES
  // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
  // mark the trade as SHOWING
  const the_color = window.localStorage.getObj(trade_name)[0];
  const num_leedz = window.localStorage.getObj(trade_name)[1];
  window.localStorage.setObj(trade_name, [ the_color, num_leedz, false ] );


  // turn on the check box and the radio button
  if (checkBox != null) checkBox.checked = false;
  radioButton.checked = false;
  
  // color the radio button
  // should all be done in css but the initial setting doesn't persist
  radioButton.style.backgroundColor = "white";
  radioButton.style.border = "1.5px solid var(--LEEDZ_DARKGRAY)";
  
  // recolor the label
  theLabel.style.color = "gray";

  radioButton.classList.remove("trade_active");

}







/**
 * is this a valid trade name?
 *  
 */
export function isValidTrade( trade_name ) {


  let fromCache = window.localStorage.getObj( trade_name );

  return (fromCache != null);
}

