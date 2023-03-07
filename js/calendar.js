/*
 *
 *
 */

import { daysInMonth } from "./months.js";
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
 * Each trade is responsible for populating the calendar
 * with its leedz for each date
 */
export function initCalendarPanel() {

    // import DOM elements from html
    const theList = document.querySelector("#calendar_list");
    const theTemplate = document.querySelector("#template_each_day");

    //
    // FIXME FIXME FIXME
    // where does this info come from
    // session storage -- last month viewed?
    // new Date() -- today's date?
    let theYear = 2023;
    let theMonth = 2; // JAN == 0
    let days_in_month = 30;
    let start_date = 1;
    let weekday = 0; // sunday = 0
    

    for (var i = start_date; i <= days_in_month; i++) {

        // clone a new node
        let theClone = theTemplate.content.cloneNode(true);
        let eachDay = theClone.querySelector(".each_day");

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






/* FIXME FIXME FIXME
 * 2/19
 * should I create a separate data structure for the trades date
 * separate from the DOM 
 * should I save that date to sessionStorage
 * how much should be updated when the browser is refrreshed 
 * with a new call to the DB
 * 
*/

const DB_LEEDZ = [
                
    {
      id: 55555,
      trade: "caricatures",
      start_date: new Date("2023-03-05T01:00:00"),
      end_date: new Date("2023-03-05T03:30:00"),
      note: "Bar Mitzvah",
    },
    
    
    {
      id: 77777,
      trade: "photographer",
      start_date: new Date("2023-03-07T18:00:00"),
      end_date: new Date("2023-03-07T21:00:00"),
      note: "Wedding",
    },
    
    
    
    {
      id: 99999,
      trade: "DJ",
      start_date: new Date("2023-03-11T15:30:00"),
      end_date: new Date("2023-03-11T18:30:00"),
      note: "Corporate Event",
    },
    
    ];



/*
 * FIXME FIXME FIXME
 *
 * 
 */
export function loadCalendarLeedz( trade_name, trade_color, thisDate ) {


    //
    // GET DB_LEEDZ 
    // 
    //

    let dateIndex = 1;

    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");
    
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
 * are two dates functionally ==
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

    const newLeed = document.createElement("button");
    newLeed.className = "trade_radio";
    newLeed.style.backgroundColor = trade_color;

    // LEED DATE
    // get Date() object from leed -> start_date    
    const startTime = leed_fromDB.start_date.getHours() + ":" + leed_fromDB.start_date.getMinutes();
    const endTime = leed_fromDB.end_date.getHours() + ":" + leed_fromDB.end_date.getMinutes();

  

    // THUMBNAILS
    // hover over leed --> get preview thumbnail
    
    let thumbnail = document.querySelector(".leed_thumbnail");
    newLeed.addEventListener("mouseenter", function( event ) {

        // FIXME FIXME FIXME
        // placing the thumbnail 
        // var rect = eachDay.getBoundingClientRect();
        // var x = rect.left; //x position within the element.
        // var y = rect.top;  //y position within the element.
        // let thumb_html = "cx=" + event.clientX + " x=" + x + "cy=" + event.clientY + " y=" + y;


        // THUMBNAIL contains leed info preview
        let thumb_html = leed_fromDB.note + "<BR>" + startTime + "--" + endTime;
        thumbnail.innerHTML =thumb_html;     

        thumbnail.style.left = (event.clientX + 10) + "px"
        thumbnail.style.top = (event.clientY - 70) + "px";
        thumbnail.style.border = "2px solid " + trade_color;
        thumbnail.style.opacity = 1;

    });

    // mouse out --> HIDE thumbnail
    //
    newLeed.addEventListener("mouseout", function( event ) {
    
        //thumbnail.style.opacity = 0;
    });
  

    // click leed --> action window
    // display full leed info table
    //
    newLeed.addEventListener("click", function( event ) {
    
        // turn off the thumbnail
        thumbnail.style.opacity = 0;
  
        // turn off the old leed
        if (CURRENT_LEED != null) {

            CURRENT_LEED.className = CURRENT_LEED.className.replace(" current_leed", "");
        } 

        CURRENT_LEED = newLeed;
        CURRENT_LEED.className += " current_leed";

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

  


