/* action.js */

import { getWeekday, getHours, getMinutes, getShortMonthname, getMonthname, getShortDateString, getShortDate } from "./dates.js";
import { getColorForTrade } from "./trades.js";
import { db_getDeetz, USERNAME_URL_PARAM } from "./dbTools.js";
import { errorModal, printError, throwError } from "./error.js";
import { getCurrentUser } from "./user.js";
import { LEED_KEYS, OPTS_HIDDEN, SHOW_ALL_OPTS, setCurrentLeed, getCurrentLeed } from "./leed.js";
import { normalCursor } from "./leed_edit.js";

const NO_VAL = "<i style='font-weight:600;color:coral'>None Provided</i>";
const BUY_TO_SHOW = "Buy to show";






    
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

    // console.log("Showing Leed: " + leed_preview.id + " goto: " + gotoDB);

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

        await db_getDeetz( CURRENT_USER.un, leed_preview.tn, leed_preview.id, view_options )
            .then(data => {

            if ( ! data ) throw new Error("null response from GET");
            leed_details = data;
            
            // query returns empty result set
            if ( ! leed_details ) throw new Error("No leed details for id: " + leed_preview.id);
            
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
    console.log(CURRENT_LEED);
    





    //
    // START DATE
    // REQUIRED MUST BE SHOWING AT TOP OF ACTION WINDOW HEADER
    // 
    //
    let startDate = new Date( parseInt(CURRENT_LEED.st) );
    let isoStart = startDate.toISOString();
    const leed_weekday = getWeekday( getShortDateString( isoStart ) );



    // SET THE WINDOW SIZE
    // will show everything at the very end
    let action = document.getElementById("action_panel");


    // use the long monthname for the modal action window
    // and short monthname for the column view
    // var screen = getComputedStyle( document.documentElement ).getPropertyValue('--screen_size').trim();
    const screen = action.getAttribute("screen");
    // console.log("SCREEN=" + screen);

    var leed_monthname = "";
    var month_index = parseInt( isoStart.substring(5, 7) );
    if (screen == "2") { // large
        leed_monthname = getShortMonthname( month_index ); 
    } else {
        leed_monthname = getMonthname( month_index ); 
    }



    
    // remove '0' at front if any
    let leed_date = isoStart.substring(8, 10);
    if (leed_date.startsWith('0')) { leed_date = leed_date.substring(1) };

    var leed_year = isoStart.substring(0, 4);
    var theDate = document.querySelector("#lic_date");
    theDate.innerHTML = leed_weekday + " " + leed_monthname + " " + leed_date + ", " + leed_year; 

    
    var theDiv = null;


    // START -- END DATE
    // END TIME REQUIRED
    // CANNOT BE HIDDEN
    //
    var hours_start = getHours(isoStart);
    var start_time = hours_start[0] + ":" + getMinutes(isoStart) + hours_start[1];

    var endDate = new Date( parseInt(CURRENT_LEED.et) );
    var isoEnd = endDate.toISOString();
    var hours_end = getHours(isoEnd);
    var end_time = hours_end[0] + ":" + getMinutes(isoEnd) + hours_end[1];

    
    theDiv = document.querySelector("#start-end_value");
    theDiv.innerHTML = start_time + " - " + end_time;
        


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






    // TITLE
    //
    theDiv = document.querySelector("#title_value");
    theDiv.innerHTML = CURRENT_LEED.ti;




    // ZIP
    //
    theDiv = document.querySelector("#zip_value");
    theDiv.innerHTML = CURRENT_LEED.zp;
    

    // approach to showing/hiding
    // if it is supposed to be hidden, hide it
    // if it is supposed to show...
    //    -- if there is a value, show it
    //    -- else no_value, show NO_VAL
    //

    // LOCATION
    // lc == full address
    // REQUIRED BUT MAY BE HIDDEN
    //
    theDiv = document.querySelector("#loc_value");
    if (CURRENT_LEED.op[ LEED_KEYS.LC ] == OPTS_HIDDEN ) {

        theDiv.classList.add("buy2show");
        theDiv.innerHTML = BUY_TO_SHOW;

    } else if (gotRetValue(CURRENT_LEED.lc)) {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.lc;

    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }

   


    


     

    // EMAIL
    // (OPTIONAL)
    //
    theDiv = document.querySelector("#em_value");
    if (CURRENT_LEED.op[ LEED_KEYS.EM ] == OPTS_HIDDEN ) {

        theDiv.classList.add("buy2show");
        theDiv.innerHTML = BUY_TO_SHOW;

    } else if (gotRetValue(CURRENT_LEED.em)) {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.em;

    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }

   





    // PHONE
    // (OPTIONAL)
    //
    theDiv = document.querySelector("#ph_value");
    if (CURRENT_LEED.op[ LEED_KEYS.PH ] == OPTS_HIDDEN ) {

        theDiv.classList.add("buy2show");
        theDiv.innerHTML = BUY_TO_SHOW;

    } else if (gotRetValue(CURRENT_LEED.ph)) {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.ph;

    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }

   







    // DETAILS
    // from leed_details
    // (OPTIONAL)
    //
    theDiv = document.querySelector("#det_value");
    if (CURRENT_LEED.op[ LEED_KEYS.DT ] == OPTS_HIDDEN ) {

        theDiv.classList.add("buy2show");
        theDiv.innerHTML = BUY_TO_SHOW;

    } else if (gotRetValue(CURRENT_LEED.dt)) {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.dt;

    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }

   






    // REQUIREMENTS
    // from leed_details
    // (OPTIONAL)
    // 
    theDiv = document.querySelector("#reqs_value");
    if (CURRENT_LEED.op[ LEED_KEYS.RQ ] == OPTS_HIDDEN ) {

        theDiv.classList.add("buy2show");
        theDiv.innerHTML = BUY_TO_SHOW;

    } else if (gotRetValue(CURRENT_LEED.rq)) {
        
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = CURRENT_LEED.rq;

    } else {
        theDiv.classList.remove("buy2show");
        theDiv.innerHTML = NO_VAL;
    }

   





    // 
    // CREATOR
    // REQUIRED
    // 
    // from leed_preview
    // open the user_show.html with the creator passed as a URL param
    //
    theDiv = document.querySelector("#creator_value");    
    
    if (CURRENT_USER.un == CURRENT_LEED.cr) {

        // this leed is posted by the current user
        theDiv.innerHTML = "<a href='./user_editor.html'><b>" + CURRENT_LEED.cr + "</b></a>";

    } else {
    
        var theURL = "./user_show.html?" + USERNAME_URL_PARAM + "=" + CURRENT_LEED.cr;
        var theHTML = "<a href=" + theURL + "><b>" + CURRENT_LEED.cr + "</b></a>";
        theDiv.innerHTML = theHTML;
    }
    



    //  DATE POSTED
    //  3/2024
    //  indicate how 'hot' the leed is -- by how new it is
    //  so the user knows if it's been on the board a long time or not
    //  
    if ( CURRENT_LEED.dp ) {
        theDiv = document.querySelector("#dp_value");       
        showDatePosted( theDiv, CURRENT_LEED.dp );
    }


    
    
    // PRICE 
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

        // EDIT / DEL
        // the current user POSTED this leed
        // show the EDIT/DEL buttons
        row_buy_button.style.display = "none";
        row_report_button.style.display = "none";
        row_edit_button.style.display = "flex";
        row_del_button.style.display = "flex";


    } else {

        // BUY BUTTON
        // current user is trying to BUY someone else's leed
        //
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

    // var action_height = Math.floor( window.innerHeight * 0.7 );
    action.style.height = "100%";

    // SHOW the action_panel
    //
    // console.error("SCREEN STILLL===" + screen);
    if (screen == 2) {
        action.classList.remove("modal");
        action.classList.add("column");
        action.classList.add("_35");
    
    } else {
        action.className = "modal";
    }
    action.style.display = "block";

    normalCursor();

}




/**
 * RETURN TRUE IF VALUE VALID
 * Failure-resistant way to handle different NO-VALUE values returned from DDB
 */
function gotRetValue( theVal ) {

    // null or 0?
    if (! theVal) return false;

    // there IS a value but it may be '0' or "" string
    if (theVal == '0' || theVal == "") return false;

    return true;
}









/**
 * 
 */
export function hideActionWindow() {

    // HIDE the action_panel
    //
    let action = document.getElementById("action_panel");
    action.style.display = "none";

    var screen = action.getAttribute("screen");
    if (screen == 2) {
        // SHOW the welcome panel if it exists
        let welcome = document.getElementById("welcome_panel");
        welcome.style.display = "block";
    }

}




/**
 * 
 * @param {*} theDiv in hustle.html lic_row id='dp' 
 * @param {*} long_date the milliseconds long dp field from the leed
 */


function showDatePosted( theDiv, long_date ) {

    // date posted
    var str_d = new Date( long_date ).toString();
    var short_d = str_d.substring(0, str_d.indexOf(' ', 14));
    theDiv.innerHTML = "<B>" + short_d.toString() + "</B>";

    // Get the current date in milliseconds since the epoch
    var currentDate = new Date().getTime();

    // Calculate the difference in milliseconds
    var diff = currentDate - long_date;

    // Convert the difference to hours, days and months
    var hours = diff / (1000 * 60 * 60);
    var days = diff / (1000 * 60 * 60 * 24);

    if (long_date == 0) {
        // ERROR CONDITION
        theDiv.style.color = "darkred";

    } else {
        switch (true) {
            case (hours <= 48):
                // The date is 48 hours or less than the current date/time
                theDiv.style.color = "var(--LEEDZ_GREEN)";
                break;
            case (days <= 7):
                // The date is 1 week or less than the current date/time
                theDiv.style.color = "darkgreen";
                break;
            case (days > 7 && days <= 30):
                // The date is between a week and a month from the current date/time
                theDiv.style.color = "midnightblue";
                break;
            default:
                // The date is older than one month from the current date/time
                theDiv.style.color = "dodgerblue";
        }
    }
}

  