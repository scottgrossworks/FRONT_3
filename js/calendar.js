/*
 *
 *
 */

import { daysInMonth, getShortDateString, getShortWeekday, getMonth,
    firstDayShowing, lastDayShowing, getYear, getHours, getMinutes, twoDigitInt } from "./dates.js";
import { showLeedAction } from "./action.js";
import { getColorForTrade } from "./trades.js";
import { getSubscriptions, isSubscribed } from "./user.js";
import { printError, throwError } from "./error.js";
import { db_getLeedz } from "./dbTools.js";


const CACHE_DELIM = "|";
let CURRENT_LEED = null;
 



/**
 * 
 */
export function isLeedActive() {
    return (CURRENT_LEED != null);
}



/*
 * Build the calendar UI 
 * loads leedz from cache
 * session storage is the leed cache
 *      key    : date   
 *      value  : delimited string of JSON-stringified leed objects
 */
export function loadCalendar() {



    console.error("**** LOAD CALENDAR *****");


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

 
        // FIXME FIXME FIXME
        // CACHE ??
        // are there leedz in the cache for this date?
        // loadLeedzFromCache( eachDay );
    }

}






/*
 * clear the current calendar of leedz
 * call loadUserLeedz() to repopulate it
 *
 */
export function reloadCalendar() {

    removeLeedzShowing();
    loadUserLeedz();
}






/**
 * 
 *
 */
function loadLeedzFromCache( theDay ) {

    // GET CACHE 
    let dateString = theDay.getAttribute("LEEDZ_DATE");
    
    // lists of JSON leedz are cached to dateStrings
    let JSON_leedz = window.sessionStorage.getItem(dateString);
    if (JSON_leedz == null || JSON_leedz == "" || JSON_leedz == CACHE_DELIM) return;


    // LOAD LEEDZ
    // load the cache leedz for this dateString
    const theLeedz = JSON_leedz.split( CACHE_DELIM );
    
    // for each JSON leed loaded from CACHE
    for (var i = 0; i < theLeedz.length; i++) {
  
        var theJSON = theLeedz[i];
        if ((theJSON == null) || (theJSON == "") || (theJSON == CACHE_DELIM)) continue; // just be safe

        // (re)create leed node using cache data
        var theLeed = JSON.parse( theJSON );
   
        // is the user stil subscribed to leedz of this trade?
        if ( isSubscribed( theLeed.trade ) ) {
            
            // FUTURE FUTURE FUTURE
            // did the user post this leed?
           
            // get the color and create a leed
            var trade_color = getColorForTrade( theLeed.trade );
            createCalendarLeed( theDay, trade_color, theLeed);
        
        } else {
            // user has unsubscribed since last cache save
            // remove leed from cache and DO NOT add to calendar
            theLeedz[i] = null;
        }
    }

    // RESET CACHE

    JSON_leedz = ""; // start wtih fresh JSON
    // only save back to cache leedz that have not been nulled out (unsubscribed)
    theLeedz.forEach( (leed) => {
        if (leed != null) JSON_leedz = JSON_leedz + JSON.stringify(leed) + CACHE_DELIM;
    });

    // put JSON back where it came from
    window.sessionStorage.setItem(dateString, JSON_leedz);
    
}



/**
 *
 * 
 */
export async function loadUserLeedz() {

    console.log("IN LOAD USER LEEDZ !!!!");

    let subs = getSubscriptions();
    if (subs.length == 0) {
        printError("loadUserLeedz()", "No trades subscribed");
        return;
    }


    // API request --> DB 
    // load leedz for this trade and date range showing
    //
    let results = null;
    try {
        // 
        //  client <---> API Gateway <===> DB
        //
        // get the leedz for all trade names in subs and the dates showing
        results = await db_getLeedz( subs, firstDayShowing(), lastDayShowing() );

    } catch (error) {
        printError( "getLeedz()", error.message );
        printError( "response JSON", responseJSON);
        
        // EXIT FUNCTION HERE
        throwError( "loadUserLeedz()", error); 
    }

    // query returns empty result set
    if (results.length == 0) {
        printError("loadUserLeedz()", "No leedz returned");
        return;
    }

    
    
    
    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");

    // for each (date sorted) leed coming in from the DB
    for (const leed_fromDB of results) {
        
        // what color are all leedz of this trade?
        let trade_color = getColorForTrade( leed_fromDB.trade );

        // when does leed appear on calendar?
        const startDate = new Date( leed_fromDB.start );
        
        



        // FOOBAR FOOBAR FOOBAR
        //
        //
        console.log("%c---FROM DB=" + leed_fromDB.trade + "--" + startDate.toString() +  "---" + startDate.toISOString(), "color:" + trade_color + ";" );



        
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

                printError("loadUserLeedz()", "LEEDZ_DATE attribute not being set for each day");
                printError("loadUserLeedz()", "Unable to load leedz for " + leed_fromDB.trade);
                return;  
            }

            // if date row in calendar corresponds to date in leed_fromDB
            // both should be Date.toISOString() 
            if ( shortDate_fromLeed == theDate ) {

                // these are fresh leedz from DB with possibly altered leed details
                // overwrite any matching leed
                removeMatchingLeed( each_day, leed_fromDB.id );

                // CREATE CALENDAR LEED
                //
                createCalendarLeed( each_day, trade_color, leed_fromDB);
                
                break; // leed will only have one corresponding calendar day    
            } 
        }


        // before we move on to next leed
        // CACHE this one in sessionStorage -- might be future date not displayed
        // console.log("CACHING LEED FOR=" + getShortDateString(leed_fromDB.start));
        cacheLeed( leed_fromDB, shortDate_fromLeed );
    }
}



/**
 * 
 * look leedz already mapped to this date in session storage
 * if cache exists, check if it already contains leed_fromDB
 * if not, add it to the cache
 */
function cacheLeed( leed_fromDB, theDate ) {


    let leedJSON = JSON.stringify( leed_fromDB );

    // is there already a cache for this date?
    // leedz_cache --> delimited list of JSON-stringified leed objects
    let leedz_cache = window.sessionStorage.getItem( theDate );

    if (leedz_cache == null) {
        // no cache found for this date
        leedz_cache = "";  // null becomes the string 'null' -- causes problems below
    
    } else {
        // cache IS found -- look for leed
        var leedFound = leedz_cache.indexOf( leedJSON );
        if (leedFound != -1) {
            // leed already in cache for this date
            return;
        }
    }

    // cache exists and leed is not in it
    // append the new leed to the end of the cache and add DELIM
    // { leed JSON }|{ leed JSON }|{ leed JSON }|....
    leedz_cache = leedz_cache + leedJSON + CACHE_DELIM;

    window.sessionStorage.setItem(theDate, leedz_cache);
}



/**
 * 
 *
 */
function removeLeedzShowing() {

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
            var test_trade = theChild.getAttribute("TRADE_NAME");
                
            if (test_trade == trade_name) {
                // remove leed from calendar
                each_day.removeChild( theChild );
            }
            
        }

    }
 }


 
/**
 * 
 *
 */
function removeMatchingLeed( each_day, leed_id ) {

    // start with 1 to skip the date square
    for (var i = 1; i < each_day.children.length; i++ ) {
        var testLeed = each_day.children[i];
        var id = testLeed.getAttribute("ID");
        if (id == leed_id) {
            // console.log("REMOVING MATCHING CACHE LEED=" + testLeed.getAttribute("TRADE_NAME"));
            each_day.removeChild( testLeed );
            break;
        }
    }
    
}



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

//
// FIXME FIXME FIXME
// check to see if this is OUR leed
//
function createCalendarLeed( eachDay, trade_color, leed_fromDB ) {


    console.log("%cCREATING CALENDAR LEED " + leed_fromDB.trade, "color: " + trade_color + ";");

    // create the DOM node
    const newLeed = document.createElement("button");
    newLeed.className = "trade_radio";
    newLeed.style.backgroundColor = trade_color;

    // copy info from JSON into DOM node
    // each leed knows what trade it comes 
    newLeed.setAttribute("TRADE_NAME", leed_fromDB.trade);
    newLeed.setAttribute("ID", leed_fromDB.id); // unique ID


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
        thumbnail.style.border = "2px solid " + trade_color;
        thumbnail.style.opacity = 1;

    });

    // mouse out --> HIDE thumbnail
    //
    newLeed.addEventListener("mouseout", function( event ) {
    
        thumbnail.style.opacity = 0;
    });
  
    
    
    ////////////////////////////////////////////////////////////////////////////////////
    // CLICK LEED --> ACTION WINDOW
    //
    // display full leed info table
    //
    newLeed.addEventListener("click", function( event ) {
    
        // turn off the thumbnail
        thumbnail.style.opacity = 0;
  
        // turn off the old leed
        if (CURRENT_LEED != null) {
            CURRENT_LEED.style.border = 0;
        } 

        CURRENT_LEED = newLeed;
        CURRENT_LEED.style.border = "2px solid black";



        // FIXME FIXME FIXME
        // what if action panel not showing
        // small screens - display:none
        // let actionPanel = document.querySelector("#action_panel");
        try {
            showLeedAction( leed_fromDB );
        } catch (error) {
            // FIXME FIXME FIXME
            // modal error dialog?
        }
            

    });

    eachDay.appendChild( newLeed );
    // console.log("CREATING CALENDAR LEED=" + leed_fromDB.trade + "==" + leed_fromDB.start);
}






