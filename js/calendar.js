/*
 *
 *
 */

import { daysInMonth, getShortDateString, getShortWeekday, getMonth, getYear, getHours, getMinutes, twoDigitInt, firstDayShowing, lastDayShowing } from "./dates.js";
import { showLeedAction } from "./action.js";
import { setCurrentLeed, loadLeedzFromDB, loadLeedzFromCache, clearCurrentLeed } from "./leed.js";
import { getColorForTrade } from "./trades.js";
import { getCurrentUser } from "./user.js";
import { printError, errorModal, throwError } from "./error.js";




let CURRENT_SELECTION = null;

const CACHE_DELIM = '|';
 




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


    const theDays = document.getElementsByClassName("each_day");
    // get all the days of the current month showing
    for (var i = 0; i < theDays.length; i++) {

        // for each day
        var each_day = theDays[i];
        
        // iterate over all children looking leedz with matching trade_name
        // skip the first and last child
        for ( var c = 1; c < each_day.children.length; c++) {
           
            var theChild = each_day.children[c];
            var test_trade = theChild.getAttribute("tn");
                
            // console.log("TESTING " + test_trade + " against " + trade_name);
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
 * if an argument is provided -- filter by that trade_name
 */
export function loadCacheLeedz( trade_name ) {

    CURRENT_SELECTION = null;

    // console.log("LOADING FRON CACHE!");

    let results = [];
    try {
        const leedz = loadLeedzFromCache(getMonth(), getYear());

        // being called with no arg -- load all leedz from cache
        if (trade_name === undefined) {
            results = leedz;

        } else {
            // called with arg
            // filter out any results not matching tn == trade_name
            var tn = null;
            for (let i = 0; i < leedz.length; i++) {
                tn = leedz[i].pk.substring(5);
                if (tn == trade_name) {
                    results.push(leedz[i]);
                }
            }
        }


        
    } catch (error) {
        printError("Loading leedz from DB", error);
        errorModal(error.message, false);
        return;
    }
    
    // console.log("UPDATING CALENDAR FROM CACHE");
    // console.log(results);

    // update calendar
    addLeedzToCalendar( results );
}






/**
 *  GOTO DB for new leedz
 *  will populate the calendar and save new leedz to cache
 * 
 */
export function loadDBLeedz() {

    CURRENT_SELECTION = null;

    const current_user = getCurrentUser(false);  
    if (current_user.un == null)
        throwError("LoadDBLeedz", "Current user is not initialized");


    waitCursor();


    // ASYNC CALL
    //
    // API request --> DB 
    // load leedz for this trade and date range showing
    // returns immediately -- provide callback for DB results when they come in
    try {

        loadLeedzFromDB(current_user.sb, firstDayShowing(), lastDayShowing(), current_user.zp, current_user.zr, refreshCalendar );
            
    } catch (error) {
        printError("Loading leedz from DB", error);
        errorModal(error.message, false);
        return;
    }
}







/**
 * ASYNC CALLBACK FOR loadLeedzFromDB()
 * 
 *
 * CLEAR the current calendar of all LEEDZ
 * add new leedz from DB
 */
function refreshCalendar( results ) {

    normalCursor();

    try {

        // START with empty calendar
        // clear calendar of all leedz
        removeLeedzShowing();

        // add new leedz fresh
        if (results.length != 0) 
            addLeedzToCalendar( results );


    } catch (error) {

        printError("Refreshing Calendar", error);
        errorModal(error.message, false);
        return;
    }
}



        


        /**
        * Change to a wait cursor
        */
        function waitCursor() {
            document.body.style.cursor = 'wait';
        }
        window.waitCursor = waitCursor;

        /**
        * Change back to normal cursor
        */
        function normalCursor() {
            document.body.style.cursor = 'default';
        }
        window.normalCursor = normalCursor;





/**
 *  IGNORE leedz that do not match current calendar day
 *  they should not be sent from DB
 * 
 *
 */
function addLeedzToCalendar( results ) {

    // console.log("ADD LEEDZ RESULTS=" + results);

    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");
  
    // FOR EACH LEED COMING IN FRON THE DB (Date sorted)....
    for (const the_Leed of results) {

        // remove DDB-specific tag
        // leed#caricatures --> caricatures        
        const trade_name = the_Leed.pk.substr(5);        

        // what color are all leedz of this trade?
        const trade_color = getColorForTrade( trade_name );

        // when does leed appear on calendar?
        const startDate = new Date( parseInt( the_Leed.st ) );
        
        // starting at 1 (skipping template index:0 )
        // iterate through the calendar and find the corresponding date
        let shortDate_fromLeed = getShortDateString( startDate.toISOString() );

       //  console.log("%c---FROM DB=" + trade_name +  "--" + startDate.toString() +  "---" + shortDate_fromLeed, "color:" + trade_color + ";" );
        


        // FOR EACH DATE IN THE CALENDAR....
        var day_counter = 1;
        while (day_counter <= theList.children.length) {

            // compare the date for this row in the calendar to the date of the leed
            // theDate is a String
            let each_day = theList.children[ day_counter ];

            if (! each_day) {
                // will happen on day 31 of alt months
                day_counter++;
                continue;
            }

            let theDate = each_day.getAttribute("LEEDZ_DATE");
    

            if (theDate == null) {
            // this should NEVER be null
                printError("addLeedzToCal", "LEEDZ_DATE attribute not being set for each day");
                printError("addLeedzToCal", "Unable to load " + the_Leed.pk);
                return;  
            }

            // MATCHING DATE
            // calendar date row == short date in leed_fromDB
            if ( shortDate_fromLeed == theDate ) {

                // CREATE CALENDAR LEED
                //
                createCalendarLeed( each_day, trade_color, the_Leed);
                break; 
     
            } else {
                day_counter++; // GOTO the next day
            }
        }

    }
}



/** 
 *
    {
        "pk": "leed#airbrush",
        "sk": 12345678, 
        "cr": "scott.gross", 
        "zp": "90056", 
        "st": 1680469860000, 
        "et": 1680477060000, 
        "ti": "staff appreciation party"
    }
]
 */


function createCalendarLeed( eachDay, trade_color, leed_fromDB ) {


    // create the DOM node
    const newLeed = document.createElement("button");
    newLeed.className = "trade_radio";
    newLeed.style.backgroundColor = trade_color;

    // copy info from JSON into DOM node
    // each leed knows what trade it comes 
    // pk = trade#caricatures
    const trade_name = leed_fromDB.pk.substr(5);
    newLeed.setAttribute("tn", trade_name);
    newLeed.setAttribute("id", leed_fromDB.sk); // unique ID

    leed_fromDB.tn = trade_name;
    leed_fromDB.id = leed_fromDB.sk;




    // IS THIS OUR LEED?
    // is this leed created by the current user?
    //
    if (leed_fromDB.cr == getCurrentUser(false).un) {
        newLeed.classList.add("user_leed");
    } else {
        newLeed.classList.add("forsale_leed");
    }



    // LEED DATE
    // returns array [ hours(12) , AM/PM ]  
    // END DATE WILL BE RETURNED
    const startDate = new Date( parseInt(leed_fromDB.st) );;
    const isoStart = startDate.toISOString();
    const hours_start = getHours( isoStart ); 
    const startTime = hours_start[0] + ":" + getMinutes( isoStart ) + hours_start[1];

    
    const endDate = new Date( parseInt(leed_fromDB.et) );
    const isoEnd = endDate.toISOString();
    const hours_end = getHours( isoEnd );
    const endTime = hours_end[0] + ":" + getMinutes( isoEnd ) + hours_end[1];

    
    // console.log("%cCREATING CALENDAR LEED " + trade_name + " START=" + isoStart, "color: " + trade_color + ";");

  
    /////////////////////////////////////////////////////////////////////////////////
    // THUMBNAILS
    // hover over leed --> get preview thumbnail
    
    let thumbnail = document.querySelector(".leed_thumbnail");
    newLeed.addEventListener("mouseenter", function( event ) {


        // THUMBNAIL contains leed info preview
        //
        let thumb_html = leed_fromDB.ti + "<BR>" + startTime + "--" + endTime;
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
        
        waitCursor();
        
        // turn OFF old leed
        //
        clearCurrentLeed();
        thumbnail.style.opacity = 0;
        if ( CURRENT_SELECTION != null) {
            CURRENT_SELECTION.style.border = 0;
        } 

        // turn ON new leed
        //
        newLeed.style.border = "3px solid black";
        CURRENT_SELECTION = newLeed;
        setCurrentLeed( leed_fromDB );
        
        // GOTO ACTION WINDOW WITH DETAILS INFO
        try {
            showLeedAction( leed_fromDB, true );

        } catch (error) {
            printError("showLeedAction", error);
            errorModal("Error showing Action Window: " + error.message, true);
        }
        
    });




    eachDay.appendChild( newLeed );
    // console.log("CREATING CALENDAR LEED=" + trade_name + "==" + leed_fromDB.st);
}



