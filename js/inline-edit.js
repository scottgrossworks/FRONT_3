/**
 * 
 * 
 */

import { printError, throwError } from "./error.js";
import { getCurrentLeed } from "./leed.js";
import { isValidTrade } from "./trades.js";
import { prettyFormatDT, formatDTforInput, getTodayUTC } from "./dates.js";










var inlineEditRowContents = {};




/**
 * Called by Edit button or Clickable Row
 *
 */
export function inlineEdit(rowName, options) {

    try {
        var tableRow = document.getElementById(rowName);
        
        inlineEditRowContents[rowName] = {};
        for (var i = 0; i < tableRow.childElementCount; i++) {
            var cell = tableRow.children[i];

            inlineEditRowContents[rowName][i] = cell.innerHTML.trim();
            inlineDefaultUpdateCell(cell, i, rowName, options);   
        }
    } catch (error) {
        console.log("INLINE EDIT ERROR!");
        throwError("inlineEdit", error);
    }
}






/**
 * Update contents of cell being edited 
 */

function inlineDefaultUpdateCell(cell, i, rowName, options) {
    

    
    var attributesFilter = ["inlineoptionsvalue", "inlineoptionstitle"];
    var cellContent = "";
    var key;
    
    if (i === 0) {
        cellContent += `<form id='${rowName}Form'></form>`;
    
    }
    

    
    switch (cell.dataset.inlinetype) {
        
    
        //
        // ZIP CODE
        //
        case "zip":
        
        cellContent += `<input type='text' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
        for (key in cell.dataset) {
            if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
            }
        }
        cellContent += "/>";
        


        break;






        //
        // TRADE NAME
        //
        case "trade_name":
        
        cellContent += `<input type='trade_name' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
        for (key in cell.dataset) {
            if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
            }
        }
        cellContent += "/>";
        


        break;








            
        case "doneButton":
            cellContent += `<input type='submit' id="finish_button" value='Finish' form='${rowName}Form'/>`;
            break;
        case "button":

            cellContent += inlineEditRowContents[rowName][i];
            break;
        case "link":
            cellContent += `<input type='text' value='${cell.innerText}' form='${rowName}Form'`;
            for (key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += "/>";
            break;
        case "text":



            cellContent += `<input type='text' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
            for (key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += "/>";
            break;



            case "date":



            // START / END DATES
            // loading the initial value
            //
            
            // var theVal = inlineEditRowContents[rowName][i];
            var dateTime = null;
            if (options.origin = "create") {   // coming from create page                
                dateTime = getTodayUTC().getTime();

            } else {   // coming from edit page
                var current_leed = getCurrentLeed();
                dateTime = (rowName == "row_start") ? current_leed.st : current_leed.et;
            }

            var theVal = formatDTforInput( dateTime );


            cellContent += `<input type='datetime-local' value='${theVal}' form='${rowName}Form'`;
            for (key in cell.dataset    ) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += "/>";
            break;





            // TEL
            //
        case "tel":
            cellContent += `<input type='tel' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
            for (key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += "/>";
            break;
        case "email":
            cellContent += `<input type='email' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
            for (key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += "/>";
            break;
        case "select":
            cellContent += "<select";
            for (key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += ">";
            var optionsTitle = JSON.parse(cell.dataset.inlineoptionstitle);
            var optionsValue = cell.dataset.hasOwnProperty("inlineoptionsvalue") ? JSON.parse(cell.dataset.inlineoptionsvalue) : [];
            for (var j = 0; j < optionsTitle.length; j++) {
                cellContent += "<option ";
                cellContent += ((optionsValue.length <= j) ? "" : `value='${optionsValue[j]}'`);
                cellContent += ((inlineEditRowContents[rowName][i] == optionsTitle[j]) ? " selected='selected'" : "");
                cellContent += ">";
                cellContent += optionsTitle[j];
                cellContent += "</option>";
            }
            cellContent += "</select>";
            break;
        case "textarea":
            cellContent += `<textarea form='${rowName}Form'`;
            for (key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += ">";
            cellContent += inlineEditRowContents[rowName][i];
            cellContent += "</textarea>";
            break;
        default:
            cellContent += inlineEditRowContents[rowName][i];
            break;
    }



    cell.innerHTML = cellContent;
    
    if (i === 0) {
        // set the onsubmit function of the form of this row
        document.getElementById(rowName + "Form").onsubmit = function() {
            event.preventDefault();
            if (this.reportValidity()) {
                if (options.hasOwnProperty("finish"))
                    options.finish(rowName, options);
                else {

                    try {
                        inlineDefaultFinish(rowName, options);
                    } catch (error) {

                        // CAN'T THROW ERROR OUT OF THIS FILE
                        // would like to throw here and catch in leed_create and put up a modal there
                        // throwError("inlineDefaultFinish", error);
                        printError("inlineDefaultFinish", error);
                    }
                  
                }
            }
        };
    }
}






/**
 * replace HTML tags
 */
function replaceHTMLTags( str ) {
    if (str == null) return "";

    var trimVal = str.trim();

    if (trimVal == "") return "";

    trimVal = str.replace(/[&<>]/g, replaceTag);

    return trimVal;

}



function replaceTag(tag) {
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return tagsToReplace[tag] || tag;
}


/**
 * returns true if the str represents a number
 *  
 */
function isNumOnly( str ) {

    // Defining the regular expression
    const strRegex = new RegExp(/^[0-9]+$/i);
         
    // match the regex with the string
    let result = strRegex.test( str );
    return result;
}




function trimAndRemoveSpaces(inputString) {
    // Trim leading/trailing white spaces and remove spaces in between
    let trimmedString = inputString.trim().replace(/\s+/g, " ");
    // Replace all single spaces with ""
    let resultString = trimmedString.replace(/ /g, "");

    return resultString;
}





/**
 * 
 * 
 */

function inlineDefaultFinish(rowName, options) {
   

    var tableRow = document.getElementById(rowName);
    var rowData = {};
    for (var i = 0; i < tableRow.childElementCount; i++) {
        var cell = tableRow.children[i];
        var getFromChildren = (i === 0) ? 1 : 0;



        switch (cell.dataset.inlinetype) {




            case "zip":

                var theVal = cell.children[getFromChildren].value;

                var trimVal = trimAndRemoveSpaces( theVal );

                if (trimVal.length != 5) {
                    let errMsg = "Zip code must be 5 digits";
                    printError("inlineDefaultFinish", errMsg );
                    alert(errMsg);
                    return;
                }

                if (! isNumOnly( trimVal )) {
                    let errMsg = "Zip code must be all digits";
                    printError("inlineDefaultFinish", errMsg );
                    alert(errMsg);
                    return;
                }


                rowData[cell.dataset.inlinename] = trimVal;
                inlineEditRowContents[rowName][i] = trimVal;
                break;




            case "tel":
                
                var theVal = cell.children[getFromChildren].value;
                var trimVal = trimAndRemoveSpaces( theVal );

                if (trimVal.length < 10) {
                    let errMsg = "Invalid phone number: " + theVal;
                    printError("inlineDefaultFinish", errMsg );
                    alert(errMsg);
                    return;
                }


                if (trimVal.length != 10) {
                    let errMsg = "Phone number must be 10 digits";
                    printError("inlineDefaultFinish", errMsg );
                    alert(errMsg);
                    return;
                }



                if (! checkPhone( trimVal )) {
                    let errMsg = "Invalid phone number: " + theVal;
                    printError("inlineDefaultFinish", errMsg);
                    alert(errMsg);
                    return;
                }



                rowData[cell.dataset.inlinename] = trimVal;
                inlineEditRowContents[rowName][i] = trimVal;
                break;




            case "trade_name":


                var theVal = cell.children[getFromChildren].value;
                var trimVal = theVal.trim();

                //
                // is this a valid trade name?  If not -- show error and force re-enter
                //
                if (! (isValidTrade( trimVal )))  {
                    let errMsg = "Invalid trade name: " + theVal;
                    printError("inlineDefaultFinish", errMsg );
                    alert(errMsg);
                    return;
                }


                rowData[cell.dataset.inlinename] = trimVal;
                inlineEditRowContents[rowName][i] = trimVal;
                break;







            case "doneButton":
                break;
            case "button":
                break;
            case "link":

                var theVal = cell.children[getFromChildren].value;
                var trimVal = trimAndRemoveSpaces( theVal );

                rowData[cell.dataset.inlinename] = trimVal;
                inlineEditRowContents[rowName][i] = trimVal;

                break;



            case "text":

                var theVal = cell.children[getFromChildren].value;
                var trimVal = theVal.trim();
                var safeVal = replaceHTMLTags( trimVal );


       
                // Validate loc
                //
                if (cell.dataset.inlinename == "loc") {

                    if (! checkForZip( safeVal )) {
                        let errMsg = "Address must end in zip code"
                        printError("inlineDefaultFinish", errMsg );
                        alert(errMsg);
                        return;
                    }
                    

                // Validate email
                //
                } else if (cell.dataset.inlinename == "em") {

                    if (safeVal.indexOf('@') == -1) {
                        let errMsg = "Invalid email address"
                        printError("inlineDefaultFinish", errMsg );
                        alert(errMsg);
                       return;
                    }


                // Validate price
                //
                } else if (cell.dataset.inlinename == "pr") {

                    // Check if safeVal begins with a '$' and trim it off if it does
                    if (safeVal.charAt(0) === '$') {
                        safeVal = safeVal.substring(1);
                    }

                    if (! ( /^[0-9]+$/.test( safeVal ))) {
                        let errMsg = "Price must be a whole number"
                        printError("inlineDefaultFinish", errMsg );
                        alert(errMsg);
                       return;
                    }
                }



                rowData[cell.dataset.inlinename] = safeVal;
                inlineEditRowContents[rowName][i] = safeVal;
           

            break;






            case "date":

                var theVal = cell.children[getFromChildren].value;

                var trimVal = prettyFormatDT( theVal.trim() );

                rowData[cell.dataset.inlinename] = trimVal;
                inlineEditRowContents[rowName][i] = trimVal;
        

            break;



            case "email":

                var theVal = cell.children[getFromChildren].value;
                var trimVal = trimAndRemoveSpaces( theVal );

                //
                // is this a valid email?  If not -- show error and force re-enter
                //
                if (trimVal.indexOf('@') == -1) {
                    let errMsg = "Invalid email: " + trimVal;
                    printError("inlineDefaultFinish()", errMsg );
                    alert(errMsg);
                    return;
                }

                
                rowData[cell.dataset.inlinename] = trimVal;
                inlineEditRowContents[rowName][i] = trimVal;

                break;




            case "select":

                rowData[cell.dataset.inlinename] = cell.children[getFromChildren].selectedIndex;                
                rowData["_" + cell.dataset.inlinename + "Title"] = JSON.parse(cell.dataset.inlineoptionstitle)[cell.children[getFromChildren].selectedIndex];
                rowData["_" + cell.dataset.inlinename + "Value"] = JSON.parse(cell.dataset.inlineoptionsvalue)[cell.children[getFromChildren].selectedIndex];

                const theData = JSON.parse(cell.dataset.inlineoptionstitle)[cell.children[getFromChildren].selectedIndex];
                inlineEditRowContents[rowName][i] = theData;
                break;

            case "textarea":

                // TODO textarea value is \n not <br/>
                var theVal = cell.children[getFromChildren].value;
                var safeVal = replaceHTMLTags( theVal.trim() );

                
                rowData[cell.dataset.inlinename] = safeVal;
                inlineEditRowContents[rowName][i] = safeVal;;

                break;
            default:
                break;
        }
    }


    // Call appropriate callback for this row
    if (options.hasOwnProperty("finishCallback")) {
        options.finishCallback(rowData, rowName);
    }


    try {
        // update the table cell with the new value
        for (i = 0; i < tableRow.childElementCount; i++) {
            var cell = tableRow.children[i];
            
            if (options.hasOwnProperty("urlFinish")) {

                inlineURLFinishCell(cell, i, rowName);

            } else if (options.hasOwnProperty("emailFinish")) {

                inlineEmailFinishCell(cell, i, rowName);


            } else {
                inlineDefaultFinishCell(cell, i, rowName);
            }
        }

    } catch (error) {
        throwError("inlineDefaultFinish", error);
    }
}




/**
 * check that we can extract a zip code from the address string
 * @param {*} s address string coming in from form
 * @returns true if s ends in zip code
 */
function checkForZip(s) {
    // Check if s is less than 5 characters
    if (s.length < 5) {
      return false;
    }
    
    // Check if the last 5 characters of s are numeric digits 0-9
    var lastFiveChars = s.slice(-5);
    for (var i = 0; i < lastFiveChars.length; i++) {
      var c = lastFiveChars.charAt(i);
      if (c < '0' || c > '9') {
        return false;
      }
    }
    
    // If both conditions are false, return true
    return true;
  }



/**
 * Verify phone number
 * @param {c} s from form
 * @returns true if phone number only contains digits, . and - otherwise return false
 */
  function checkPhone(s) {
    // Remove any whitespace from the string
    s = s.replace(/\s/g, '');
    
    // Check if the string only contains valid phone number characters
    return /^[0-9.\-]+$/.test(s);
  }






export function inlineDefaultFinishCell(cell, i, rowName) {

    var cellContent = "";
    cellContent += inlineEditRowContents[rowName][i];
    cell.innerHTML = cellContent;
}




//

export function inlineURLFinishCell(cell, i, rowName) {

    var content = inlineEditRowContents[rowName][i];
    if (i == 1) {
        cell.innerHTML = "<a href='" + content + "'>" + content + "</a>";
    } else {
        cell.innerHTML = content;
    }
}


export function inlineEmailFinishCell(cell, i, rowName) {

    var content = inlineEditRowContents[rowName][i];
    if (i == 1) {
        cell.innerHTML = "<a href='mailto:" + content + "'>" + content + "</a>";
    } else {
        cell.innerHTML = content;
    }
}



























