import { loadCalendar } from "./calendar.js";
import { setDateShowing, getMonth, getYear, getMonthname } from "./dates.js";





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

        let theMonth = prevMonth.getMonth();
        let theYear = prevMonth.getFullYear();

        theLabel.textContent = getMonthname( theMonth ) + ", " + theYear;
        
        setDateShowing( prevMonth );

        loadCalendar();
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

       setDateShowing( nextMonth );

       loadCalendar();
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

    const theDay = 1;

    return new Date( theYear, theMonth, theDay );
}

 
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

    const theDay = 1;

    return new Date( theYear, theMonth, theDay );
}

