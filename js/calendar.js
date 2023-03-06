/*
 *
 *
 */



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
 * Initialize the calendar column with TODAY'S date
 */
export function f_initCalendarPanel() {

    loadCalendar( new Date() );
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






/*
 *
 */
export function loadCalendarLeedz( trade_color, leedzFromDB ) {

    let dateIndex = 1;

    // the UI contains all the each_date days
    const theList = document.querySelector("#calendar_list");
    
    // for each (date sorted) lead coming in from the DB
    for (const theLeed of leedzFromDB) {

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

            if ( sameDate(theLeed.start_date, new Date(theDate)) ) {
                createCalendarLeed( each_day, trade_color, theLeed);
                dateIndex = counter; 
                break;
            } 
        }
    }
}


    
 




/*
 * are two dates functionally ==
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
function createCalendarLeed( theDay, leedColor, theLeed ) {

    let newLeed = document.createElement("button");
    newLeed.className = "trade_radio";
    newLeed.style.backgroundColor = leedColor;
 
    // let theDate = new Date( theDay.style.getPropertyValue("--leedz_date") );
    let thumbnail = document.querySelector(".leed_thumbnail");

    // hover over leed --> get preview thumbnail
    //
    newLeed.addEventListener("mouseenter", function( event ) {

        /*
        var weekday = getWeekday( theDate.getDay() );
        var day_of_month = theDate.getDate();
        var month = getMonthname( theDate.getMonth() );
        */
        var startTime = theLeed.start_date.getHours() + ":" + theLeed.start_date.getMinutes();
        var endTime = theLeed.end_date.getHours() + ":" + theLeed.end_date.getMinutes();

        thumbnail.innerHTML = theLeed.note + "<BR>" + startTime + "--" + endTime;
 
        // FIXME FIXME FIXME -- why?
        // console.log("x="+event.clientX + "px"+" y="+event.clientY + "px");
        thumbnail.style.left = (event.clientX - 220) + "px"
        thumbnail.style.top = (event.clientY - 100) + "px";
        thumbnail.style.border = "2px solid " + leedColor;
        thumbnail.style.opacity = 1;

    });

      // hover over leed --> get preview thumbnail
    //
    newLeed.addEventListener("mouseout", function( event ) {
    
        thumbnail.style.opacity = 0;
    });
  

    // click leed --> trigger action window
    //
    newLeed.addEventListener("click", function( event ) {
    
        console.log("ACTION WINDOW")
        
        //console.log("x="+event.clientX + "px"+" y="+event.clientY + "px");

        thumbnail.style.opacity = 0;
        newLeed.style.border = "2px solid black";
    });



    theDay.appendChild( newLeed );

}



/*
 * 
 */
function daysInMonth ( month, year ) { 

    // why +1?  I don't know
    let numDays = new Date(year, month + 1, 0).getDate();
    return numDays;
  }

  



/*
 * return weekday name from day index
 * 0 = sunday
 * 6 = saturday
 */
function getWeekday( day_index ) {

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



