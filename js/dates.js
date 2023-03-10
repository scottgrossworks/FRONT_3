/* dates.js */

const DATE_KEY = "DS";
let DATE_SHOWING = null;


// DATE_SHOWING is the current Date() object showing on the calendar

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
    window.sessionStorage.setItem(DATE_KEY, DATE_SHOWING);
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
    let sessionDate = window.sessionStorage.getItem( DATE_KEY );
    if (sessionDate != null) {
        DATE_SHOWING = new Date(sessionDate);
    
    
    } else {
        // show today's date
        DATE_SHOWING = new Date();
        // save in case of browser close / refresh
        window.sessionStorage.setItem( DATE_KEY, DATE_SHOWING); 
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
    let month = DATE_SHOWING.getMonth();
    return month + 1;
}




/**
 *
 */
export function getYear() {

    if (DATE_SHOWING == null) getDateShowing();
    return DATE_SHOWING.getFullYear();
}



/*
 * 
 */
export function daysInMonth ( month, year ) { 

    // why +1?  I don't know
    let numDays = new Date(year, month + 1, 0).getDate();
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
        //theHour %= 12;
        return [ String(theHour), "PM" ];
    }
    
}



/**
 * @param isoString Date().toISOString() string
 */
export function getMinutes( isoString ) {

    return isoString.substring(14,16);
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
export function getShortDate( theDate ) {

    var theString = theDate.toISOString().substring(0, 10);
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






