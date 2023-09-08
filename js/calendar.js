/*
 *
 *
 */

import { daysInMonth, getShortDateString, getShortWeekday, getMonth,
    firstDayShowing, lastDayShowing, getYear, getHours, getMinutes, twoDigitInt } from "./dates.js";
import { showLeedAction } from "./action.js";
import { setCurrentLeed, loadLeedzFromDB, loadLeedzFromCache, saveLeedzToCache } from "./leed.js";
import { getColorForTrade } from "./trades.js";
import { getSubscriptions, getCurrentUser } from "./user.js";
import { printError, throwError, errorModal } from "./error.js";




let CURRENT_SELECTION = null;


 




/*
 * JUST build the calendar UI 
 *
 * do not go back to DB for leedz
 */
export function buildCalendar() {

    CURRENT_SELECTION = null;

    // load the current date showing
    let theYear = getYear();
    let theMonth = getMonth();
    let days_in_month = daysInMonth(theMonth, theYear);

   
    // import DOM elements from html
    const theList = document.querySelector("#calendar_list");
    const theTemplate = document.querySelector("#template_each_day");

    // remove all existing each_day children
    // then put back the template
    theList.replaceChildren( theTemplate );

    // for each day in the month create an each_day
    // add it to the calendar UL
    for (var i = 1; i <= days_in_month; i++) {

        // clone a new node
        let theClone = theTemplate.content.cloneNode(true);
        let eachDay = theClone.querySelector(".each_day")

        
        // each day in the DOM knows its date
        // Date() uses 0 indexing for month so -1
        // ISODate format -> 2012-07-14T00:00:00Z
        // 
        let dateString = theYear + "-" + twoDigitInt(theMonth) + "-" + twoDigitInt(i);
        eachDay.setAttribute("LEEDZ_DATE", dateString);
 

        // inside the dateSquare
        // set the date number
        let dateSquare = theClone.querySelector(".dateSquare");
        dateSquare.textContent = i;
        
        // add the day of the week
        //
        let daySpan = document.createElement("span");
        // this will be a local timezone day of week
        daySpan.textContent = getShortWeekday( dateString );
        dateSquare.appendChild( daySpan ); 

        // add the li to the growing vertical ul
        theList.appendChild( eachDay );

    }

}








/**
 * 
 *
 */
export function removeLeedzShowing() {

    const theDays = document.getElementsByClassName("each_day");
    
    for (var d = 0; d < theDays.length; d++) {
        var each_day = theDays.item(d);

        // remove all children after the first one (date box)
        for (var i = each_day.children.length - 1; i > 0; i--) {
            each_day.children[i].remove();
        }

        // on to the next day
    }   
}




/*
 * 
 */
export function removeLeedzForTrade( trade_name ) {


    const theDays = document.getElementsByClassName(".each_day");
    // get all the days of the current month showing
    for (var i = 0; i < theDays.length; i++) {

        // for each day
        var each_day = theDays[i];
        
        // iterate over all children looking leedz with matching trade_name
        // skip the first and last child
        const lastChild = each_day.children.length - 1;
        for ( var c = 1; c < lastChild; c++) {
           
            var theChild = each_day.children[c];
            var test_trade = theChild.getAttribute("tn");
                
            if (test_trade == trade_name) {
                // remove leed from calendar
                each_day.removeChild( theChild );
            }
            
        }

    }
 }




/**
 * Load leedz from cache (month showing) and return immediately
 * 
 */
export function loadCacheLeedz() {

    CURRENT_SELECTION = null;

    let results = null;
    try {
            results = loadLeedzFromCache(getMonth(), getYear());
        
    } catch (error) {
        printError("Loading leedz from DB", error);
        errorModal(error.message, false);
        return;
    }
    
    // update calendar
    addLeedzToCalendar( results );
}






/**
 *  GOTO DB for new leedz
 *  will populate the calendar and save new leedz to cache
 * 
 */
export function loadDBLeedz() {


    console.log("****************   in loadDBLeedz()   ************");
    console.log(getCurrentUser());


    CURRENT_SELECTION = null;

    // API request --> DB 
    // load leedz for this trade and date range showing
    // returns immediately -- provide callback for DB results when they come in
    try {

            loadLeedzFromDB(getSubscriptions(), firstDayShowing(), lastDayShowing(), refreshCalendar );
            
    } catch (error) {
        printError("Loading leedz from DB", error);
        errorModal(error.message, false);
        return;
    }
}







/**
 * CLEAR the current calendar of all LEEDZ
 * add new leedz from DB
 */
function refreshCalendar( results ) {

    try {

        // START with empty calendar
        // clear calendar of all leedz
        removeLeedzShowing();

        // add new leedz fresh
        addLeedzToCalendar( results );

    } catch (error) {

        printError("Refreshing Calendar", error);
        errorModal(error.message, false);
        return;
    }
}










/**
 *  IGNORE leedz that do not match current calendar day
 *  they should not be sent from DB
 * 
 * Current system DEPENDS on ALL leeds being sorted by DATE, not grouped by TRADE
 */
function addLeedzToCalendar( results ) {

    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");

    // use a global day_counter so that the same day can be used for multiple DB leedz 
    // with same start date, without having to start a for-loop again at day 1 for each leed
    var day_counter = 1;

    // FOR EACH LEED COMING IN FRON THE DB (Date sorted)....
    for (const the_Leed of results) {

        // what color are all leedz of this trade?
        let trade_color = getColorForTrade( the_Leed.trade );

        // when does leed appear on calendar?
        const startDate = new Date( the_Leed.start );
        
        
        // console.log("%c---FROM DB=" + leed_fromDB.trade + "--" + startDate.toString() +  "---" + startDate.toISOString(), "color:" + trade_color + ";" );

        // starting at 1 (skipping template index:0 )
        // iterate through the calendar and find the corresponding date
        let shortDate_fromLeed = getShortDateString( startDate.toISOString() );
        
        // FOR EACH DATE IN THE CALENDAR....
        while (day_counter < theList.children.length) {

            // compare the date for this row in the calendar to the date of the leed
            // theDate is a String
            let each_day = theList.children[ day_counter ];
            let theDate = each_day.getAttribute("LEEDZ_DATE");

            if (theDate == null) {
            // this should NEVER be null
                printError("loadCalLeedz", "LEEDZ_DATE attribute not being set for each day");
                printError("loadCalLeedz", "Unable to load leedz for " + the_Leed.trade);
                return;  
            }

            // MATCHING DATE
            // calendar date row == short date in leed_fromDB
            if ( shortDate_fromLeed == theDate ) {

                // CREATE CALENDAR LEED
                //
                createCalendarLeed( each_day, trade_color, the_Leed);
              
                break; // leed will only have one start date -- one calendar day  
                // DO NOT increment day_counter because next leed from DB may have same start_date
                // leedz are Date-sorted
                
            } else {
                day_counter++; // GOTO the next day
            }
        }

        // start day_counter back at 1
        if (day_counter >= theList.children.length) day_counter = 1;
    }
}


/**
 *  
 * 
 *
function old_addLeedzToCalendar( results ) {

        // the UI contains all the each_date days
        const theList = document.querySelector("#calendar_list");

        // for each (date sorted) leed coming in from the DB
        for (const the_Leed of results) {
            
            // what color are all leedz of this trade?
            let trade_color = getColorForTrade( the_Leed.trade );
    
            // when does leed appear on calendar?
            const startDate = new Date( the_Leed.start );
            
            
            // console.log("%c---FROM DB=" + leed_fromDB.trade + "--" + startDate.toString() +  "---" + startDate.toISOString(), "color:" + trade_color + ";" );
    
            // starting at 1 (skipping template index:0 )
            // iterate through the calendar and find the corresponding date
            let shortDate_fromLeed = getShortDateString( startDate.toISOString() );
            
            for (var counter = 1; counter < theList.children.length; counter++) {
             
                let each_day = theList.children[ counter ];
    
                // compare the date for this row in the calendar to the date of the leed
                // theDate is a String
                let theDate = each_day.getAttribute("LEEDZ_DATE");
                // this should NEVER be null
                if (theDate == null) {
    
                    printError("loadCalLeedz", "LEEDZ_DATE attribute not being set for each day");
                    printError("loadCalLeedz", "Unable to load leedz for " + the_Leed.trade);
                    return;  
                }
    
                // if date row in calendar corresponds to date in leed_fromDB
                // both should be Date.toISOString() 
                if ( shortDate_fromLeed == theDate ) {
    
                    // these are fresh leedz from DB with possibly altered leed details
                    // overwrite any matching leed
                    removeMatchingLeed( each_day, the_Leed.id );
    
                    // CREATE CALENDAR LEED
                    //
                    createCalendarLeed( each_day, trade_color, the_Leed);
                    
                    break; // leed will only have one corresponding calendar day    
                } 
            }
    
    
        }

}
*/
 
/**
 * 
 *
 *
function removeMatchingLeed( each_day, leed_id ) {

    // start with 1 to skip the date square
    for (var i = 1; i < each_day.children.length; i++ ) {
        var testLeed = each_day.children[i];
        var id = testLeed.getAttribute("id");
        if (id == leed_id) {
            // console.log("REMOVING MATCHING LEED=" + testLeed.getAttribute("tn"));
            each_day.removeChild( testLeed );
            break;
        }
    }
    
}
*/



/** 
 *
    {
        "id": 1004, 
        "creator": "scott.gross", 
        "zip": "90056", 
        "start": 1680469860000, 
        "end": 1680477060000, 
        "trade": "airbrush",
        "note": "staff appreciation party"
    }
]
 */


function createCalendarLeed( eachDay, trade_color, leed_fromDB ) {


    console.log("%cCREATING CALENDAR LEED " + leed_fromDB.trade, "color: " + trade_color + ";");

    // create the DOM node
    const newLeed = document.createElement("button");
    newLeed.className = "trade_radio";
    newLeed.style.backgroundColor = trade_color;

    // copy info from JSON into DOM node
    // each leed knows what trade it comes 
    newLeed.setAttribute("tn", leed_fromDB.trade);
    newLeed.setAttribute("id", leed_fromDB.id); // unique ID


    // is this leed created by the current user?
    if (leed_fromDB.creator == getCurrentUser().username) {
        newLeed.classList.add("user_leed");
    } else {
        newLeed.classList.add("forsale_leed");
    }



    // LEED DATE
    // returns array [ hours(12) , AM/PM ]  
    const startDate = new Date( leed_fromDB.start );
    const endDate = new Date( leed_fromDB.end );
    let isoStart = startDate.toISOString();
    let isoEnd = endDate.toISOString();

    let hours_start = getHours( isoStart ); 
    let hours_end = getHours( isoEnd );

    const startTime = hours_start[0] + ":" + getMinutes( isoStart ) + hours_start[1];
    const endTime = hours_end[0] + ":" + getMinutes( isoEnd ) + hours_end[1];



  
    /////////////////////////////////////////////////////////////////////////////////
    // THUMBNAILS
    // hover over leed --> get preview thumbnail
    
    let thumbnail = document.querySelector(".leed_thumbnail");
    newLeed.addEventListener("mouseenter", function( event ) {


        // THUMBNAIL contains leed info preview
        let thumb_html = leed_fromDB.note + "<BR>" + startTime + "--" + endTime;
        thumbnail.innerHTML =thumb_html;     

        // PLACE the thumbnail
        thumbnail.style.left = (event.clientX + 10) + "px"
        thumbnail.style.top = (event.clientY - 70) + "px";
        thumbnail.style.border = "4px solid " + trade_color;
        thumbnail.style.opacity = 1;

    });

    // mouse out --> HIDE thumbnail
    //
    newLeed.addEventListener("mouseout", function( event ) {
    
        thumbnail.style.opacity = 0;
    });
  
    
    
    ////////////////////////////////////////////////////////////////////////////////////
    // CLICK LEED --> 
    //
    // open ACTION WINDOW
    //
    newLeed.addEventListener("click", function( event ) {
    
        // turn off the thumbnail
        thumbnail.style.opacity = 0;

        // turn off the old leed
        if ( CURRENT_SELECTION != null) {
            CURRENT_SELECTION.style.border = 0;
        } 
        // turn on new leed
        newLeed.style.border = "3px solid black";
        CURRENT_SELECTION = newLeed;
        setCurrentLeed( leed_fromDB );
        

        try {
            showLeedAction( leed_fromDB );

        } catch (error) {
            printError("showLeedAction", error);
            errorModal("Error showing Action Window: " + error.message, true);
        }
            

    });

    eachDay.appendChild( newLeed );
    // console.log("CREATING CALENDAR LEED=" + leed_fromDB.trade + "==" + leed_fromDB.start);
}






