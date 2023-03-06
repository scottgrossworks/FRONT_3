let CURRENT_MONTH = 0;

export function initMonthChooser() {

    // is the current month set from a previous session
    let theMonth = window.sessionStorage.getItem( "current_month" );
    if (theMonth != null) { CURRENT_MONTH = theMonth; }

    let months = document.querySelector("month_chooser");
    let theLabel = months.querySelector("month_label");

    console.log("THE LABEL="+theLabel);
    
    theLabel.textContent = getMonthname(theMonth);

}

/*
 * 
 */
function daysInMonth ( month, year ) { // Use 1 for January, 2 for February, etc.
    return new Date(year, month, 0).getDate();
  }




  
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

