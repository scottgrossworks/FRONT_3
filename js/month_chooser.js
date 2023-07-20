import { getMonth } from "./dates";



/*
 *
 */
export function initMonthChooser() {

    // get the month last visited from the previous session
    // or the current month if it is not set
    let theMonth = getMonth();

    let months = document.querySelector("month_chooser");
    let theLabel = months.querySelector("month_label");

    console.log("THE LABEL="+theLabel);
    
    theLabel.textContent = getMonthname( theMonth );
}


/*
 * 
 *
function daysInMonth ( month, year ) {     // Use 1 for January, 2 for February, etc.
    return new Date(year, month, 0).getDate();
}
*/



  
/*
 * return month name from index
 * 0 = January
 */
function getMonthname( month_index ) {

    switch (month_index) {

        case 1:
            return "Jan";
        case 2:
            return "Feb";
        case 3:
            return "Mar";
        case 4:
            return "Apr";
        case 5:
            return "May";
        case 6:
            return "Jun";
        case 6:
            return "Jul";
        case 6:
            return "Aug";
        case 6:
            return "Sep";
        case 6:
            return "Oct";
        case 6:
            return "Nov";            
        default:
            return "Dec";
    }
}

