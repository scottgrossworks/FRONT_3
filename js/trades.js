import { loadLeedzForTrade, removeLeedzForTrade } from "./calendar.js";





/**
 * @param String name of trade
 * @returns boolean true if the radio button for trade_name is turned in
 */
export function isSubscribed( trade_name ) {

  const theList = document.querySelector("#trades_list");
  
  // start with 1 -- skip the template
  for (var i = 1; i < theList.children.length; i++) {
    let each_trade = theList.children[i];

    console.log("i["+i+"]=" + each_trade);

    let isSub = each_trade.getAttribute("SUB");
    if (isSub == true) return true;  // should only retun true for "1"
  }

  
  return false;
}


/**
 * 
 * @param String name of trade
 * @returns String color corresponding to it in the trades column
 */
export function getColorForTrade(trade_name) {

  for (var i = 0; i < COLORS_TO_TRADES.length; i++) {
    var thePair = COLORS_TO_TRADES[i];
    if (thePair[1] == trade_name) {
      return thePair[0];
    }
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
   total_leedz: 5,
   user_subscribed: true,
 * }, .... 
 * ]
*/
export function initTradesColumn( all_trades ) {

  // initialize the spectrum of colors
  seedColorMap( all_trades );

  // import DOM elements from html
  const theList = document.querySelector("#trades_list");
  const theTemplate = document.querySelector("#template_each_trade");

  // for each trade object that comes from the DB
  all_trades.forEach(( trade ) => {     

    // clone a new node
    const newNode = theTemplate.content.cloneNode(true).querySelector(".each_trade");
  
    // set the label
    let theLabel = newNode.querySelector("label");
    theLabel.textContent = trade.trade_name;

    // set the leed count as a superscript
    newNode.querySelector("sup").textContent = trade.total_leedz;

    let checkBox = newNode.querySelector(".trade_checkbox");
    let radioButton = newNode.querySelector(".trade_radio");
  

    // is the user subscribed to this trade?
    if (trade.user_subscribed) {
      // each trade knows that it is subscribed to
      newNode.setAttribute("SUB", "1");
      turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);
    
    } else {
       newNode.setAttribute("SUB", "0");
    }
    
    //
    // click listener for the checkbox
    //
    checkBox.addEventListener("click", function( event ) {
    
      if ( trade.user_subscribed ) { // checkbox is ON

        newNode.setAttribute("SUB", "0");
        turnTrade_Off(checkBox, radioButton, theLabel, trade.trade_name);

      } else { // checkbox is OFF
        newNode.setAttribute("SUB", "1");
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }
    });



    //
    // click listener for the radio button
    //
    radioButton.addEventListener("click", function( event ) {
    
      if ( trade.user_subscribed ) { // radio button is ON

        newNode.setAttribute("SUB", "0");
        turnTrade_Off(checkBox, radioButton, theLabel, trade.trade_name);

      } else { // radio button is OFF

        newNode.setAttribute("SUB", "1");
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }
    });



    //
    // click listener for the label
    //
    theLabel.addEventListener("click", function( event ) {
    
      if ( trade.user_subscribed ) { // radio button is ON

        newNode.setAttribute("SUB", "0");
        turnTrade_Off(checkBox, radioButton, theLabel, trade.trade_name);

      } else { // radio button is OFF

        newNode.setAttribute("SUB", "1");
        turnTrade_On(checkBox, radioButton, theLabel, trade.trade_name);

      }
    });
  



    theList.appendChild( newNode );

  });


  // DEBUG DEBUG DEBUG
  //printColorMap();
}



const COLORS_TO_TRADES = Array();



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
 * Seed the COLORS_TO_TRADES map
 * generate a spectrum of evenly-spaced colors and assign them to 
 * boxes of a 2-dimensional array, with each color paired to a trade_name
 * if no trade name has been assigned, the second element will be null
 * 
 * all_trades is the array 
 * 
 * [
 * {
    trade_name: "caricatures",
    total_leedz: 5,
    user_subscribed: true,
 * }, .... 
 * ]
 * 
 * 
 * modifies COLORS_TO_TRADES
 * [ [color1, trade_name], [color2, null], .... ]
 */
function seedColorMap( all_trades ) {

    var num_trades = all_trades.length;
    
    for (let i = 0; i < num_trades; i++ ) {
      
      var theColor = createColor( num_trades, i );
      var theTrade = all_trades[i].trade_name;

      // see if this color was already assigned to a trade
      // on a previous page load
      var colorAssigned = window.sessionStorage.getItem( theTrade );
      if (colorAssigned != null) {
        // assign this color to a trade name
        COLORS_TO_TRADES.push( new Array( theColor, theTrade)  ); 
      } else {
        // assign a null to this color
        COLORS_TO_TRADES.push( new Array( theColor, null)  );
      }
    }
}



/*
 *
 */
function printColorMap() {
  for (let i = 0; i < COLORS_TO_TRADES.length; i++) {
      var theColor = COLORS_TO_TRADES[i][0];
      var theString = i + ":" + theColor;
      console.log("%c" + theString, "color: " + theColor + ";"); 
  }
}


/*
 * return an UNUSED randomly generated color
 * assign tradeName to color in COLORS_TO_TRADES
 * 
 * COLORS_TO_TRADES[ index ][color, tradeName]
 */
function getTradeColor( tradeName ) {

  // choose a random index into COLORS_TO_TRADES
  let index = Math.floor(Math.random() * COLORS_TO_TRADES.length);
  // console.log("RANDOM INDEX=" + index + " OF " + COLORS_TO_TRADES.length);

  let hexColor = COLORS_TO_TRADES[index][0];
  let isAssigned = ( COLORS_TO_TRADES[index][1] !== null );

  // if color is in use - recurse and try again
  if (isAssigned) {
    return getTradeColor( tradeName );
  }
  
  // else -- 
  // assign this color to a trade and return it
  COLORS_TO_TRADES[index][1] = tradeName;
  
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
    
    // NO  -- generate a new random color and
    // map it in session storage to the trade name
    theColor = getTradeColor( trade_name );
    window.sessionStorage.setItem(trade_name, theColor);
  }

  

  // FIXME 2/2023 
  // should all be done in css but the initial setting doesn't persist
  // color the radio button
  radioButton.style.backgroundColor = theColor;
  radioButton.classList.add("trade_active");

  // recolor the label
  theLabel.style.color = "black";


  // ask the DB for all the leedz for this trade / color in the UI
  //
  loadLeedzForTrade(trade_name, radioButton.style.backgroundColor);
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


