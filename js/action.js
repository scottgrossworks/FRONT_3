/* action.js */

import { getWeekday, getHours, getMinutes, getShortMonthname, getMonthname, getShortDateString } from "./dates.js";
import { getColorForTrade } from "./trades.js";
import { db_getDeetz } from "./dbTools.js";
import { printError, throwError } from "./error.js";


    
//
// FIXME FIXME FIXME
// local caching and changes on DB / race conditions
// cache by id?
//
// FIXME FIXME FIXME
// buy button?

/*
 * Show full leed details in the action window
 
leed_preview already contains 

{   
        "id": 1004, 
        "creator": "scott.gross", 
        "zip": "90056", 
        "start": 1682452800000, 
        "end": 1682460000000, 
        "trade": "airbrush",
        "note": "staff appreciation party"
    }

leed_details contains

[
    {
        "id": 1004,
        "trade": "airbrush", 
        "loc": "1001 Airbrush Lane, Los Angeles, CA 90056",  
        "det": "These are the potentially-longwinded leed details for staff appreciation party, leed id: 1004",
        "reqs": "These are the requirements for the gig.  This may include things like insurance, call-time, NDAs and attire.",
        "em": "scottgrossworks@gmail.com",
        "price": "40"
    }
]
*
*
*/
export async function showLeedAction( leed_preview ) {

   
    // API request --> DB   
    // load full leed details for leed_preview.id
    //
    let leed_details = null;
    await db_getDeetz( leed_preview.id )
        .then(data => {

          if (data == null) throw new Error("null response from GET");
          leed_details = data[0];
        
          // query returns empty result set
          if (leed_details == null) throw new Error("No leed details for id: " + leed_preview.id);
            
        })
    .catch(error => {

        printError( "getDeetz()", error.message );
        // EXIT FUNCTION HERE
        throwError( "showLeedAction()", error); 
    });




    // START DATE
    let startDate = new Date(leed_preview.start);
    let isoStart = startDate.toISOString();
    const leed_weekday = getWeekday( getShortDateString( isoStart ) );

    // use the long monthname for the modal action window
    // and short monthname for the column view
    var screen = getComputedStyle( document.documentElement ).getPropertyValue('--screen_size').trim();
    let leed_monthname = "";
    if (screen == "L") {
        leed_monthname = getShortMonthname( isoStart.substring(5, 7) ); 
    } else {
        leed_monthname = getMonthname( isoStart.substring(5, 7) ); 
    }

    // remove '0' at front if any
    let leed_date = isoStart.substring(8, 10);
    if (leed_date.startsWith('0')) { leed_date = leed_date.substring(1) };

    const leed_year = isoStart.substring(0, 4);
    
    let hours_start = getHours(isoStart);
    
    // END DATE
    let endDate = new Date(leed_preview.end);
    let isoEnd = endDate.toISOString();
    let hours_end = getHours(isoEnd);

    const start_time = hours_start[0] + ":" + getMinutes(isoStart) + hours_start[1];
    const end_time = hours_end[0] + ":" + getMinutes(isoEnd) + hours_end[1];


    

    // leed_title
    //
    let trade_color = getColorForTrade( leed_preview.trade );
    const radioButton = document.querySelector("#lic_trade_radio");
    radioButton.style.backgroundColor = trade_color; 

    let theTrade = document.querySelector("#lic_trade");
    theTrade.innerHTML = leed_preview.trade;
    theTrade.style.border = "2px solid " + trade_color;
    theTrade.style.backgroundColor = trade_color;

    let theDate = document.querySelector("#lic_date");
    theDate.innerHTML = leed_weekday + " " + leed_monthname + " " + leed_date + ", " + leed_year; 


    // event_info
    //
    let theDiv = document.querySelector("#event_value");
    theDiv.innerHTML = leed_preview.note;

    // START TIME - END TIME
    //
    theDiv = document.querySelector("#start-end_value");
    theDiv.innerHTML = start_time + " - " + end_time;
     

    // loc in details - zip in preview
    // loc == full address
    theDiv = document.querySelector("#loc_value");
    theDiv.innerHTML = leed_details.loc;



    // DETAILS
    // from leed_details
    theDiv = document.querySelector("#details_value");
    theDiv.innerHTML = leed_details.det;


    // requirements
    // from leed_details
    theDiv = document.querySelector("#reqs_value");
    theDiv.innerHTML = leed_details.reqs;


    // creator
    // from leed_preview
    theDiv = document.querySelector("#posted_by_value");    
    var theHTML = "<a href='mailto:" + leed_details.em + "'>";
    theHTML = theHTML + leed_preview.creator + "</a>";
    theDiv.innerHTML = theHTML;


    
    // *** PRICE ***
    // from leed_details
    theDiv = document.querySelector("#price_value");
    theDiv.innerHTML = "$" + leed_details.price;



    // HIDE the welcome panel if it exists
    let welcome = document.getElementById("welcome_panel");
    welcome.style.display = "none";


    // SHOW the action_panel
    //
    let action = document.getElementById("action_panel");
    action.style.display = "block";

    //
    // FIXME FIXME FIXME
    //
    // function
    // PROGRAM THE BUY BUTTON?
    // let buy_button = document.querySelector("action_buy");
    // leed_preview.creator
    // leed_details.em

}



/**
 * 
 */
export function hideActionWindow() {
    
    // HIDE the action_panel
    //
    let action = document.getElementById("action_panel");
    action.style.display = "none";

    // SHOW the welcome panel if it exists
    let welcome = document.getElementById("welcome_panel");
    welcome.style.display = "block";

}