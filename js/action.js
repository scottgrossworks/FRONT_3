/* action.js */

import { getWeekday, getHours, getMinutes, getShortMonthname, getMonthname, getShortDateString } from "./dates.js";
import { getColorForTrade } from "./trades.js";
import { db_getDeetz, USERNAME_URL_PARAM } from "./dbTools.js";
import { errorModal, printError, throwError } from "./error.js";
import { getCurrentUser } from "./user.js";
import { LEED_KEYS, OPTS_HIDDEN, SHOW_ALL_OPTS, setCurrentLeed, getCurrentLeed } from "./leed.js";


const NO_VAL = "<i style='font-weight:600;color:coral'>None Provided</i>";



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
        "sk": 12345678, 
        "cr": "scottgross.works",
        "zp": "90056", 
        "st": 1682452800000, 
        "et": 1682460000000, 
        "tn": "airbrush",
        "ti": "staff appreciation party"
        "op": "0000021122110"
    }

leed_details contains

[
    {
        "sk": 12345678,
        "lc": "1001 Airbrush Lane, Los Angeles, CA 90056",  
        "dt": "These are the potentially-longwinded leed details for staff appreciation party, leed id: 1004",
        "rq": "These are the requirements for the gig.  This may include things like insurance, call-time, NDAs and attire.",
        "em": "scottgrossworks@gmail.com",
        "ph": "1234567890",
        "pr": "40",

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

    const CURRENT_USER = getCurrentUser(false);

    // which fields do we want to see in the action window?
    var view_options = leed_preview.op;

    // holds the return data
    let leed_details = [];

    if (CURRENT_USER.un == leed_preview.cr) {   
        // this leed was created by the current user
        // request ALL fields in details
        view_options = SHOW_ALL_OPTS;
    }

    // API request --> DB   
    // load full leed details for leed_preview.id
    //
    if (gotoDB) {

        await db_getDeetz( leed_preview.tn, leed_preview.id, view_options )
            .then(data => {

            if (data == null) throw new Error("null response from GET");
            leed_details = data;
            
            // query returns empty result set
            if (leed_details == null) throw new Error("No leed details for id: " + leed_preview.id);
            
            // COPY leed details into current leed object 
            setCurrentLeed(leed_details);
            })
        .catch(error => {

            printError( "getDeetz()", error.message );
           
            errorModal("Cannot get leed details for [" + leed_preview.tn + "] " + leed_preview.id, true);
            
            // EXIT FUNCTION HERE
            throwError( "showLeedAction()", error); 
        
        
        })
    }

    let CURRENT_LEED = getCurrentLeed();    
    // console.log(CURRENT_LEED);
    
    //
    // START DATE
    //
    let startDate = new Date( parseInt(CURRENT_LEED.st) );
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
    
    // SHOULD BE SET
    // CURRENT_LEED.st = leed_preview.st;

    //
    // END DATE
    //
    let endDate = new Date( parseInt(CURRENT_LEED.et) );
    let isoEnd = endDate.toISOString();
    let hours_end = getHours(isoEnd);

    const start_time = hours_start[0] + ":" + getMinutes(isoStart) + hours_start[1];
    const end_time = hours_end[0] + ":" + getMinutes(isoEnd) + hours_end[1];

    // SHOULD BE SET
    // CURRENT_LEED.et = leed_preview.et;



    // LEED TITLE
    //
    let trade_color = getColorForTrade( CURRENT_LEED.tn );
    const radioButton = document.querySelector("#lic_trade_radio");
    radioButton.style.backgroundColor = trade_color; 




    // TRADE NAME
    //
    let theTrade = document.querySelector("#lic_trade");
    theTrade.innerHTML = CURRENT_LEED.tn;
    theTrade.style.border = "2px solid " + trade_color;
    theTrade.style.backgroundColor = trade_color;




    // DATE
    //
    let theDate = document.querySelector("#lic_date");
    theDate.innerHTML = leed_weekday + " " + leed_monthname + " " + leed_date + ", " + leed_year; 




    // TITLE
    //
    let theDiv = document.querySelector("#title_value");
    theDiv.innerHTML = CURRENT_LEED.ti;



    // START TIME - END TIME
    //
    theDiv = document.querySelector("#start-end_value");
    theDiv.innerHTML = start_time + " - " + end_time;
 



    // ZIP
    //
    theDiv = document.querySelector("#zip_value");
    theDiv.innerHTML = CURRENT_LEED.zp;
    

    // approach to showing/hiding
    // if it is returned from the DB at all -- it is not hidden
    // if it is not returned -- check if it is hidden 
    // if not -- it is not provided at all
    //

    // LOCATION
    // loc == full address
    // REQUIRED
    //
    theDiv = document.querySelector("#loc_value");
    if (CURRENT_LEED.lc) {

        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.lc;


    } else if (CURRENT_LEED.op[ LEED_KEYS.LC ] == OPTS_HIDDEN ) { 
       
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }



     

    // EMAIL
    // (OPTIONAL)
    //
    theDiv = document.querySelector("#em_value");
    if (CURRENT_LEED.em) {

        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.em;
   
    } else if (CURRENT_LEED.op[ LEED_KEYS.EM ] == OPTS_HIDDEN ) { 
       
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    
    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;

    }











    // PHONE
    // (OPTIONAL)
    //
    theDiv = document.querySelector("#ph_value");
    if (CURRENT_LEED.ph) {

        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.ph;

    } else if (CURRENT_LEED.op[ LEED_KEYS.PH ] == OPTS_HIDDEN ) { 
       
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    
    } else {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
        
    }








    // DETAILS
    // from leed_details
    // (OPTIONAL)
    //
    theDiv = document.querySelector("#det_value");
    if (CURRENT_LEED.dt) {

        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.dt;

    } else if (CURRENT_LEED.op[ LEED_KEYS.DT ] == OPTS_HIDDEN ) { 
       
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    
    } else {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
        
    }









    // REQUIREMENTS
    // from leed_details
    // (OPTIONAL)
    // 
    theDiv = document.querySelector("#reqs_value");
    if (CURRENT_LEED.rq) {

        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.rq;
        

    } else if (CURRENT_LEED.op[ LEED_KEYS.RQ ] == OPTS_HIDDEN ) { 
       
        theDiv.classList.add("buy2show");
        theDiv.innerHTML = "Buy to show";
    
    } else {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }








    // 
    // creator
    // from leed_preview
    // open the user_show.html with the creator passed as a URL param
    //
    theDiv = document.querySelector("#creator_value");    
    
    if (CURRENT_USER.un == CURRENT_LEED.cr) {

        // this leed is posted by the current user
        theDiv.innerHTML = "<a href='./user_edit.html'><b>" + CURRENT_LEED.cr + "</b></a>";

    } else {
    
        var theURL = "./user_show.html?" + USERNAME_URL_PARAM + "=" + CURRENT_LEED.cr;
        var theHTML = "<a href=" + theURL + "><b>" + CURRENT_LEED.cr + "</b></a>";
        theDiv.innerHTML = theHTML;
    }
    



    
    // *** PRICE ***
    // from leed_details
    //
    theDiv = document.querySelector("#pr_value");
    theDiv.innerHTML = "$" + CURRENT_LEED.pr;





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
    if (CURRENT_USER.un == leed_preview.cr) {

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



    // HIDE the welcome panel
    //

    let welcome = document.getElementById("welcome_panel");
    welcome.style.display = "none";


    // ACTION PANEL CLOSE BUTTON
    //
    var closeColumn = document.getElementById("lic_close");
    closeColumn.style.display = "flex";
    closeColumn.addEventListener( "click", (event) => { 
        hideActionWindow();
    }, true);

    
    // SHOW the action_panel
    //
    action.style.display = "block";
    var screen = action.getAttribute("screen");
    if (screen == 0) {
        action.className = "modal";
    }


    normalCursor();

}




/**
 * Change back to normal cursor
 */
function normalCursor() {
    document.body.style.cursor = 'default';
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



  