import { setDateShowing, getMonth, getYear, getMonthname, getNewDate } from "./dates.js";
import { buildCalendar, loadCacheLeedz, loadDBLeedz } from "./calendar.js";




/**
 * 
 * 
 */
export function initMonthChooser() {

    let theMonth = getMonth();
    let theYear = getYear();

    let months = document.querySelector(".month_chooser");
    let theLabel = months.querySelector("#month_label");

    theLabel.textContent = getMonthname(theMonth) + ", " + theYear;



    /*
     * PREV MONTH
     */
    let leftArrow = months.children[0];
    leftArrow.addEventListener("click", function( event ) {
    
        let prevMonth = getPrevMonth();

        let theMonth = prevMonth.getUTCMonth() + 1;
    
        let theYear = prevMonth.getFullYear();

        theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
        
        setDateShowing( prevMonth );

        buildCalendar();

        loadCacheLeedz();

        // this is an async call
        // will return immediately - data shows up later
        loadDBLeedz();

    });



    /*
     * NEXT MONTH
     */
    let rightArrow = months.children[2];
    rightArrow.addEventListener("click", function( event ) {
  
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

    });

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

