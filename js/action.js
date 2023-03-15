/* action.js */

import { getWeekday, getHours, getMinutes, getShortMonthname, getMonthname } from "./dates.js";


let LEED_DETAILS = {

    zip: 90034,
};

    
//
// FIXME FIXME FIXME
// local caching and changes on DB / race conditions
// cache by id?
//

/*
 * Show full leed details in the action window
 * set the Buy button
 
leed_fromDB 
    {   
      id: 99999,
      trade: "firebreather",
      start_date: Date().toISOString(),
      end_date: Date().toISOString(),
      note: "Corporate Event",
    }

*/
export function showLeedAction( trade_color, leed_fromDB ) {

    // GOTO DB to get full leed details
    // leed_fromDB.id
   
    // get full long weekday
   const leed_weekday = getWeekday( leed_fromDB.start.substring(0, 10) );    

    // use the long monthname for the modal action window
    // and short monthname for the column view
    var screen = getComputedStyle( document.documentElement ).getPropertyValue('--screen_size').trim();
    let leed_monthname = "";
    if (screen == "L") {
        leed_monthname = getShortMonthname( leed_fromDB.start.substring(5, 7) ); 
    } else {
        leed_monthname = getMonthname( leed_fromDB.start.substring(5, 7) ); 
    }

    // remove '0' at front if any
    let leed_date = leed_fromDB.start.substring(8, 10);
    if (leed_date.startsWith('0')) { leed_date = leed_date.substr(1) };

    const leed_year = leed_fromDB.start.substring(0, 4);
    
    let hours_start = getHours(leed_fromDB.start);
    let hours_end = getHours(leed_fromDB.end);

    const start_time = hours_start[0] + ":" + getMinutes(leed_fromDB.start) + hours_start[1];
    const end_time = hours_end[0] + ":" + getMinutes(leed_fromDB.end) + hours_end[1];


    

    // leed_title
    //
    const radioButton = document.querySelector("#lic_trade_radio");
    radioButton.style.backgroundColor = trade_color; 

    let theTrade = document.querySelector("#lic_trade");
    theTrade.innerHTML = leed_fromDB.trade;

    let theDate = document.querySelector("#lic_date");
    theDate.innerHTML = leed_weekday + " " + leed_monthname + " " + leed_date + ", " + leed_year; 


    // event_info
    //
    let theDiv = document.querySelector("#event_info_value");
    theDiv.innerHTML = leed_fromDB.note;

    // event_info
    //
    theDiv = document.querySelector("#start-end_value");
    theDiv.innerHTML = start_time + " - " + end_time;
     
    // zip code
    // from LEED_DETAILS
    theDiv = document.querySelector("#zip_code_value");
    theDiv.innerHTML = LEED_DETAILS.zip;



    // SHOW the action_panel


    let action = document.getElementById("action_panel");
    action.style.setProperty("display", "block");
}
