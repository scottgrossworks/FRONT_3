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
     */
    const leftArrow = months.children[0];

    if (isCurrentMonth()) {
        hideBackArrow(leftArrow, showPrevMonth);
    
    } else {
        showBackArrow(leftArrow, showPrevMonth);
    }

        
        
    /*
     * NEXT MONTH
     */
    const rightArrow = months.children[2];
    rightArrow.addEventListener("click", function(event) {
    
        let nextMonth = getNextMonth();
        let theMonth = nextMonth.getUTCMonth() + 1;
        let theYear = nextMonth.getFullYear();
    
        theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
    
        setDateShowing( nextMonth );
    
        buildCalendar();
    
        loadCacheLeedz();
    
        // this is an async call
        // will return immediately - data shows up later
        loadDBLeedz();
    
        showBackArrow(leftArrow, showPrevMonth);

    });




}



/**
 * 
 * 
 */
function showPrevMonth() {
    
    let prevMonth = getPrevMonth();

    let theMonth = prevMonth.getUTCMonth() + 1;

    let theYear = prevMonth.getFullYear();

    let theLabel = document.querySelector("#month_label");
    theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
    
    setDateShowing( prevMonth );

    buildCalendar();

    loadCacheLeedz();

    // this is an async call
    // will return immediately - data shows up later
    loadDBLeedz();

    
    const leftArrow = document.querySelector(".month_chooser").children[0];
    if (isCurrentMonth()) {
        hideBackArrow(leftArrow, showPrevMonth);
    
    } else {
        showBackArrow(leftArrow, showPrevMonth);
    }
}


/**
 * 
 */
function showNextMonth(leftArrow, theLabel) {

    console.log("HELLO!");
    
    let nextMonth = getNextMonth();


    let theMonth = nextMonth.getUTCMonth() + 1;
    let theYear = nextMonth.getFullYear();

    theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;

    setDateShowing( nextMonth );

    buildCalendar();

    loadCacheLeedz();

    // this is an async call
    // will return immediately - data shows up later
    loadDBLeedz();

   
   if (isCurrentMonth())
        hideBackArrow( leftArrow, showPrevMonth);
    else
       showBackArrow(leftArrow, showPrevMonth);

}



/**
 * 
 */
function showBackArrow( leftArrow, handler ) {

    leftArrow.style.opacity = 1;

    leftArrow.addEventListener("click", handler);
}




/**
 * 
 */
function hideBackArrow( leftArrow, handler ) {

    leftArrow.style.opacity = 0.25;


    leftArrow.removeEventListener("click", handler);
}










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

    // console.log("getPrevMonth=" + theMonth + "=" + theYear);

    const theDay = 1;

    return getNewDate( theYear, theMonth, theDay );
}

 
/*
 *
 */
function getNextMonth() {

    let theMonth = getMonth();
    let theYear = getYear();

    
    // console.log("getNextMonth START=" + theMonth + "=" + theYear)

    if (theMonth == 12) {
        theYear++;
        theMonth = 1;
    
    } else {
        theMonth++;
    }

    

    // console.log("getNextMonth END=" + theMonth + "=" + theYear);

    const theDay = 1;

    return getNewDate( theYear, theMonth, theDay );
}

