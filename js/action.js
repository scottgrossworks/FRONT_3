/* action.js */

import { getWeekday, getHours, getMinutes, getShortMonthname, getMonthname, getShortDateString } from "./dates.js";
import { getColorForTrade } from "./trades.js";
import { db_getDeetz, USERNAME_URL_PARAM } from "./dbTools.js";
import { errorModal, printError, throwError } from "./error.js";
import { getCurrentUser } from "./user.js";
import { getCurrentLeed, cacheCurrentLeed, LEED_KEYS, OPTS_HIDDEN } from "./leed.js";



/**   

function setActionHeight( window_height ) {

    var action = document.getElementById("action_panel");
    // var screen = action.getAttribute("screen");
    
    var action_height = Math.floor(window_height * 0.7 );
    action.style.height = action_height;
 
    switch (screen) {
        
        case "0":
            // small
            // mobile phones
            action.style.height = action_height;
            break;
        
        case "1":
            // medium
            // tablets
            action.style.height = action_height;
            break;
        
        case "2":
            // large
            // browser window
            action.style.height = action_height;
            break;
        
        default:
            printError("setActionHeight", "invalid screen attribute: " + screen);
    }
}
*/




    
/*
 * Show full leed details in the action window
 
leed_preview already contains 

{   
        "id": 1004, 
        "cr": "scott.gross", 
        "zp": "90056", 
        "st": 1682452800000, 
        "et": 1682460000000, 
        "tn": "airbrush",
        "nt": "staff appreciation party"
    }

leed_details contains

[
    {
        "id": 1004,
        "lc": "1001 Airbrush Lane, Los Angeles, CA 90056",  
        "dt": "These are the potentially-longwinded leed details for staff appreciation party, leed id: 1004",
        "rq": "These are the requirements for the gig.  This may include things like insurance, call-time, NDAs and attire.",
        "em": "scottgrossworks@gmail.com",
        "ph": "123456789",
        "pr": "40",
        "op":"0001000010000"
    }
]
*
*
* if user has posted this leed -- show EDIT button
* 
* if someone else has posted this leed -- show BUY and REPORT buttons
*
*/
export async function showLeedAction( leed_preview , gotoDB ) {

    // SET THE WINDOW SIZE
    // will show everything at the very end
    let action = document.getElementById("action_panel");
    // var action_height = Math.floor( window.innerHeight * 0.7 );
    action.style.height = "100%";



    const CURRENT_LEED = getCurrentLeed();
    let leed_details = CURRENT_LEED;


    // API request --> DB   
    // load full leed details for leed_preview.id
    //
    if (gotoDB) {

        await db_getDeetz( leed_preview.tn, leed_preview.id )
            .then(data => {

            if (data == null) throw new Error("null response from GET");
            leed_details = data[0];
            
            // query returns empty result set
            if (leed_details == null) throw new Error("No leed details for id: " + leed_preview.id);
                
            })
        .catch(error => {

            printError( "getDeetz()", error.message );
           
            errorModal("Cannot get leed details for [" + leed_preview.tn + "] " + leed_preview.id, true);
            
            // EXIT FUNCTION HERE
            throwError( "showLeedAction()", error); 
        });
    }

        
    //
    // START DATE
    //
    let startDate = new Date(leed_preview.st);
    let isoStart = startDate.toISOString();
    const leed_weekday = getWeekday( getShortDateString( isoStart ) );

    // use the long monthname for the modal action window
    // and short monthname for the column view
    // var screen = getComputedStyle( document.documentElement ).getPropertyValue('--screen_size').trim();
    var screen = action.getAttribute("screen");
    let leed_monthname = "";
    if (screen == "2") {
        leed_monthname = getShortMonthname( isoStart.substring(5, 7) ); 
    } else {
        leed_monthname = getMonthname( isoStart.substring(5, 7) ); 
    }

    // remove '0' at front if any
    let leed_date = isoStart.substring(8, 10);
    if (leed_date.startsWith('0')) { leed_date = leed_date.substring(1) };

    const leed_year = isoStart.substring(0, 4);
    
    let hours_start = getHours(isoStart);
    

    //
    // END DATE
    //
    let endDate = new Date(leed_preview.et);
    let isoEnd = endDate.toISOString();
    let hours_end = getHours(isoEnd);

    const start_time = hours_start[0] + ":" + getMinutes(isoStart) + hours_start[1];
    const end_time = hours_end[0] + ":" + getMinutes(isoEnd) + hours_end[1];


    

    // LEED TITLE
    //
    let trade_color = getColorForTrade( leed_preview.tn );
    const radioButton = document.querySelector("#lic_trade_radio");
    radioButton.style.backgroundColor = trade_color; 

    let theTrade = document.querySelector("#lic_trade");
    theTrade.innerHTML = leed_preview.tn;
    theTrade.style.border = "2px solid " + trade_color;
    theTrade.style.backgroundColor = trade_color;

    let theDate = document.querySelector("#lic_date");
    theDate.innerHTML = leed_weekday + " " + leed_monthname + " " + leed_date + ", " + leed_year; 



    // TITLE
    //
    let theDiv = document.querySelector("#title_value");
    theDiv.innerHTML = leed_preview.ti;


    // START TIME - END TIME
    //
    theDiv = document.querySelector("#start-end_value");
    theDiv.innerHTML = start_time + " - " + end_time;




    // LOCATION
    // loc == full address
    theDiv = document.querySelector("#loc_value");
    if (CURRENT_LEED.op[ LEED_KEYS.LOC ] == OPTS_HIDDEN ) {
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = leed_details.lc;
    }
    CURRENT_LEED.lc = leed_details.lc;




    // ZIP
    theDiv = document.querySelector("#zip_value");
    theDiv.innerHTML = leed_preview.zp;
    CURRENT_LEED.zp = leed_preview.zp;
    
    
        


    // EMAIL
    // (OPTIONAL)
    if (leed_details.em == null || leed_details.em == "") {
        theDiv = document.querySelector("#em");
        theDiv.style.display = "none";

    } else {
        theDiv = document.querySelector("#em_value");
        if (CURRENT_LEED.op[ LEED_KEYS.EM ] == OPTS_HIDDEN ) { 
            theDiv.classList.add("buy2show");
            theDiv.innerHTML = "Buy to show";
        } else {
            theDiv.classList.remove("buy2show");
            theDiv.innerHTML = leed_details.em;
        }
   
        theDiv.style.display = "flex";
    }
    CURRENT_LEED.em = leed_details.em;



    // PHONE
    // (OPTIONAL)
    if (leed_details.ph == null || leed_details.ph == "") {
        theDiv = document.querySelector("#ph");
        theDiv.style.display = "none";

    } else {
        theDiv = document.querySelector("#ph_value");
        if (CURRENT_LEED.op[ LEED_KEYS.PH ] == OPTS_HIDDEN ) { 
            theDiv.classList.add("buy2show");
            theDiv.innerHTML = "Buy to show";
        } else {
            theDiv.classList.remove("buy2show");
            theDiv.innerHTML = leed_details.ph;
        }
       
        theDiv.style.display = "flex";
    }
    CURRENT_LEED.ph = leed_details.ph;






    // DETAILS
    // from leed_details
    // (OPTIONAL)
    //
    if (leed_details.dt == null || leed_details.dt == "") {
        theDiv = document.querySelector("#det");
        theDiv.style.display = "none";

    } else {
        theDiv = document.querySelector("#det_value");
        if (CURRENT_LEED.op[ LEED_KEYS.DET ] == OPTS_HIDDEN ) {  
            theDiv.classList.add("buy2show");
            theDiv.innerHTML = "Buy to show";
        } else {
            theDiv.classList.remove("buy2show");
            theDiv.innerHTML = leed_details.dt;
        }
        theDiv.style.display = "flex";
    }
    CURRENT_LEED.dt = leed_details.dt;




    // REQUIREMENTS
    // from leed_details
    // (OPTIONAL)
    // 
    if (leed_details.rq == null || leed_details.rq == "") {
        theDiv = document.querySelector("#reqs");
        theDiv.style.display = "none";

    } else {
        theDiv = document.querySelector("#reqs_value");
        if (CURRENT_LEED.op[ LEED_KEYS.REQS ] == OPTS_HIDDEN ) { 
            theDiv.classList.add("buy2show");
            theDiv.innerHTML = "Buy to show";
        } else {
            theDiv.classList.remove("buy2show");
            theDiv.innerHTML = leed_details.rq;
        }
        theDiv.style.display = "flex";
    }
    CURRENT_LEED.rq = leed_details.rq;



    // 
    // creator
    // from leed_preview
    // open the user_show.html with the creator passed as a URL param
    //
    theDiv = document.querySelector("#creator_value");    
    
    const current_user = getCurrentUser(false);

    if (current_user.un == leed_preview.cr) {

        // this leed is posted by the current user

        theDiv.innerHTML = "<a href='./user_edit.html'>" + leed_preview.cr + "</a>";

    } else {
    
        var theURL = "./user_show.html?" + USERNAME_URL_PARAM + "=" + leed_preview.cr;
        var theHTML = "<a href=" + theURL + ">" + leed_preview.cr + "</a>";
        theDiv.innerHTML = theHTML;
    }

    


    
    // *** PRICE ***
    // from leed_details
    theDiv = document.querySelector("#pr_value");
    theDiv.innerHTML = "$" + leed_details.pr;
    CURRENT_LEED.pr = leed_details.pr;




    // Now that the new data is copied into CURRENT_LEED
    // cache the leed
    cacheCurrentLeed( CURRENT_LEED );



    //
    //
    //  BUTTONS
    //
    //


    let row_buy_button = document.getElementById("row_buy_button");
    let row_report_button = document.getElementById("row_report_button");
    let row_edit_button = document.getElementById("row_edit_button");
    let row_del_button = document.getElementById("row_del_button");

    // the action buttons at the bottom depend on whether the
    // current user posted the leed being examined
    // 
    if (current_user.un == leed_preview.cr) {

        // the current user POSTED this leed
        // show the EDIT/DEL buttons
        row_buy_button.style.display = "none";
        row_report_button.style.display = "none";
        row_edit_button.style.display = "flex";
        row_del_button.style.display = "flex";




    } else {


        // current user is trying to BUY someone else's leed
        row_buy_button.style.display = "flex";
        row_report_button.style.display = "flex";
        row_edit_button.style.display = "none";
        row_del_button.style.display = "none";

    
    }


    // HIDE the welcome panel if it exists
    let welcome = document.getElementById("welcome_panel");
    welcome.style.display = "none";


    // SHOW the action_panel
    //
    // got action above
    // let action = document.getElementById("action_panel");
    action.style.display = "block";
    var screen = action.getAttribute("screen");
    if (screen == 0) {
        action.className = "modal";
    }


    // let closeBut = document.getElementById("buy_modal_close");
    // closeBut.style.display = "flex";

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



  