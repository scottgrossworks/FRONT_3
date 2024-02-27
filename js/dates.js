/**
 * ALL DATES ARE UTC
 * The system imagines everyone lives in the same timezone
 * dates.js brokers all date requests from the UI for consistent display no matter the client timezone
 * 
 */
import { throwError } from "./error.js";

 


const DATE_KEY = "DS";

// DATE_SHOWING is the current Date() object showing on the calendar
let DATE_SHOWING = null;


/**
 *
 * Key to the system -- convert ALL dates to GMT -- as if time zones did not exist
 * everyone lives at GMT in the leedz
 * 
 * the seller posts a leed in the local time zone 6PM
 * 
 * the system dates it as 6PM GMT
 * 
 * the buyer sees the leed posted as 6PM -- no time zone is given
 * -- and assumes that is 6PM in the local time zone
 * and carries on as usual
 *
 * the system ignores time zones by making GMT the global time zone
 * 
 * Any year, month, day input to the function should result in a date object in GMT
 * 
 */
export function getNewDate(year, month, day, hour, min, sec) {

    // Convert the input values to UTC by subtracting 1 from the month
    // since JavaScript months are zero-based (January is 0, February is 1, etc.)
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    
    // Get the individual date components from the UTC date
    const utcYear = utcDate.getUTCFullYear();
    const utcMonth = utcDate.getUTCMonth() + 1; // Add 1 to get the correct month
    const utcDay = utcDate.getUTCDate();
    
    // Create a new date object using the GMT components
    const gmtDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, hour, min, sec));

    return gmtDate;
  }




/**
 *  input Date().getTime()
 *  for use in input type="datetime-local"
 */
export function formatDTforInput( dateTime ) {

    var the_d = new Date( dateTime );
    
    var year = the_d.getUTCFullYear();
    var month = (the_d.getUTCMonth() + 1).toString().padStart(2, '0'); // getMonth returns a zero-based index of the month: 0-11
    var day = the_d.getUTCDate().toString().padStart(2, '0'); // 1 - 31
    var hours = the_d.getUTCHours().toString().padStart(2, '0'); // 0 - 23
    var minutes = the_d.getUTCMinutes().toString().padStart(2, '0'); // 0 - 59
  
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

    //
    // convert from 12-hr --> 24-hr time
    //
    if (amPm== "AM") {
        // AM
        if (the_hour == 12) { 
            the_hour = 0; 
        }

    } else {
        // PM
        if (the_hour != 12) { 
            the_hour += 12; 
        }
    }


    // MINUTES
    //
    const the_min = prettyStr.substring(colon + 1, colon + 3);
    // console.log("THE MIN=" + the_min);


    // CREATE A GMT DATE
    //
    const the_date = getNewDate( the_year, 
                                the_month, 
                                the_day,
                                the_hour,
                                the_min,
                                1);


    const the_DT = the_date.getTime();

    // console.log("THE DATE=" + the_date.toLocaleString('en-US', { timeZone: 'UTC' }));

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
    // FORMAT -->  toUTCString()
    // "Wed, 14 Jun 2017 07:00:00 GMT"
    let utc_string = theDate.toUTCString();
    window.localStorage.setItem(DATE_KEY, utc_string);

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
        return DATE_SHOWING;
    } 

    // if not set
    // check local storage for a previously-viewed calendar
    // NEVER RETURN A DATE PRIOR TO current month
    const cacheDate = window.localStorage.getItem( DATE_KEY );
    // FORMAT -->  toUTCString()
    // "Wed, 14 Jun 2017 07:00:00 GMT"
   
    
    if (cacheDate != null) {
        
        DATE_SHOWING = utcToDate( cacheDate );

    } else {
        // no cache date --- show current month / year
        // show today's date
        DATE_SHOWING = getTodayUTC();  
        
        // save in case of browser close / refresh
        window.localStorage.setItem( DATE_KEY, DATE_SHOWING.toUTCString() ); 
    }
    

    return DATE_SHOWING;

}


/**
 * 
 * FORMAT -->  toUTCString()
 * "Wed, 14 Jun 2017 07:00:00 GMT" --->  Date object
 */

function utcToDate(utcString) {
    const utcDate = new Date(utcString); // Create a Date object from the UTC string
    const year = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth();
    const day = utcDate.getUTCDate();
    const hours = utcDate.getUTCHours();
    const minutes = utcDate.getUTCMinutes();
    const seconds = utcDate.getUTCSeconds();
  
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }





/**
 * 
 */
export function getDay() {

    if (DATE_SHOWING == null) getDateShowing();        
    let day = DATE_SHOWING.getUTCDate();

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
    let month = DATE_SHOWING.getUTCMonth() + 1;
    // let month = DATE_SHOWING.getMonth() + 1;
    return month;
}


/**
 * return numerical index for this month
 * 0-based
 * @param monthname - first three chars of month used
 */
export function getMonthIndex( monthname ) {

        let shortMonth = monthname.substring(1, 3);

        switch (shortMonth) {
            case "an":
                return 1;
            
            case "eb":
                return 2;

            case "ar":
                return 3
            
            case "pr":
                return 4;

            case "ay":
                return 5;
            
            case "un":
                return 6;

            case "ul":
                return 7;
            
            case "ug":
                return 8;

            case "ep":
                return 9;
            
            case "ct":
                return 10;
                
            case "ov":
                return 11;

            case "ec":
                return 12;

            default:
                return 1;
        }

}




/**
 *
 */
export function getYear() {

    if (DATE_SHOWING == null) getDateShowing();
    return DATE_SHOWING.getUTCFullYear();
}



/**
 * @returns 1st minute of 1st day of month showing -- as seconds since epoch long
 */
export function firstDayShowing() {

    let month = getMonth();
    let year = getYear();
    let day = 1;
    
    let firstDay = getNewDate(year, month, day, 0, 0, 1);

    return firstDay.getTime(); 
}


/**
 * @returns last minute of last day of month showing -- as seconds since epoch long
 */
export function lastDayShowing() {

    
    let month = getMonth();
    let year = getYear();
    let day = daysInMonth(month, year);
    
    let lastDay = getNewDate(year, month, day, 23, 59, 59);

    return lastDay.getTime(); 
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
    var am_pm = "AM";
    
    if (theHour == 12) {
        am_pm = "PM"

    } else if (theHour > 12) {
        am_pm = "PM";
        theHour = theHour % 12;

    } else if (theHour == 0) {
        theHour = 12;
    }

    return [ String(theHour), am_pm ];

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

    switch (shortDay[1]) {

        case 'u':
            if (shortDay[0] == 'T')
                return "Tuesday";
            else
                return 'Sunday';

        case 'a':
            return "Saturday";

        case 'o':
            return "Monday";

        case 'e': 
            return "Wednesday";
        
        case 'r':
            return "Friday";

        case 'h':
            return "Thursday";
        
        default:
            throwError("getWeekday() not found for: " + dateString);
    }
    throwError("getWeekday() not found for: " + dateString);
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






