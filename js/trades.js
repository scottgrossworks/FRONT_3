import { reloadCalendar } from "./calendar.js";
import { isSubscribed, saveSubscription, removeSubscription, getSubscriptions } from "./user.js";
import { db_getTrades } from "./dbTools.js";
import { printError } from "./error.js";
import { hideActionWindow } from "./action.js";


const COLORS = new Map();

const DEFAULT_TRADES = [
    
    
  {
    trade_name: "acrobat"
  },
  
  {
    trade_name: "aerialist"
 
  },

  {
    trade_name: "balloon decor"

  },
  
  {
    trade_name: "balloon twisting"
  },


  {
    trade_name: "braiding"

  },

  {
    trade_name: "caricatures"
  },


  {
    trade_name: "casino"
  },

  {
    trade_name: "comedian"
  },


  {
    trade_name: "dancer"
  },
  
  {
    trade_name: "dj"
  },

  {
    trade_name: "facepainter"
  },


  {
    trade_name: "food truck"
  },

  {
    trade_name: "golf"
  },


  {
    trade_name: "gymnastics"
  },


  {
    trade_name: "hairstylist"
  },

  
  {
    trade_name: "henna"
  },

 
  {
    trade_name: "inflatables"
  },


  
  
  {
    trade_name: "magician"

  },


  {
    trade_name: "makeup"

  },

  {
    trade_name: "martial arts"

  },


  

  {
    trade_name: "musician"

  },


  
  {
    trade_name: "nails"

  },


  {
    trade_name: "piano tuner"


  },

  {
    trade_name: "pizza"


  },

  

  {
    trade_name: "photo booth"

  },


  {
    trade_name: "pony rides"


  },

  {
    trade_name: "surfing"

  },



  {
    trade_name: "tattoos"


  },


  {
    trade_name: "tacos"


  },


  {
    trade_name: "tutoring"

  },


  {
    trade_name: "video games"

  },

];






/**
 * is this a valid trade name?
 *  compare against default trades 
 */
export function isValidTrade( tradeName ) {
  
  for (var i = 0; i < DEFAULT_TRADES.length; i++) {
    
    if ( DEFAULT_TRADES[i].trade_name == tradeName ) {
     return true;
    }
  }
  return false;
}



/**
 * 
 */
export async function getAllTrades() {

  let retJSON = null;

    try {

      retJSON = await db_getTrades();

      // if it stays null or there's any problem, report it but do not fail
      if (retJSON == null) throw new Error("NO trades received from server");

    } catch (error) {

      printError("db_getTrades()", error );
      printError("getAllTrades()", "Using DEFAULT trades");
      retJSON = DEFAULT_TRADES;
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

  console.log(COLORS);
  console.log("%cin getColorForTrade() GOT " + trade_name + ": " + theColor, "color:" + theColor + ";");

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
   trade_name: "caricatures",
   num_leedz: 5
 * }, .... 
 * ]
*/
export function initTradesColumn( all_trades ) {

  console.error("**** INIT TRADES COLUMN *****");

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
    theLabel.textContent = trade.trade_name;

    // set the leed count as a superscript
    // if there is an error we are using default leedz without numbers
    if (trade.num_leedz != undefined)
      newNode.querySelector("sup").textContent = trade.num_leedz;

    let checkBox = newNode.querySelector(".trade_checkbox");
    let radioButton = newNode.querySelector(".trade_radio");
  
    // check SUBSCRIPTIONS
    // is the user subscribed to this trade?
    var is_sub = false;
    if ( isSubscribed( trade.trade_name ) ) {
      turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);
      is_sub = true;
    }
    

    //
    // click listener for the checkbox
    //
    checkBox.addEventListener("click", function( event ) {
     
      if ( isSubscribed( trade.trade_name)  ) { // checkbox is ON

        removeSubscription( trade.trade_name );
        turnTrade_Off(checkBox, radioButton, theLabel);


        console.log("CHECKBOX");
        getSubscriptions();


      } else { // checkbox is OFF

        saveSubscription( trade.trade_name );
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }

      // clear the action window
      hideActionWindow();
      
      // reload the leedz for the current month showing
     reloadCalendar();
    });



    //
    // click listener for the radio button
    //
    radioButton.addEventListener("click", function( event ) {


      if ( isSubscribed( trade.trade_name) ) { // radio button is ON

        removeSubscription( trade.trade_name );
        turnTrade_Off(checkBox, radioButton, theLabel);

        console.log("RADIO");
        getSubscriptions();


      } else { // radio button is OFF

        saveSubscription( trade.trade_name );
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }

      // clear the action window
      hideActionWindow();

      // reload the leedz for the current month showing
      reloadCalendar();
    });



    //
    // click listener for the label
    //
    theLabel.addEventListener("click", function( event ) {
    
      if ( isSubscribed( trade.trade_name) ) { // radio button is ON

        removeSubscription( trade.trade_name );
        turnTrade_Off(checkBox, radioButton, theLabel);

      } else { // radio button is OFF

        saveSubscription( trade.trade_name );
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }

      // clear the action window
      hideActionWindow();

      // reload the leedz for the current month showing
      reloadCalendar();
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
    

  // DEBUG DEBUG DEBUG
  // printColors();
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
  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
  return (c);
}



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
    trade_name: "caricatures",
    num_leedz: 5,
 * }, .... 
 * ]
 * 
 */
function seedColors( all_trades ) {

    var num_trades = all_trades.length;
    
    // for each trade....
    for (let i = 0; i < num_trades; i++ ) {
      
      // is there ALREADY a color assigned to this trade_name in cache?
      var theColor = window.sessionStorage.getItem( all_trades[i].trade_name );
      if (theColor != null) {
        COLORS.set( all_trades[i].trade_name,  theColor ); 
      
        // console.log("%cCACHE COLOR FOR " + all_trades[i].trade_name, "color: " + theColor + ";");
      
      } else {
        // create a new color and assign it to trade_name
        theColor = createColor( num_trades, i );
        COLORS.set( all_trades[i].trade_name,  theColor );

        // cache this in case of browser refresh
        window.sessionStorage.setItem( all_trades[i].trade_name, theColor );
      }

      // console.log("%c" + i + "=" + all_trades[i].trade_name, "color: " + theColor);
    
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
  var theString = "TURN ON=" + trade_name;
  console.log("%c" + theString, "color: " + theColor + ";"); 

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

