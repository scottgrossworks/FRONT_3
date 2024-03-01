import { setDateShowing, getMonth, getYear, getMonthname, getNewDate, isCurrentMonth } from "./dates.js";
import { buildCalendar, loadCacheLeedz, loadDBLeedz } from "./calendar.js";




/**
 * 
 * 
 */
export function initMonthChooser() {


    const months = document.querySelector(".month_chooser");
    
    const theLabel = document.querySelector("#month_label");
    theLabel.textContent = getMonthname( getMonth() ) + ", " + getYear();


    /*
     * PREV MONTH
     *
     */
    const leftArrow = months.children[0];
    if (isCurrentMonth()) {
        hideBackArrow(leftArrow, showPrevMonth_handler);
    
    } else {
        showBackArrow(leftArrow, showPrevMonth_handler);
    }

        
        
    /*
     * NEXT MONTH
     *
     */
    const rightArrow = months.children[2];
    rightArrow.addEventListener("click", function(event) {
    
        showNextMonth_handler(event);
    

        console.log("IN LISTENR event=" + event);

        showBackArrow(leftArrow, showPrevMonth_handler);
    });


}





/**
 * 
 */
function showBackArrow( leftArrow, handler ) {

    if (leftArrow.style.opacity != 1) {
        leftArrow.style.opacity = 1;
        leftArrow.addEventListener("click",function(event) { handler(event) });
    }
}




/**
 * 
 */
function hideBackArrow( leftArrow, handler ) {

    leftArrow.style.opacity = 0.25;

    leftArrow.removeEventListener("click", handler);
}


/**
 * 
 * 
 */
function showPrevMonth_handler(event) {
    event.preventDefault();
    let prevMonth = getPrevMonth();
    // console.log("PREV HANDLER=" + prevMonth.toLocaleString('en-US', { timeZone: 'UTC' }));

    let theMonth = prevMonth.getUTCMonth() + 1;

    let theYear = prevMonth.getFullYear();

    let theLabel = document.querySelector("#month_label");
    theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
    
    setDateShowing( prevMonth );

    buildCalendar();

    loadCacheLeedz();

    // this is an async call
    // will return immediately - data shows up later
    // console.error("showPrevMonth.loadDBLeedz()");
    loadDBLeedz();

    
    const leftArrow = document.querySelector(".month_chooser").children[0];
    if (isCurrentMonth()) {
        hideBackArrow(leftArrow, showPrevMonth_handler);
    
    } else {
        showBackArrow(leftArrow, showPrevMonth_handler);
    }
}
window.showPrevMonth_handler = showPrevMonth_handler;








/*
 * DAY will be reset to 1
 */
function getPrevMonth() {

    let theMonth = getMonth();
    let theYear = getYear();

    if (theMonth == 1) {
        theYear--;
        theMonth = 12;
    
    } else {
        theMonth--;
    }

    const newDate = getNewDate( theYear, theMonth, 1 , 0, 0, 1);
    
    // console.log("getPrevMonth() = " + newDate.toLocaleString('en-US', { timeZone: 'UTC' }));

    return newDate;
}




/**
 * 
 */
function showNextMonth_handler(event) {
    event.preventDefault();

    let nextMonth = getNextMonth();
    // console.log("NEXT HANDLER=" + nextMonth.toLocaleString('en-US', { timeZone: 'UTC' }));


    let theMonth = nextMonth.getUTCMonth() + 1; 
    let theYear = nextMonth.getUTCFullYear();

    let theLabel = document.querySelector("#month_label");
    theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;

    setDateShowing( nextMonth );

    buildCalendar();

    loadCacheLeedz();

    // this is an async call
    // will return immediately - data shows up later
    loadDBLeedz();


    const leftArrow = document.querySelector(".month_chooser").children[0];
    if (isCurrentMonth())
        hideBackArrow( leftArrow, showPrevMonth_handler);
    else
        showBackArrow(leftArrow, showPrevMonth_handler);

}
window.showNextMonth_handler = showNextMonth_handler;



/*
 *
 */
function getNextMonth() {

    let theMonth = getMonth();
    let theYear = getYear();

    
    if (theMonth == 12) {
        theYear++;
        theMonth = 1;
    
    } else {
        theMonth++;
    }

    const newDate = getNewDate( theYear, theMonth, 1 , 0, 0, 1);
    // console.log("NEXT MONTH=" + newDate.toLocaleString('en-US', { timeZone: 'UTC' }));

    return newDate;
}

