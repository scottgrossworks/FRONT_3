import { loadCalendar } from "./calendar.js";


export let DATE_SHOWING = null;





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

    let monthname = getMonthname( month_index);
    let shortname = monthname.slice(0, 3);
    return shortname;
}

  
/*
 * return month name from index
 * 0 = January
 */
export function getMonthname( month_index ) {

    switch (month_index) {

        case 0:
            return "January";
        case 1:
            return "February";
        case 2:
            return "March";
        case 3:
            return "April";
        case 4:
            return "May";
        case 5:
            return "June";   
        case 6:
            return "July";
        case 7:
            return "August";
        case 8:
            return "September";
        case 9:
            return "October";
        case 10:
            return "November";            
        default:
            return "December";
    }
}




export function initMonthChooser() {

    // is the current date set from a previous session
    let sessionDate = window.sessionStorage.getItem( "DATE_SHOWING" );
    
    // if not use today's date
    if (sessionDate == null) {
        DATE_SHOWING = new Date(); // today
    } else {
        DATE_SHOWING = new Date( sessionDate );
    }    
    // save in case of browser close / refresh
    window.sessionStorage.setItem("DATE_SHOWING", DATE_SHOWING);


    let theMonth = DATE_SHOWING.getMonth();
    let theYear = DATE_SHOWING.getFullYear();

    let months = document.querySelector(".month_chooser");
    let theLabel = months.querySelector("#month_label");

    theLabel.textContent = getMonthname(theMonth) + ", " + theYear;


    /*
     * PREV MONTH
     */
    let leftArrow = months.children[0];
    leftArrow.addEventListener("click", function( event ) {
    
        let prevMonth = getPrevMonth();

        let theMonth = prevMonth.getMonth();
        let theYear = prevMonth.getFullYear();

        theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
        
        DATE_SHOWING = prevMonth;
        // save in case of browser close / refresh
        window.sessionStorage.setItem("DATE_SHOWING", DATE_SHOWING);

        loadCalendar( DATE_SHOWING );
    });



    /*
     * NEXT MONTH
     */
    let rightArrow = months.children[2];
    rightArrow.addEventListener("click", function( event ) {
  
        let nextMonth = getNextMonth();

        let theMonth = nextMonth.getMonth();
        let theYear = nextMonth.getFullYear();

        theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;

        DATE_SHOWING = nextMonth;
        // save in case of browser close / refresh
        window.sessionStorage.setItem("DATE_SHOWING", DATE_SHOWING);

        loadCalendar( DATE_SHOWING );
    });



}


/*
 * DAY will be reset to 1
 */
function getPrevMonth() {

    let theMonth = DATE_SHOWING.getMonth();
    let theYear = DATE_SHOWING.getFullYear();

    if (theMonth == 0) {
        theYear--;
        theMonth = 11;
    
    } else {
        theMonth--;
    }

    const theDay = 1;

    return new Date( theYear, theMonth, theDay );
}

 
/*
 *
 */
function getNextMonth() {

    let theMonth = DATE_SHOWING.getMonth();
    let theYear = DATE_SHOWING.getFullYear();

    if (theMonth == 11) {
        theYear++;
        theMonth = 0;
    
    } else {
        theMonth++;
    }

    const theDay = 1;

    return new Date( theYear, theMonth, theDay );
}

