import { loadLeedzForTrade, removeLeedzForTrade } from "./calendar.js";
import { isSubscribed, saveSubscription, removeSubscription } from "./user.js";
import { getTrades } from "./dbTools.js";
import { printError } from "./js/error.js";


const COLORS = Array();

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
 * 
 */
export async function getAllTrades() {

  let retJSON = DEFAULT_TRADES;

  console.error(">>>>>getAllTrades(" + retJSON.length + ") <<<<<<<<<");

    try {

      retJSON = await getTrades();

    } catch (error) {

      printError("getAllTrades()", error );
      printError("getAllTrades()", "Using DEFAULT trades");
      retJSON = DEFAULT_TRADES;
    }


      return retJSON;
  }


/**
 * mapping colors->trade persists even when trade unselected -- so that
 * if it is turned back on you get the same color again
 * 
 * @param String name of trade
 * @returns String color corresponding to it in the trades column
 */
export function getColorForTrade(trade_name) {

  let cacheColor = window.sessionStorage.getItem( trade_name );
  if (cacheColor != null) {
    return cacheColor;
  }

  return "var(--LEEDZ_GRAY)";
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

  if ((all_trades == null) || (all_trades.length == 0)) return;

  // initialize the spectrum of colors
  seedColors( all_trades );

  // import DOM elements from html
  const theList = document.querySelector("#trades_list");
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
        console.error("TURNING OFF");
        removeSubscription( trade.trade_name );
        turnTrade_Off(checkBox, radioButton, theLabel, trade.trade_name);

      } else { // checkbox is OFF
        console.error("!!!TURNING ON");
        saveSubscription( trade.trade_name );
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }
    });



    //
    // click listener for the radio button
    //
    radioButton.addEventListener("click", function( event ) {


      if ( isSubscribed( trade.trade_name) ) { // radio button is ON

        removeSubscription( trade.trade_name );
        turnTrade_Off(checkBox, radioButton, theLabel, trade.trade_name);

      } else { // radio button is OFF

        saveSubscription( trade.trade_name );
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }
    });



    //
    // click listener for the label
    //
    theLabel.addEventListener("click", function( event ) {
    
      if ( isSubscribed( trade.trade_name) ) { // radio button is ON

        removeSubscription( trade.trade_name );
        turnTrade_Off(checkBox, radioButton, theLabel, trade.trade_name);

      } else { // radio button is OFF

        saveSubscription( trade.trade_name );
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }
    });
  

    
    if (is_sub) {
      theList.prepend( newNode );
    } else {
      theList.appendChild( newNode );
    }
    
  });


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
      // create a color and seed the map
      var theColor = createColor( num_trades, i );
      COLORS.push( theColor );
    
    }
  }





/*
 *
 */
export function printColors() {
  for (let i = 0; i < COLORS.length; i++) {
      var theColor = COLORS[i];
      var theString = i + ":" + theColor;
      console.log("%c" + theString, "color: " + theColor + ";"); 
  }
}


/*
 * return an UNUSED randomly generated color
 * 
 * COLORS[ index ] == available color, or null if color is in use
 */
function chooseTradeColor( tradeName ) {

    // choose a random index into COLORS
    let index = Math.floor(Math.random() * COLORS.length);

    // if color is in use - recurse and try again
    let isAssigned = ( COLORS[index]== null ); // null means it's in use
      if (isAssigned) {
        return chooseTradeColor( tradeName );
      }
    
    // != null, color still available 
    // replace this color with null and return it
    let hexColor = COLORS[index];
    COLORS[index] = null;
     
    return hexColor;
}





/*
 *
 */
function turnTrade_On( checkBox, radioButton, theLabel, trade_name ) {


  // turn on the check box and the radio button
  checkBox.checked = true;
  radioButton.checked = true;

  // has the color already been set from a previous load
  //
  var theColor = window.sessionStorage.getItem(trade_name);
  if (theColor == null) {

    // NO -- color has not been assigned
    // generate a new random color and map it in session storage to the trade name
    theColor = chooseTradeColor( trade_name );
    window.sessionStorage.setItem(trade_name, theColor);

  } 

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


  // ask the cache/DB for all the leedz for this trade (and month showing)
  // and add them to UI
  //
  loadLeedzForTrade(trade_name);
}



/*
 *
 */
function turnTrade_Off( checkBox, radioButton, theLabel, trade_name ) {
  
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

  // do NOT remove the color from session-storage
  // in case user turns trade back on -- same color will appear
  // window.sessionStorage.setItem(trade_name, null);
  radioButton.classList.remove("trade_active");

  // remove all leedz from calendar for this trade
   removeLeedzForTrade(trade_name);
}



