/**
 * 
 * 
 */

import { printError, throwError } from "./error.js";




var inlineEditRowContents = {};

class StringEscaper {
    static replaceTag(tag) {
		var tagsToReplace = {
	        '&': '&amp;',
	        '<': '&lt;',
	        '>': '&gt;'
	    };
        return tagsToReplace[tag] || tag;
    }

    static safe_tags_replace(str) {
        if (str == null) return "";
        return str.replace(/[&<>]/g, StringEscaper.replaceTag);
    }
}



export function inlineEdit(rowName, options) {
    var tableRow = document.getElementById(rowName);
    inlineEditRowContents[rowName] = {};
    for (var i = 0; i < tableRow.childElementCount; i++) {
        var cell = tableRow.children[i];
        inlineEditRowContents[rowName][i] = cell.innerHTML;
        if (options.hasOwnProperty("updateCell"))
            options.updateCell(cell, i, rowName, options);
        else
            inlineDefaultUpdateCell(cell, i, rowName, options);
    }
}





function inlineDefaultUpdateCell(cell, i, rowName, options) {
    var attributesFilter = ["inlineoptionsvalue", "inlineoptionstitle"];
    var cellContent = "";
    var key;
    if (i === 0) {
        cellContent += `<form id='${rowName}Form'></form>`;
    }
    switch (cell.dataset.inlinetype) {
        case "zip":
            
        cellContent += `<input type='num' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
        for (key in cell.dataset) {
            if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
            }
        }
        cellContent += "/>";
        break;

            
        case "doneButton":
            cellContent += `<input type='submit' value='Finish' form='${rowName}Form'/>`;
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
            cellContent += `<input type='date' value='${inlineEditRowContents[rowName][i]}' form='${rowName}Form'`;
            for (key in cell.dataset    ) {
                if (cell.dataset.hasOwnProperty(key) && key.substr(0, 6) == "inline" && attributesFilter.indexOf(key) == -1) {
                    cellContent += ` ${key.substr(6)}='${cell.dataset[key]}'`;
                }
            }
            cellContent += "/>";
            break;
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
                else
                    inlineDefaultFinish(rowName, options);
            }
        };
    }
}


/**
 * returns true if the str represents a number
 *  
 */
function isAlphaNum( str ) {

    // Defining the regular expression
    const strRegex = new RegExp(/^[a-z0-9]+$/i);
         
    // match the regex with the string
    let result = strRegex.test( str );
    return result;
}




function inlineDefaultFinish(rowName, options) {
    var tableRow = document.getElementById(rowName);
    var rowData = {};
    for (var i = 0; i < tableRow.childElementCount; i++) {
        var cell = tableRow.children[i];
        var getFromChildren = (i === 0) ? 1 : 0;
        switch (cell.dataset.inlinetype) {
            case "zip":

                let theVal = cell.children[getFromChildren].value;
                
                if (theVal.length != 5) {
                    let errMsg = "Zip code must be 5 digits";
                    printError("inlineDefaultFinish()", errMsg );
                    alert(errMsg);
                    return;
                }

                if (! isAlphaNum( theVal )) {
                    let errMsg = "Zip code must be all digits";
                    printError("inlineDefaultFinish()", errMsg );
                    alert(errMsg);
                    return;
                }


                
                rowData[cell.dataset.inlinename] = theVal;
                inlineEditRowContents[rowName][i] = StringEscaper.safe_tags_replace( theVal );
                break;


            case "doneButton":
                break;
            case "button":
                break;
            case "link":


                rowData[cell.dataset.inlinename] = cell.children[getFromChildren].value;
                inlineEditRowContents[rowName][i] = StringEscaper.safe_tags_replace(cell.children[getFromChildren].value);
            
                break;
            case "text":
            case "date":
            case "tel":
            case "email":
                rowData[cell.dataset.inlinename] = cell.children[getFromChildren].value;
                inlineEditRowContents[rowName][i] = StringEscaper.safe_tags_replace(cell.children[getFromChildren].value);
                break;
            case "select":
                rowData[cell.dataset.inlinename] = cell.children[getFromChildren].selectedIndex;
                rowData["_" + cell.dataset.inlinename + "Title"] = JSON.parse(cell.dataset.inlineoptionstitle)[cell.children[getFromChildren].selectedIndex];
                rowData["_" + cell.dataset.inlinename + "Value"] = JSON.parse(cell.dataset.inlineoptionsvalue)[cell.children[getFromChildren].selectedIndex];
                inlineEditRowContents[rowName][i] = JSON.parse(cell.dataset.inlineoptionstitle)[cell.children[getFromChildren].selectedIndex];
                break;
            case "textarea":
                // TODO textarea value is \n not <br/>
                rowData[cell.dataset.inlinename] = cell.children[getFromChildren].value;
                inlineEditRowContents[rowName][i] = cell.children[getFromChildren].value;
                break;
            default:
                break;
        }
    }





    // do whatever ajax magic
    if (options.hasOwnProperty("finishCallback"))
        options.finishCallback(rowData, rowName);

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
}



export function inlineDefaultFinishCell(cell, i, rowName) {
    var cellContent = "";
    cellContent += inlineEditRowContents[rowName][i];
    cell.innerHTML = cellContent;
}


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

