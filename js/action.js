/* action.js */

import { getWeekday } from "./calendar.js";
import { getShortMonthname } from "./months.js";


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
      start_date: new Date("2023-03-11T15:30:00"),
      end_date: new Date("2023-03-11T18:30:00"),
      note: "Corporate Event",
    }

*/
export function showLeedAction( trade_color, leed_fromDB ) {

    // GOTO DB to get full leed details
    // leed_fromDB.id
    
    const leed_weekday = getWeekday( leed_fromDB.start_date.getDay() );
    const leed_monthname = getShortMonthname( leed_fromDB.start_date.getMonth() );
    const leed_date = leed_fromDB.start_date.getDate();
    const leed_year = leed_fromDB.start_date.getFullYear();
    const start_time = leed_fromDB.start_date.getHours() + ":" + leed_fromDB.start_date.getMinutes();
    const end_time = leed_fromDB.end_date.getHours() + ":" + leed_fromDB.end_date.getMinutes();
    

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

}
