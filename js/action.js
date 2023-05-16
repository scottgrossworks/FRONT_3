/* action.js */

import { getWeekday, getHours, getMinutes, getShortMonthname, getMonthname, getShortDateString } from "./dates.js";
import { getColorForTrade } from "./trades.js";
import { db_getDeetz } from "./dbTools.js";
import { printError, throwError } from "./error.js";
import { getCurrentUser } from "./user.js";
import { getCurrentLeed, setCurrentLeed } from "./leed.js";


    
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
        "loc": "1001 Airbrush Lane, Los Angeles, CA 90056",  
        "det": "These are the potentially-longwinded leed details for staff appreciation party, leed id: 1004",
        "reqs": "These are the requirements for the gig.  This may include things like insurance, call-time, NDAs and attire.",
        "em": "scottgrossworks@gmail.com",
        "ph": "123456789",
        "pr": "40"
    }
]
*
*
* if user has posted this leed -- show EDIT button
* if someone else has posted this leed -- show BUY button
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


    
    const CURRENT_LEED = getCurrentLeed();


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


    

    // LEED TITLE
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

    const current_user = getCurrentUser();



    // TITLE NOTE
    //
    let theDiv = document.querySelector("#note_value");
    theDiv.innerHTML = leed_preview.note;

    // START TIME - END TIME
    //
    theDiv = document.querySelector("#start-end_value");
    theDiv.innerHTML = start_time + " - " + end_time;




    // LOCATION
    // loc == full address
    theDiv = document.querySelector("#loc_value");
    if (CURRENT_LEED.opts["loc"] == "hide") {
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = leed_details.loc;
    }
    CURRENT_LEED.loc = leed_details.loc;




    // ZIP
    theDiv = document.querySelector("#zip_value");
    theDiv.innerHTML = leed_preview.zip;
    CURRENT_LEED.zip = leed_preview.zip;
    
    
        


    // EMAIL
    // 
    theDiv = document.querySelector("#em_value");
    if (CURRENT_LEED.opts["em"] == "hide") {
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = leed_details.em;
    }
    CURRENT_LEED.em = leed_details.em;



    // PHONE
    // 
    theDiv = document.querySelector("#ph_value");
    if (CURRENT_LEED.opts["ph"] == "hide") {
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = leed_details.ph;
    }
    CURRENT_LEED.ph = leed_details.ph;






    // DETAILS
    // from leed_details
    // 
    theDiv = document.querySelector("#det_value");
    if (CURRENT_LEED.opts["det"] == "hide") {
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = leed_details.det;
    }
    CURRENT_LEED.det = leed_details.det;




    // REQUIREMENTS
    // from leed_details
    // 
    theDiv = document.querySelector("#reqs_value");
    if (CURRENT_LEED.opts["reqs"] == "hide") {
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = leed_details.reqs;
    }
    CURRENT_LEED.reqs = leed_details.reqs;





    // creator
    // from leed_preview
    theDiv = document.querySelector("#creator_value");    
    var theHTML = "<a href='mailto:" + current_user.email + "'>";
    theHTML = theHTML + leed_preview.creator + "</a>";
    theDiv.innerHTML = theHTML;


    
    // *** PRICE ***
    // from leed_details
    theDiv = document.querySelector("#pr_value");
    theDiv.innerHTML = "$" + leed_details.pr;
    CURRENT_LEED.pr = leed_details.pr;


    setCurrentLeed( CURRENT_LEED );





    //
    //
    //  BUTTONS
    //
    //
    //


    let row_buy_button = document.getElementById("row_buy_button");
    let row_edit_button = document.getElementById("row_edit_button");

    // the action buttons at the bottom depend on whether the
    // current user posted the leed being examined
    // 
    if (current_user.username == leed_preview.creator) {

        // the current user POSTED this leed
        // show the EDIT button
        row_buy_button.style.display = "none";
        row_edit_button.style.display = "flex";


        // pass the current leed from this page
        // to the leed_edit page using the session cache
        document.getElementById("action_edit").addEventListener( "click", (event) => { 
            console.log("%cEDIT BUTTON CALLBACK", "color:darkorange");

            // FIXMEFIXMEFIXME
            

        });


        // FOOBAR

    } else {
        // current user is trying to BUY someone else's leed
        // show the BUY button
        row_buy_button.style.display = "flex";
        row_edit_button.style.display = "none";

        // program the BUY button
        document.getElementById("action_buy").addEventListener( "click", (event) => { 
            console.log("%BUY BUTTON CALLBACK", "color:darkorange");
        });
    
    
        // FIXME FIXME FIXME FIXME
        // REPORT BUTTON 
        // REPORT BAD LEED
    
    
    }




    // HIDE the welcome panel if it exists
    let welcome = document.getElementById("welcome_panel");
    welcome.style.display = "none";


    // SHOW the action_panel
    //
    let action = document.getElementById("action_panel");
    action.style.display = "block";


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




/** 
 * 
 *
 *
 */


/** 
 * 
 *
 *
 */