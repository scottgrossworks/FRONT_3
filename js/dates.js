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
 *  input Date().getTime()
 *  for use in input type="datetime-local"
 */
export function formatDTforInput(dateTimeString) {
    
    const dateObj = new Date(dateTimeString);


    var year = dateObj.getUTCFullYear();
    var month = twoDigitInt( dateObj.getUTCMonth() + 1 );
    var day = twoDigitInt( dateObj.getUTCDate() );
        
    
    const hours = twoDigitInt(dateObj.getUTCHours());
    // const minutes = twoDigitInt(String(dateObj.getUTCMinutes()).padStart(2, "0"));
    const minutes = twoDigitInt(String(dateObj.getUTCMinutes()).padStart(1, "0"));

    
    let retStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    return retStr;
  }



  /**
   * 
   * 2023-08-12T18:31 --> Saturday Aug 12, 2023 at 6:31PM
   */
  export function prettyFormatDT( isoString ) {

        const the_weekday = getWeekday( getShortDateString( isoString ) );
        const the_monthname = getShortMonthname( isoString.substring(5, 7) ); 
 
        // remove '0' at front if any
        let the_date = isoString.substring(8, 10);
        if (the_date.startsWith('0')) { the_date = the_date.substring(1) };

        const the_year = isoString.substring(0, 4);
        const the_hours = getHours(isoString);

        const fullStartDate = the_weekday + " " + the_monthname + " " + the_date + ", " + the_year; 
        const the_time = the_hours[0] + ":" + getMinutes(isoString) + the_hours[1];

        const retString = fullStartDate + " at " + the_time;


        return retString;
    }





/**
 * Saturday Oct 14, 2023 at 0:00AM
 * input prettyFormatDT and output DT
 * 
 * Tuesday Apr 2, 2023 at 6:11PM --> 1680444660000
 */
export function DTfromPretty( prettyStr ) {

     // MONTH
    var space = prettyStr.indexOf(' ');
    var monthStr = prettyStr.substring( space + 1, space + 4);
    const the_month = getMonthIndex( monthStr ); // WRONGbvvb
    // console.log("THE MONTH=" + the_month);

    // DAY
    var space2 = prettyStr.indexOf(' ', space + 1);
    var comma = prettyStr.indexOf(',');
    const the_day = prettyStr.substring(space2 + 1, comma);
    // console.log("THE DAY=" + the_day);

    // YEAR
    // 'at ' including space -- so we don't catch Saturday
    var at = prettyStr.indexOf('at ');
    const the_year = prettyStr.substring(comma + 1, at).trim();
    // console.log("THE YEAR=" + the_year);

    // HOURS
    var colon = prettyStr.indexOf(':');
    var the_hour = parseInt( prettyStr.substring(at + 2, colon).trim() );
    // console.log("colon=" + colon + " hour=" + the_hour);
    // AM / PM
    let amPm = prettyStr.substring( prettyStr.length - 2 );
    if (amPm == "PM") {
        the_hour += 12;
    }
    // console.log("THE HOUR=" + the_hour);


    // MINUTES
    const the_min = prettyStr.substring(colon + 1, colon + 3);
    // console.log("THE MIN=" + the_min);


    const the_date = new Date( Date.UTC( the_year,
                                      the_month,
                                      the_day,
                                      the_hour,
                                      the_min,
                                      0 ) );


    const the_DT = the_date.getTime();

    // console.log("%cTHE DATE=" + the_date, "color:darkgreen");

    return the_DT;

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
export function getTodayUTC() {

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
 * is DATE_SHOWING the current month?
 */
export function isCurrentMonth() {

    const date_showing = getDateShowing();

    const date_today = new Date();

    // SAME MONTH
    let month_showing = date_showing.getUTCMonth();
    let month_today = date_today.getUTCMonth();


    if (month_showing != month_today)
        return false;


    // SAME YEAR
    let year_showing = date_showing.getUTCFullYear();
    let year_today = date_today.getUTCFullYear();

    if (year_showing != year_today)
        return false;


    return true;
}



/**
 *  
 */
export function getDateShowing() {

    if (isDateSet()) {
        // console.log("DATE IS SET SHOWING=" + DATE_SHOWING);
        return DATE_SHOWING;
    } 

    // if not set
    // check session storage for a previously-viewed calendar
    // NEVER RETURN A DATE PRIOR TO current month
    const sessionDate = window.sessionStorage.getItem( DATE_KEY );
   
   
    // const today = getTodayUTC();
    // 10/31 FIXME
    // trying to solve the end-of-month problem
    //
    const today = new Date();
    

    if (sessionDate != null) {
        
        // cache contains a date
        // BUT just to be sure
        // never show a calendar from a previous month -- no reason when all leedz have expired
        var shortDate = getShortDateString(sessionDate);
        const cacheDate = new Date(shortDate);

        if (cacheDate.getTime() < today.getTime()) {
            // return today's date
            DATE_SHOWING = today;

        } else {

            DATE_SHOWING = cacheDate;
        }
   
   
    } else {
        // no cache date --- show current month / year
        // show today's date
        DATE_SHOWING = today;
    }
    
    // save in case of browser close / refresh
    var shortDate = getShortDate( DATE_SHOWING );
    window.sessionStorage.setItem( DATE_KEY, shortDate ); 

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
    
    
    // FIXME 
    // 10/31
    // trying to solve the 'last day of month' problem

    // let month = DATE_SHOWING.getUTCMonth() + 1;
    let month = DATE_SHOWING.getMonth() + 1;
    return month;
}


/**
 * return numerical index for this month
 * 0-based
 * @param monthname - first three chars of month used
 */
export function getMonthIndex( monthname ) {

        let shortMonth = monthname.substring(0, 3).toLowerCase();

        switch (shortMonth) {
            case "jan":
                return 0;
            
            case "feb":
                return 1;

            case "mar":
                return 2;
            
            case "apr":
                return 3;

            case "may":
                return 4;
            
            case "jun":
                return 5;

            case "jul":
                return 6;
            
            case "aug":
                return 7;

            case "sep":
                return 8;
            
            case "oct":
                return 9;
                
            case "nov":
                return 10;

            case "dec":
                return 11;

            default:
                return 0;
        }

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

    var theString = dateString.substring(0, 10);
    return theString;

}






