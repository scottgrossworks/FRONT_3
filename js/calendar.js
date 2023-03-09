/*
 *
 *
 */

import { daysInMonth, getDateShowing } from "./months.js";
import { showLeedAction } from "./action.js";
import { getColorForTrade, isSubscribed } from "./trades.js";


const CACHE_DELIM = "|";
let CURRENT_LEED = null;
 


const DB_CARICATURES = [
                
    {
      id: 11111,
      trade: "caricatures",
      start: new Date("2023-03-03T01:00:00").toISOString(),
      end: new Date("2023-03-03T03:30:00").toISOString(),
      note: "Caricatures 1"
    },
    
    
    {
      id: 22222,
      trade: "caricatures",
      start: new Date("2023-03-04T18:00:00").toISOString(),
      end: new Date("2023-03-04T21:30:00").toISOString(),
      note: "Caricatures 2",
    },
    
    
    
    {
      id: 33333,
      trade: "caricatures",
      start: new Date("2023-05-11T15:30:00").toISOString(),
      end: new Date("2023-05-11T18:30:00").toISOString(),
      note: "Caricatures 3",
    },
    
    ];
    

const DB_DANCER = [
            
    {
      id: 44444,
      trade: "dancer",
      start: new Date("2023-03-04T01:00:00").toISOString(),
      end: new Date("2023-03-04T03:30:00").toISOString(),
      note: "dancer 1",
    },
    
    
    {
      id: 55555,
      trade: "dancer",
      start: new Date("2023-03-14T18:00:00").toISOString(),
      end: new Date("2023-03-14T21:30:00").toISOString(),
      note: "dancer 2",
    },
    
    
    
    {
      id: 66666,
      trade: "dancer",
      start: new Date("2023-05-12T15:30:00").toISOString(),
      end: new Date("2023-05-12T18:30:00").toISOString(),
      note: "dancer 3",
    },
    
    ];


const DB_DEEJAY = [
            
    {
      id: 77777,
      trade: "deejay",
      start: new Date("2023-03-03T06:00:00").toISOString(),
      end: new Date("2023-03-03T09:30:00").toISOString(),
      note: "deejay 1",
    },
    
    
    {
      id: 88888,
      trade: "deejay",
      start: new Date("2023-03-06T18:30:00").toISOString(),
      end: new Date("2023-03-06T20:30:00").toISOString(),
      note: "deejay 2",
    },
    
    
    
    {
      id: 99999,
      trade: "deejay",
      start: new Date("2023-05-12T15:30:00").toISOString(),
      end: new Date("2023-05-12T18:30:00").toISOString(),
      note: "deejay 3",
    },
    
    ];


const DB_ERROR = [
            
    {
      id: 121212,
      trade: "ERROR",
      start: new Date("2023-03-03T06:00:00").toISOString(),
      end: new Date("2023-03-03T09:30:00").toISOString(),
      note: "ERROR",
    },
];




/*
 * Build the calendar UI for each month
 * does not load leedz
 * session storage is the leed cache
 *      key    : date
 *      value  : delimited string of JSON-stringified leed objects
 */
export function loadCalendar( theDate ) {

    let theYear = theDate.getFullYear();
    let theMonth = theDate.getMonth();
    let weekday = theDate.getDay();

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
        let theDate = new Date(theYear, theMonth, i);
        let dateString = getShortDate( theDate );
        eachDay.setAttribute("LEEDZ_DATE", dateString);
 

        // inside the dateSquare
        // set the date number
        let dateSquare = theClone.querySelector(".dateSquare");
        dateSquare.textContent = i;
        
        // add the day of the week
        //
        let daySpan = document.createElement("span");
        daySpan.textContent = getWeekday( weekday );
        weekday = ++weekday % 7;
        dateSquare.appendChild( daySpan ); 

    
        // add the li to the growing vertical ul
        theList.appendChild( eachDay );

        // CACHE
        // are there leedz in the cache for this date?
        let leedz_cache = window.sessionStorage.getItem(dateString);
        if ((leedz_cache == null) || (leedz_cache == "") || (leedz_cache == CACHE_DELIM)) {
            // DO NOTHING
        } else {
            // leedz_cache contains delimited list of leed objects 
            loadLeedzFromCache(eachDay, leedz_cache);
        }
    }

}



/**
 * 
 *
 */
function loadLeedzFromCache( theDay, JSON_leedz ) {

    if (JSON_leedz == null || JSON_leedz == "" || JSON_leedz == CACHE_DELIM) return;

    const theLeedz = JSON_leedz.split( CACHE_DELIM );

    for (var i = 0; i < theLeedz.length; i++) {
  
        var theJSON = theLeedz[i];

        if ((theJSON == null) || (theJSON == "") || (theJSON == CACHE_DELIM)) continue;

        // (re)create leed node using cache data
        var theLeed = JSON.parse( theJSON );
   
        // is the user stil subscribed to leedz of this trade?
        if ( isSubscribed( theLeed.trade ) ) {
            // get the color and create a leed
            var trade_color = getColorForTrade( theLeed.trade );
            createCalendarLeed( theDay, trade_color, theLeed);
        } 
        // else -- FIXME FIXME FIXME -- remove it from the cache?
                
    }

}



/*
 * 
 *
 * 
 */
export function loadLeedzForTrade( trade_name, trade_color ) {

    // FIXME FIXME FIXME
    // before we go back to DB
    // does the cache ALREADY contain leedz for getDateShowing()
    //
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

        // starting at date last visited (skipping template index:0 )
        // iterate through the calendar and find the corresponding date
        for (var counter = dateIndex; counter < theList.children.length; counter++) {
         
            let each_day = theList.children[ counter ];


            // compare the date for this row in the calendar to the date of the leed
            // theDate is a String
            let theDate = each_day.getAttribute("LEEDZ_DATE");

            // this should NEVER be null
            if (theDate == null) {
                console.error("--leedz_date not being set for each day");
                theDate = new Date();
                each_day.setAttribute("LEEDZ_DATE", getShortDate( theDate) );   
            }

            // if date row in calendar corresponds to date in leed_fromDB
            // both should be Date.toISOString() 
            if ( getShortDateString(leed_fromDB.start) == theDate ) {


                // CREATE CALENDAR LEED
                //
                createCalendarLeed( each_day, trade_color, leed_fromDB);
                

                // CACHE LEED FOR THIS DATE
                //
                // leedz_cache --> delimited list of JSON-stringified leed objects
                let leedJSON = JSON.stringify( leed_fromDB );
                
                // is there already a cache for this date?
                let leedz_cache = window.sessionStorage.getItem( theDate );

                if (leedz_cache == null) {
                   leedz_cache = "";
                    // null becomes the string 'null' -- causes problems
                }

                // { leed JSON }|{ leed JSON }|{ leed JSON }|....
                leedz_cache = leedz_cache + leedJSON + CACHE_DELIM;
                window.sessionStorage.setItem(theDate, leedz_cache);
                   
                dateIndex = counter; 
                // reset so on next iteration
                // skip ahead to date of this leed
                break; // leed will only have one corresponding calendar day
            } 
        }
    }
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

    


/*
 * return weekday name from day index
 * 0 = sunday
 * 6 = saturday
 */
export function getWeekday( day_index ) {

    switch (day_index) {

        case 1:
            return "Mon";
        case 2:
            return "Tues";
        case 3:
            return "Wed";
        case 4:
            return "Thurs";
        case 5:
            return "Fri";
        case 6:
            return "Sat";
        default:
            return "Sun";
    }
}






/** 
 * @param Date object
 * trim time / timezone info off date and return it as a string
 */
function getShortDate( theDate ) {

    var theString = theDate.toISOString().substring(0, 10);
    return theString;

}



/** 
 * @param dateString Date().toISOString() String with time appended
 * trim time / timezone info off and return substring
 */
function getShortDateString( dateString ) {

    var theString = dateString.substring(0, 10);
    return theString;

}



/*
 *
 */
function createCalendarLeed( eachDay, trade_color, leed_fromDB ) {


    // create the DOM node
    const newLeed = document.createElement("button");
    newLeed.className = "trade_radio";
    newLeed.style.backgroundColor = trade_color;

    // each leed knows what trade it comes from
    newLeed.setAttribute("TRADE_NAME", leed_fromDB.trade);


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

}


/**
 * FIXME: this seems to be very roundabout and inefficient
 * 
 * @param isoString Date().toISOString() string
 *  "2011-10-05T14:48:00.000Z"
 * 
 * returns [hour,AM/PM] tuple array
 */
function getHours( isoString ) {
    
    // trim hours
    let totalHours = isoString.substring(11,13);

     // convert the input string to a number
    var theHour = Number( totalHours );

      // check if the hour is before 12, return "AM" if true, "PM" otherwise
    if (theHour < 12) {
        return [ String(theHour), "AM" ];
    } else {
        return [ String(theHour), "PM" ];
    }
    
}



/**
 * @param isoString Date().toISOString() string
 */
function getMinutes( isoString ) {

    return isoString.substring(14,16);
}





