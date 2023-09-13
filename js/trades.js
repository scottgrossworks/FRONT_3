/**
 * 
 * 
 * 
 */

import { loadCacheLeedz, loadDBLeedz, removeLeedzShowing } from "./calendar.js";
import { isSubscribed, saveSubscription, removeSubscription, getCurrentUser } from "./user.js";
import { db_getTrades } from "./dbTools.js";
import { printError, errorModal, throwError } from "./error.js";
import { hideActionWindow } from "./action.js";


const TRADES_LIST_KEY = "TL";



const COLORS = new Map();




/**
 * is this a valid trade name?
 *  
 */
export function isValidTrade( tradeName ) {


  let fromCache = window.sessionStorage.getItem( TRADES_LIST_KEY );
  if (fromCache == null)
    throwError("isValidTrade", "No Trades Loaded");

  const TRADES_LIST = JSON.parse( fromCache );

  if (TRADES_LIST.length == 0) return false;

  for (var i = 0; i < TRADES_LIST.length; i++) {
    
    if ( TRADES_LIST[i].tn == tradeName ) {
     return true;
    }
  }
  return false;
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

      // store trades for checking against future new leedz posts
      window.sessionStorage.setItem( TRADES_LIST_KEY, JSON.stringify( retJSON ));


    } catch (error) {

      printError("db_getTrades()", error );
      printError("getAllTrades()", "Using EMPTY trades list");
      retJSON = [];
      window.sessionStorage.setItem( TRADES_LIST_KEY, JSON.stringify( retJSON ));
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

  let theColor = COLORS.get(trade_name);

  if (theColor == null) {
      // check the cache 
      // is there a color assigned to this trade_name in cache?
      theColor = window.sessionStorage.getItem( trade_name );
      COLORS.set(trade_name, theColor);
  }

  // console.log(COLORS);
  // console.log("%cin getColorForTrade() GOT " + trade_name + ": " + theColor, "color:" + theColor + ";");

  if (theColor != null) {

    return theColor;
  
  } else {

    return "var(--LEEDZ_GRAY)";
  }
  
}



/**
 *
 * all_trades is the array 
 * 
 * [
 * {
   tn: "caricatures",
   nl: 5
 * }, .... 
 * ]
*/
export function initTradesColumn( all_trades ) {

  if ((all_trades == null) || (all_trades.length == 0)) return;

  // initialize the spectrum of colors
  seedColors( all_trades );

  // import DOM elements from html
  const theList = document.querySelector("#trades_list");
  const subs = [];
  const theTemplate = document.querySelector("#template_each_trade");



  // for JSON each trade object that comes from the DB
  all_trades.forEach(( trade ) => {     

    // clone a new node
    const newNode = theTemplate.content.cloneNode(true).querySelector(".each_trade");
  
    // set the label
    let theLabel = newNode.querySelector("label");
    theLabel.textContent = trade.tn;

    // set the leed count as a superscript
    // if there is an error we are using default leedz without numbers
    if (trade.nl != undefined)
      newNode.querySelector("sup").textContent = trade.nl;


    let checkBox = newNode.querySelector(".trade_checkbox");
    let radioButton = newNode.querySelector(".trade_radio");
 
  
    // check SUBSCRIPTIONS
    // is the user subscribed to this trade?
    var is_sub = false;
    if ( isSubscribed( trade.tn ) ) {
      turnTrade_On(checkBox, radioButton, theLabel, trade.tn);
      is_sub = true;
    }
    

    
    

    //
    // CHECKBOX CLICK LISTENER
    //
    checkBox.addEventListener("click", function( event ) {
  
      tradeListener( trade, checkBox, radioButton, theLabel );
      
    });



    //
    // RADIO BUTTON CLICK LISTENER
    //
    radioButton.addEventListener("click", function( event ) {
  
      tradeListener( trade, checkBox, radioButton, theLabel );

    });



    //
    // LABEL CLICK LISTENER
    //
    theLabel.addEventListener("click", function( event ) {

      tradeListener( trade, checkBox, radioButton, theLabel );
      
    });
  

    
    if (is_sub) {
      subs.push( newNode ); 
    } else {
      theList.appendChild( newNode );
    }
    
  });

    // this allows for a sorted list of subscriptions
    for (var i = subs.length - 1; i >= 0; i--) {
      theList.prepend(subs[i]);
    }


}




/**
 * Helper function
 */
function tradeListener(trade, checkBox, radioButton, theLabel) {

  try {

      if ( isSubscribed( trade.tn)  ) { // TRADE is ON

        removeSubscription( trade.tn );
        turnTrade_Off(checkBox, radioButton, theLabel);


      } else { // TRADE is OFF

        saveSubscription( trade.tn )
        
        .then( response => { 
          
          turnTrade_On(checkBox, radioButton, theLabel, trade.tn);

        }).catch(error => {
          // Handle error
          printError("tradeListener", error.message);
          // Display modal error dialog to the user
          errorModal(error.message, false);
          
          return false;
        });
      }

      // clear the action window
      hideActionWindow();
      
      removeLeedzShowing();

      // reload current month leedz from cache
      loadCacheLeedz();

      // ASYNC
      // go back to DB for fresh view -- will return immediately
      // update calendar later
      loadDBLeedz();

  } catch (error) {
    errorModal(error, false);
    return false;
  }

}






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
 * Seed the COLORS
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
function seedColors( all_trades ) {

    var num_trades = all_trades.length;
    
    // for each trade....
    for (let i = 0; i < num_trades; i++ ) {
      
      // is there ALREADY a color assigned to this trade_name in cache?
      var theColor = window.sessionStorage.getItem( all_trades[i].tn );
      if (theColor != null) {
        COLORS.set( all_trades[i].tn,  theColor ); 
      
      
      } else {
        // create a new color and assign it to trade_name
        theColor = createColor( num_trades, i );
        COLORS.set( all_trades[i].tn,  theColor );

        // cache this in case of browser refresh
        window.sessionStorage.setItem( all_trades[i].tn, theColor );
      }

    
    }
  }





/*
 *
 */
export function printColors() {
  
  for (let trade_name of COLORS.keys() ) {
    var theColor = COLORS.get(trade_name);
    console.log("%c" + trade_name + ": " + theColor, "color:" + theColor + ";");
  }
}






/*
 *
 */
function turnTrade_On( checkBox, radioButton, theLabel, trade_name ) {

  // turn on the check box and the radio button
  checkBox.checked = true;
  radioButton.checked = true;

  // get the color assigned to this trade
  var theColor = COLORS.get(trade_name);


  // DEBUG
  // var theString = "TURN ON=" + trade_name;
  // console.log("%c" + theString, "color: " + theColor + ";"); 

  // FIXME 2/2023 
  // should all be done in css but the initial setting doesn't persist
  // color the radio button
  radioButton.style.backgroundColor = theColor;
  radioButton.classList.add("trade_active");

  // recolor the label
  theLabel.style.color = "black";

}



/*
 *
 */
function turnTrade_Off( checkBox, radioButton, theLabel ) {
  
  // turn on the check box and the radio button
  checkBox.checked = false;
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

