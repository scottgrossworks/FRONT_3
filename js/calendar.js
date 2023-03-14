/*
 *
 *
 */

import { daysInMonth, getShortDateString, getShortWeekday, getMonth, getYear, getHours, getMinutes, twoDigitInt  } from "./dates.js";
import { showLeedAction } from "./action.js";
import { getColorForTrade } from "./trades.js";
import { isSubscribed } from "./user.js";


const CACHE_DELIM = "|";
let CURRENT_LEED = null;
 


const DB_CARICATURES = [
                
    {
      id: 11111,
      trade: "caricatures",
      start: new Date("2023-03-03T15:00:00Z").toISOString(),
      end: new Date("2023-03-03T17:30:00Z").toISOString(),
      note: "Caricatures 1"
    },
    
    
    {
      id: 22222,
      trade: "caricatures",
      start: new Date("2023-03-04T18:00:00Z").toISOString(),
      end: new Date("2023-03-04T21:30:00Z").toISOString(),
      note: "Caricatures 2",
    },
    
    
    
    {
      id: 33333,
      trade: "caricatures",
      start: new Date("2023-05-05T15:30:00Z").toISOString(),
      end: new Date("2023-05-05T18:30:00Z").toISOString(),
      note: "Caricatures 3",
    },
    
    ];
    

const DB_DANCER = [
            
    {
      id: 44444,
      trade: "dancer",
      start: new Date("2023-03-04T11:00:00Z").toISOString(),
      end: new Date("2023-03-04T13:30:00Z").toISOString(),
      note: "dancer 1",
    },
    
    
    {
      id: 55555,
      trade: "dancer",
      start: new Date("2023-03-14T18:00:00Z").toISOString(),
      end: new Date("2023-03-14T21:30:00Z").toISOString(),
      note: "dancer 2",
    },
    
    
    
    {
      id: 66666,
      trade: "dancer",
      start: new Date("2023-05-02T15:30:00Z").toISOString(),
      end: new Date("2023-05-02T18:30:00Z").toISOString(),
      note: "dancer 3",
    },
    
    ];


const DB_DEEJAY = [
            
    {
      id: 77777,
      trade: "deejay",
      start: new Date("2023-03-03T20:00:00Z").toISOString(),
      end: new Date("2023-03-03T22:30:00Z").toISOString(),
      note: "deejay 1",
    },
    
    
    {
      id: 88888,
      trade: "deejay",
      start: new Date("2023-03-06T18:30:00Z").toISOString(),
      end: new Date("2023-03-06T20:30:00Z").toISOString(),
      note: "deejay 2",
    },
    
    
    
    {
      id: 99999,
      trade: "deejay",
      start: new Date("2023-05-04T15:30:00Z").toISOString(),
      end: new Date("2023-05-04T18:30:00Z").toISOString(),
      note: "deejay 3",
    },
    
    ];


const DB_ERROR = [
            
    {
      id: 121212,
      trade: "ERROR",
      start: new Date("2023-03-03T06:00:00Z").toISOString(),
      end: new Date("2023-03-03T09:30:00Z").toISOString(),
      note: "ERROR",
    },
];




/*
 * Build the calendar UI for τƒOWING
 * does not load leedz
 * session storage is the leed cache
 *      key    : date
 *      value  : delimited string of JSON-stringified leed objects
 */
export function loadCalendar() {

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

 
        // CACHE
        // are there leedz in the cache for this date?
        loadLeedzFromCache( eachDay );
    }

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
    console.error("loadLeedzFromCache()=" + theLeedz.length);
    
    // for each JSON leed loaded from CACHE
    for (var i = 0; i < theLeedz.length; i++) {
  
        var theJSON = theLeedz[i];
        if ((theJSON == null) || (theJSON == "") || (theJSON == CACHE_DELIM)) continue; // just be safe

        // (re)create leed node using cache data
        var theLeed = JSON.parse( theJSON );
   
        // is the user stil subscribed to leedz of this trade?
        if ( isSubscribed( theLeed.trade ) ) {
            
            // get the color and create a leed
            var trade_color = getColorForTrade( theLeed.trade );
            createCalendarLeed( theDay, trade_color, theLeed);
        
        } else {
            // user has unsubscribed since last cache save
            // remove leed from cache and DO NOT add to calendar
            theLeedz[i] = null;
        }
    }

    // RESET ACHE

    JSON_leedz = ""; // start wtih fresh JSON
    // only save back to cache leedz that have not been nulled out (unsubscribed)
    theLeedz.forEach( (leed) => {
        if (leed != null) JSON_leedz = JSON_leedz + JSON.stringify(leed) + CACHE_DELIM;
    });

    // put JSON back where it came from
    window.sessionStorage.setItem(dateString, JSON_leedz);
    
}



/*
 * 
 *
 * 
 */
export function loadLeedzForTrade( trade_name, trade_color ) {

    console.error("loadLeedzForTrade()");


    //
    // GET DB_LEEDZ 
    // need thisDate for query
    //

    let DB_LEEDZ = [];

    switch (trade_name) {

        case "caricatures" :
            DB_LEEDZ = DB_CARICATURES;
            break;

        case "dancer" :
            DB_LEEDZ = DB_DANCER;
            break;

        case "deejay" :
            DB_LEEDZ = DB_DEEJAY;
            break;
   
        default:
            DB_LEEDZ = DB_ERROR;
    }
///////////////////////////////////////////////////


    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");

    let dateIndex = 1;
    // for each (date sorted) leed coming in from the DB
    for (const leed_fromDB of DB_LEEDZ) {

        console.error("LOADING LEED=" + leed_fromDB.trade + "--" + getShortDateString(leed_fromDB.start));

        // starting at date last visited (skipping template index:0 )
        // iterate through the calendar and find the corresponding date
        for (var counter = dateIndex; counter < theList.children.length; counter++) {
         
            let each_day = theList.children[ counter ];

            // compare the date for this row in the calendar to the date of the leed
            // theDate is a String
            let theDate = each_day.getAttribute("LEEDZ_DATE");

            // this should NEVER be null
            if (theDate == null) {
                console.error("LEEDZ_DATE attribute not being set for each day");
                console.error("Unable to load leedz for " + leed_fromDB.trade);
                return;  
            }

            // if date row in calendar corresponds to date in leed_fromDB
            // both should be Date.toISOString() 
            if ( getShortDateString(leed_fromDB.start) == theDate ) {


                // FIXME FIXME FIXME
                // these are fresh leedz from DB with possibly altered leed details
                // overwrite any matching leed
                removeMatchingLeed( each_day, leed_fromDB.id );

                // CREATE CALENDAR LEED
                //
                createCalendarLeed( each_day, trade_color, leed_fromDB);
                
                dateIndex = counter; 
                // reset so on next iteration
                // skip ahead to date of this leed
                break; // leed will only have one corresponding calendar day
            
            } 
        }
        // before we move on to next leed
        // CACHE this one in sessionStorage -- might be future date not displayed
        // console.log("CACHING LEED FOR=" + getShortDateString(leed_fromDB.start));
        cacheLeed( leed_fromDB, getShortDateString(leed_fromDB.start) );
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



/*
 * 
 */
export function removeLeedzForTrade( trade_name ) {


    const theDays = document.querySelectorAll(".each_day");
    // get all the days of the current month showing
    for (var i = 0; i < theDays.length; i++) {

        // for each day
        var each_day = theDays[i];
        
        // iterate over all children looking leedz with matching trade_name
        for ( var c = 1; c < each_day.children.length; c++) {
            // start with 1 to skip the date square
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
 */
function createCalendarLeed( eachDay, trade_color, leed_fromDB ) {


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
    let hours_start = getHours(leed_fromDB.start);
    let hours_end = getHours(leed_fromDB.end);

    const startTime = hours_start[0] + ":" + getMinutes(leed_fromDB.start) + hours_start[1];
    const endTime = hours_end[0] + ":" + getMinutes(leed_fromDB.end) + hours_end[1];

  

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
  

    // click leed --> action window
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
        showLeedAction( trade_color, leed_fromDB );
        
    });

    eachDay.appendChild( newLeed );
    // console.log("CREATING CALENDAR LEED=" + leed_fromDB.trade + "==" + leed_fromDB.start);
}






