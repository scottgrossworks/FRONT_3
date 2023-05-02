/**
 * ALL DATES ARE UTC
 * The system imagines everyone lives in the same timezone
 * dates.js brokers all date requests from the UI for consistent display no matter the client timezone
 * 
 */


const DATE_KEY = "DS";

// DATE_SHOWING is the current Date() object showing on the calendar
let DATE_SHOWING = null;


/**
 *
 * 
 */
export function getNewDate( theYear, theMonth, theDay) {

    const theDate = new Date( Date.UTC(theYear, theMonth - 1, theDay) );
    return theDate;
}


/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
 * Date-only strings (e.g. "1970-01-01") are treated as UTC <=== WHAT WE WANT
 * while date-time strings (e.g. "1970-01-01T12:00") are treated as local. 
 * 
 */
export function getISODate( isoString ) {
    const theDate = new Date( isoString );
    return theDate;
}


/**
 * (25) ===> '25'
 *  (9) ===> '09'
 */
export function twoDigitInt( d ) {

    return (d < 10) ? '0' + d.toString() : d.toString();
}


/**
 *
 */
function getTodayUTC() {

    let today = new Date();
    let utcDate = new Date(Date.UTC(today.getUTCFullYear(), 
                                     today.getUTCMonth(), 
                                     today.getUTCDate()));

    return utcDate;
}


/**
 * 
 */
export function isDateSet() {
    return (DATE_SHOWING != null);
}

/**
 * @param theDate Date() object
 */
export function setDateShowing( theDate ) {

    DATE_SHOWING = theDate;
    window.sessionStorage.setItem(DATE_KEY, getShortDateString(DATE_SHOWING.toISOString()));

}




/**
 *  
 */
export function getDateShowing() {

    if (isDateSet()) {
        return DATE_SHOWING;
    } 

    // if not set
    // check session storage for a previously-viewed calendar
    const sessionDate = window.sessionStorage.getItem( DATE_KEY );
    if (sessionDate != null) {

        let shortDate = getShortDateString(sessionDate);
        DATE_SHOWING = new Date(shortDate);
        
    } else {
        // show today's date
        DATE_SHOWING = getTodayUTC();
        // save in case of browser close / refresh
        let shortDate = getShortDate( DATE_SHOWING );
        window.sessionStorage.setItem( DATE_KEY, shortDate ); 
    }
    
    return DATE_SHOWING;

}


/**
 * 
 */
export function getDay() {

    if (DATE_SHOWING == null) getDateShowing();        
    let day = DATE_SHOWING.getDay();

    return day;
}





/**
 * +1 because Date() object uses 0-index
 * and ISOdates / views use 1-index
 */
export function getMonth() {

    if (DATE_SHOWING == null) getDateShowing();        
    let month = DATE_SHOWING.getUTCMonth() + 1;
    return month;
}




/**
 *
 */
export function getYear() {

    if (DATE_SHOWING == null) getDateShowing();
    return DATE_SHOWING.getFullYear();
}



/**
 * @returns 1st minute of 1st day of month showing -- as seconds since epoch long
 */
export function firstDayShowing() {

    let month = getMonth();
    let year = getYear();
    let day = 1;
    
    let firstDay = getNewDate(year, month, day);

    return firstDay.getTime(); // long
}


/**
 * @returns last minute of last day of month showing -- as seconds since epoch long
 */
export function lastDayShowing() {

    
    let month = getMonth();
    let year = getYear();
    let day = daysInMonth(month, year);
    
    let lastDay = getNewDate(year, month, day);

    return lastDay.getTime(); // long
}





/*
 * This uses LOCAL timezone
 * NOT UTC
 */
export function daysInMonth ( month, year ) { 

    let numDays = new Date(year, month, 0).getDate();
    return numDays;
  }




/*
 * return the first three letters of the monthname from the index
 * Jan == January
 */
export function getShortMonthname( month_index ) {

    let monthname = getMonthname( Number(month_index) );
    let shortname = monthname.slice(0, 3);
    return shortname;
}



  
/*
 * return month name from index
 * 1 = January
 */
export function getMonthname( month_index ) {

    switch (month_index) {

        case 1:
            return "January";
        case 2:
            return "February";
        case 3:
            return "March";
        case 4:
            return "April";
        case 5:
            return "May";
        case 6:
            return "June";   
        case 7:
            return "July";
        case 8:
            return "August";
        case 9:
            return "September";
        case 10:
            return "October";
        case 11:
            return "November";            
        default:
            return "December";
    }
}







/**
 * FIXME: this seems to be very roundabout and inefficient
 * 
 * @param isoString Date().toISOString() string
 *  "2011-10-05T14:48:00.000Z"
 * 
 * returns [hour,AM/PM] tuple array
 */
export function getHours( isoString ) {
    
    // trim hours
    let totalHours = isoString.substring(11,13);

     // convert the input string to a number
    var theHour = Number( totalHours );

      // check if the hour is before 12, return "AM" if true, "PM" otherwise
    if (theHour < 12) {
        return [ String(theHour), "AM" ];
    } else {
        return [ String(theHour % 12), "PM" ];
    }
    
}



/**
 * @param isoString Date().toISOString() string
 */
export function getMinutes( isoString ) {

    return isoString.substring(14,16);
}





/*
 * @param String ISO short date YYYY-MM-DD
 *
 * FORCE LOCAL TIME
 * Use time format:  THH:MM:SS     (no trailing Z) 
 * returns LOCAL day of week -- converts to LOCAL timezone
 * NOT UTC
 */
export function getShortWeekday( shortDate ) {

    let longDate = shortDate + "T00:01:00";
    let localDate = new Date( longDate );

    let dateStr = localDate.toString().substring(0, 3);

    return dateStr;
}



/*
 * @param String ISO short date YYYY-MM-DD
 *
 * FORCE LOCAL TIME
 * Use time format:  THH:MM:SS     (no trailing Z) 
 * returns LOCAL day of week -- converts to LOCAL timezone
 * NOT UTC
 */
export function getWeekday( dateString ) {

    let shortDay = getShortWeekday( dateString );

    switch (shortDay[0]) {

        case 'M':
            return "Monday";

        case 'W': 
            return "Wednesday";
        
        case 'F':
            return "Friday";
    }

    switch (shortDay[1]) {

        case 'u':
            return "Tuesday";
        
        case 'h':
            return "Thursday";
        
        case 'a':
            return "Saturday";
    }

    console.error("getWeekday() not found for: " + dateString);
    return "Day Not Found";
}






/** 
 * @param Date object
 * trim time / timezone info off date and return it as a string
 */
export function getShortDate( theDate ) {


    let theISO = theDate.toISOString();
    var theString = theISO.substring(0, 10);

    return theString;

}



/** 
 * @param dateString Date().toISOString() String with time appended
 * trim time / timezone info off and return substring
 */
export function getShortDateString( dateString ) {

    // console.log("%cSHORT STRING:" + dateString, "color:darkgreen;");

    var theString = dateString.substring(0, 10);
    return theString;

}






