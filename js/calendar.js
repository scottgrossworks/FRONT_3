/*
 *
 *
 */

import { daysInMonth, DATE_SHOWING } from "./months.js";
import { showLeedAction } from "./action.js";


let CURRENT_LEED = null;


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




/*
 * Each trade is responsible for populating the calendar
 * with its leedz for each date
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
        eachDay.style.setProperty("--leedz_date", theDate);

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
    }

}







/*
 *
 */
export function initCalendarPanel() {

    // display calendar for DATE_SHOWING

    // the month_chooser is the keeper of the current Date() object showing
    // should NOT be null if month_chooser initialized first
    if (DATE_SHOWING == null) {
        // check session storage for a previously-viewed calendar
        let sessionDate = window.sessionStorage.getItem( "DATE_SHOWING" );
        if (sessionDate != null) {
            DATE_SHOWING = sessionDate;
        } else {
            DATE_SHOWING = new Date();  // use today's date
        }
    }  // else...DATE_SHOWING still set in months.js

    loadCalendar( DATE_SHOWING );

}



/* FIXME FIXME FIXME
 * 2/19
 * should I create a separate data structure for the leedz data
 * separate from the DOM 
 * should I save that date to sessionStorage
 * how much should be updated when the browser is refrreshed 
 * with a new call to the DB
 * 
*/








    const DB_CARICATURES = [
                
        {
          id: 11111,
          trade: "caricatures",
          start_date: new Date("2023-03-03T01:00:00"),
          end_date: new Date("2023-03-03T03:30:00"),
          note: "Caricatures 1",
        },
        
        
        {
          id: 22222,
          trade: "caricatures",
          start_date: new Date("2023-03-04T18:00:00"),
          end_date: new Date("2023-03-04T21:30:00"),
          note: "Caricatures 2",
        },
        
        
        
        {
          id: 33333,
          trade: "caricatures",
          start_date: new Date("2023-05-11T15:30:00"),
          end_date: new Date("2023-05-11T18:30:00"),
          note: "Caricatures 3",
        },
        
        ];




        

    const DB_DANCER = [
                
        {
          id: 44444,
          trade: "dancer",
          start_date: new Date("2023-03-04T01:00:00"),
          end_date: new Date("2023-03-04T03:30:00"),
          note: "dancer 1",
        },
        
        
        {
          id: 55555,
          trade: "dancer",
          start_date: new Date("2023-03-14T18:00:00"),
          end_date: new Date("2023-03-14T21:30:00"),
          note: "dancer 2",
        },
        
        
        
        {
          id: 66666,
          trade: "dancer",
          start_date: new Date("2023-05-12T15:30:00"),
          end_date: new Date("2023-05-12T18:30:00"),
          note: "dancer 3",
        },
        
        ];



        
        

    const DB_DEEJAY = [
                
        {
          id: 77777,
          trade: "deejay",
          start_date: new Date("2023-03-03T06:00:00"),
          end_date: new Date("2023-03-03T09:30:00"),
          note: "deejay 1",
        },
        
        
        {
          id: 88888,
          trade: "deejay",
          start_date: new Date("2023-03-06T18:30:00"),
          end_date: new Date("2023-03-06T20:30:00"),
          note: "deejay 2",
        },
        
        
        
        {
          id: 99999,
          trade: "deejay",
          start_date: new Date("2023-05-12T15:30:00"),
          end_date: new Date("2023-05-12T18:30:00"),
          note: "deejay 3",
        },
        
        ];


        
        

    const DB_ERROR = [
                
        {
          id: 121212,
          trade: "ERROR",
          start_date: new Date("2023-03-03T06:00:00"),
          end_date: new Date("2023-03-03T09:30:00"),
          note: "ERROR",
        },
    ];



/*
 * 
 *
 * 
 */
export function loadCalendarLeedz( trade_name, trade_color, thisDate ) {


    // FIXME FIXME FIXME
    // cache leedz?
    
   
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



    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");
    let dateIndex = 1;
    // for each (date sorted) lead coming in from the DB
    for (const leed_fromDB of DB_LEEDZ) {

        // iterate through the calendar and find the corresponding date
        for (var counter = dateIndex; counter < theList.children.length; counter++) {
            // because the leedz are sorted by date, skip ahead to date of last leed

            let each_day = theList.children[ counter ];


            // each element is an LI each_day
            let theDate = each_day.style.getPropertyValue("--leedz_date");


            // skip the template
            if (theDate == "") {
                continue;
            }

            // FIXME FIXME -- let's see how the data comes back from the DB
            // JSON?  might need to make new Date(leed_fromDB.start_date)
            // or better yet no new objects and just do a string compare 
            
            // date row in calendar corresponds to date in leed_fromDB
            if ( sameDate(leed_fromDB.start_date, new Date(theDate)) ) {

                createCalendarLeed( each_day, trade_color, leed_fromDB);
                dateIndex = counter; 
                break;
            } 
        }
    }
}


/*
 * FIXME FIXME FIXME
 */
export function removeCalendarLeedz( trade_name ) {


    const theDays = document.querySelectorAll(".each_day");
    // get all the days of the current month showing
    for (var i = 0; i < theDays.length; i++) {

        // for each day
        var each_day = theDays[i];
        
        // iterate over all children looking leedz with matching trade_name
        for ( var c = 1; c < each_day.children.length; c++) {
            // start with 1 to skip the date square
            var theChild = each_day.children[c];

            var test_trade = theChild.style.getPropertyValue("--trade_name");
                
            if (test_trade == trade_name) {
                // remove leed from calendar
                each_day.removeChild( theChild );
            }
            
        }

    }
 }

    
 




/*
 * are two dates functionally ==
 * hour/min will NOT match so do not use Date() == Date() to test
* FIXME FIXME FIXME
 * could changing the order of comparison optimize for most cases in practice
 */
function sameDate(date_1, date_2) {


    let isTheSame = (
        (date_1.getDate() == date_2.getDate()) &&
        (date_1.getMonth() == date_2.getMonth()) &&
        (date_1.getFullYear() == date_2.getFullYear())
    );

    return isTheSame;
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
    newLeed.style.setProperty("--trade_name", leed_fromDB.trade);


    // LEED DATE
    // get Date() object from leed -> start_date    
    const startTime = leed_fromDB.start_date.getHours() + ":" + leed_fromDB.start_date.getMinutes();
    const endTime = leed_fromDB.end_date.getHours() + ":" + leed_fromDB.end_date.getMinutes();

  

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

            // CURRENT_LEED.classList.remove("trade_active");
            // CURRENT_LEED.className = CURRENT_LEED.className.replace(" trade_active", "");
            CURRENT_LEED.style.border = 0;
        } 

        CURRENT_LEED = newLeed;
        CURRENT_LEED.style.border = "2px solid black";
        // CURRENT_LEED.classList.add("trade_active"); doesn't work
        // CURRENT_LEED.className += " trade_active"; doesn't work

        // FIXME FIXME FIXME
        // what if action panel not showing
        // small screens - display:none
        // let actionPanel = document.querySelector("#action_panel");
        showLeedAction( trade_color, leed_fromDB );
        
    });

    eachDay.appendChild( newLeed );

}


/*
 *
 */

  


