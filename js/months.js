import { loadCalendar, loadCalLeedz } from "./calendar.js";
import { setDateShowing, getMonth, getYear, getMonthname, getNewDate } from "./dates.js";
import { printError, throwError } from "./error.js";



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
        // console.log("CHECKING MONTH=" + theMonth);

        let theYear = prevMonth.getFullYear();

        // theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
        
        setDateShowing( prevMonth );

        loadCalendar();

        loadCalLeedz(true);
    });



    /*
     * NEXT MONTH
     */
    let rightArrow = months.children[2];
    rightArrow.addEventListener("click", function( event ) {
  
        let nextMonth = getNextMonth();

        // console.error("GOT NEXT MONT=" + nextMonth.toISOString());

        let theMonth = nextMonth.getUTCMonth() + 1;
        let theYear = nextMonth.getFullYear();

        // console.log("*****theMonth=" + theMonth + "*****theYear=" + theYear);

        theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;

       setDateShowing( nextMonth );

       loadCalendar();

       loadCalLeedz(true);
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

