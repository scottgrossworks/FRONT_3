/**
 * 
 * 
 * 
 */

import { loadCacheLeedz, removeLeedzForTrade } from "./calendar.js";
import { getCurrentUser, isGuestUser } from "./user.js";
import { db_getTrades } from "./dbTools.js";
import { printError, errorModal, throwError } from "./error.js";
import { hideActionWindow } from "./action.js";

import { MAX_USER_SUBS } from "./user.js";



// { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
 

Storage.prototype.setObj = function(key, obj) {
  return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
  return JSON.parse(this.getItem(key))
}




/**
 * 
 * 
 */
export async function initTrades() {

  let trades = [];

  try {
    await getAllTrades().then((response) => trades = response ); 

      if (trades == null) {
        throw new Error("server returned null trades.");
      }

      if (trades.length == undefined || trades.length == 0) {
        throw new Error("server returned empty (0) trades.");
      }


      if ( isGuestUser() ) { 
        let guest_user = getCurrentUser();
        // the trades should be sorted by num_leedz
        // the guest user's subs are the top n leedz
        for (let i = 0; i < MAX_USER_SUBS; i++) {
          guest_user.sb.push( trades[i].tn ) 
        }
      }

      // init TRADES struct
      // initialize the spectrum of colors
      seedColors( trades );  

  		// printColors();
      
      initTradesColumn( tradeListener );


    } catch (error) {
      
      // DO NOT FAIL -- show error modal dialog and print error to console
      var msg = "Cannot load trades.<BR>Please refresh page."
      msg = error.message + "<BR>" + msg;
      
      printError("Init Trades Column", error);
      errorModal( msg , true );
  }

}



/**
 * populates TRADES_LIST
 */
export async function getAllTrades() {

  let retJSON = null;

    try {

      retJSON = await db_getTrades();

      // if it stays null or there's any problem, report it but do not fail
      if (retJSON == null) throw new Error("NO trades received from server");

      // SHOULD be sorted by num_leedz 

    } catch (error) {

      printError("db_getTrades()", error );
      printError("getAllTrades()", "Using EMPTY trades list");
      retJSON = [];

      // show error modal dialog
      errorModal("Error getting trades: " + error.message, false);
      
    }

    return retJSON;
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

    // create new color using random index into create_color algo
    let num_keys = window.localStorage.length;
    the_color = createColor( num_keys, Math.floor(Math.random() * num_keys));

    // create new entry in session cache
    window.localStorage.setObj(trade_name, [ the_color, 0, false ]);
    
    return the_color;
  }
  
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

  const current_user = getCurrentUser(false);
  if (current_user == null || current_user.sb == null)
      throwError("InitTrades", "Current User not initialized");

  // current_user may be guest user

  // import DOM elements from html
  const theList = document.querySelector("#trades_list");
  const theTemplate = document.querySelector("#template_each_trade");

  // for each subscription
  current_user.sb.forEach(( sub ) => {
  
    // clone a new node
    const newNode = theTemplate.content.cloneNode(true).querySelector(".each_trade");
  
    // set the label
    let theLabel = newNode.querySelector("label");
    theLabel.textContent = sub;

    // TRADES
    // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
    let num_leedz = window.localStorage.getObj(sub)[1];


    // set the leed count as a superscript
    newNode.querySelector("sup").textContent = num_leedz;

    
    let checkBox = newNode.querySelector(".trade_checkbox");
    let radioButton = newNode.querySelector(".trade_radio");

    
  
    //
    // CHECKBOX CLICK LISTENER
    //

    checkBox.addEventListener("click", function( event ) {
  
      tradeListener( sub, checkBox, radioButton, theLabel );
      
    });



    //
    // RADIO BUTTON CLICK LISTENER
    //
    radioButton.addEventListener("click", function( event ) {
  
      tradeListener( sub, checkBox, radioButton, theLabel );

    });


    //
    // LABEL CLICK LISTENER
    //
    theLabel.addEventListener("click", function( event ) {

      tradeListener( sub, checkBox, radioButton, theLabel );
      
    });

    
    turnTrade_On(checkBox, radioButton, theLabel, sub);

    // add it to the UI
    theList.appendChild( newNode );
  });



}





/**
 * Helper function
 * 
 * 
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
  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 215)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
  return (c);
}

//  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);



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
export function seedColors( all_trades ) {

    var num_trades = all_trades.length;
    
    // for each trade....
    for (let i = 0; i < num_trades; i++ ) {
      
      var trade_name = all_trades[i].tn;
      var num_leedz = all_trades[i].nl;

      // TRADES
      // { ( trade_name: [ color, num_leedz, showing ] ), (), ()... }
      // is there ALREADY a color assigned to this trade_name in cache?
      var cache_trade = theColor = window.localStorage.getObj( trade_name );
      if (cache_trade == null) {
         // create a new color and assign it to trade_name
        var theColor = createColor( num_trades, i );
        window.localStorage.setObj(trade_name, [ theColor, num_leedz, false ]); 
      
      
      } else {
        var theColor = cache_trade[0];
        // if there is a color assigned -- leave it alone
          if (theColor != null && theColor.startsWith('#') && theColor.length == 7) { 
              continue;
          } else {
              theColor = createColor( num_trades, i );
              window.localStorage.setObj(trade_name, [ theColor, num_leedz, false ]); 
          }
       }
    }
  }




/*
 *
 */
export function printColors() {
  
  for (let trade of Object.keys(localStorage) ) {
    
    let theKey = window.localStorage.getObj(trade);

    if (theKey[0] != undefined) {
      var theColor = theKey[0];
      console.log("%c" + trade + ": " + theColor, "color:" + theColor + ";");
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
  var the_color = window.localStorage.getObj(trade_name)[0];
  var num_leedz = window.localStorage.getObj(trade_name)[1];
  window.localStorage.setObj(trade_name, [ the_color, num_leedz, true ] );


  // DEBUG
  // var theString = "* TURN ON=" + trade_name + "color=" + the_color;
  // console.log("%c" + theString, "color: " + the_color + ";"); 


  // turn on the check box and the radio button
  if (checkBox != null) checkBox.checked = true;
  radioButton.checked = true;

  // FIXME 2/2023 
  // should all be done in css but the initial setting doesn't persist
  // color the radio button
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
  var the_color = window.localStorage.getObj(trade_name)[0];
  var num_leedz = window.localStorage.getObj(trade_name)[1];
  window.localStorage.setObj(trade_name, [ the_color, num_leedz, true ] );


  // turn on the check box and the radio button
  if (checkBox != null) checkBox.checked = false;
  radioButton.checked = false;
  
  // color the radio button
  // FIXME 2/2023 FIXME 
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

