
/**
 * 
 * LEED CREATE AND EDIT UTILS
 * 
 */
import { OPTS_LOCKED, OPTS_HIDDEN, OPTS_SHOWING, changeLeedOpts } from "./leed.js";
import { createDBLeed, saveLeedChanges, deleteCurrentLeed } from "./leed.js";
import { printError, errorModal } from "./error.js";

    export const URL_LEED_DELETED = "./leed_delete.html";
    
    export const cancelOptions = {  "origin": "cancel",
                                    "finishCallback": null };


    export const createOptions = {   "origin": "create",
                                     "showCallback": null,
                                     "hideCallback": null,
                                     "finishCallback": null };




        /**
         *
         */
        export function editField( row_name, options ) {

            try {
                inlineEdit( row_name, options );
            } catch (error) {
                var msg = "Error editing " + row_name + ": " + error.message;
                printError("editField", msg);
                errorModal(msg, true);
                return;
            }   
        }
        window.editField = editField;



        /**
         *
         *
         */
         export function hideField( row_index ) {
           console.log("HIDING FIELD: " + row_index);
            changeLeedOpts( LEED_CHANGES, row_index, OPTS_HIDDEN );
         }
         window.hideField = hideField;


        /**
         *
         *
         */
         export function showField( row_index ) {
            console.log("SHOWING FIELD: " + row_index);
            changeLeedOpts( LEED_CHANGES, row_index, OPTS_SHOWING );
         }
         window.showField = showField;



        /**
        * Clear all fields and start over
        *
        */
        export function clearFields() {

            inlineEdit('row_trade', cancelOptions);            
            inlineEdit('row_title', cancelOptions);
            inlineEdit('row_start', cancelOptions);
            inlineEdit('row_end', cancelOptions);
            inlineEdit('row_loc', cancelOptions);
            inlineEdit('row_em', cancelOptions);
            inlineEdit('row_ph', cancelOptions);
            inlineEdit('row_det', cancelOptions);
            inlineEdit('row_reqs', cancelOptions);
            inlineEdit('row_pr', cancelOptions);
        }


        /**
        * Change to a wait cursor
        */
        export function waitCursor() {
            document.body.style.cursor = 'wait';
        }



        /**
        * Change back to normal cursor
        */
        export function normalCursor() {
            document.body.style.cursor = 'default';
        }



        //
        //
        // 
        //
        export function showWaitingModal(msg) {
            let wait_msg = document.getElementById("waiting_label");
            wait_msg.innerText = msg;
            let waiting = document.getElementById("waiting_modal");
            waiting.style.display = "block";
        }



    
    /**
     * CLOSE (ANY) MODAL DIALOG
     */
    function modalClose( force ) {
    
        if (force) errorModalClose();
    
        // close all modal dialogs
        var modals = document.getElementsByClassName("info_modal");
        for (var i = 0; i < modals.length; i++) {
          if (force) {
            modals[i].style.display = "none";
          } else if (!  modals[i].classList.contains("modal_noclose")) {
            modals[i].style.display = "none";
          }
          
        }
      }




    //
    //
    export function successAlert( msg ) {

        var theAlert = document.getElementById("alert_success");
        var newChild = document.createElement("span");
        newChild.textContent = msg;

        if (theAlert.children.length <= 1) {
            theAlert.appendChild(newChild);
        } else {
            theAlert.replaceChild(newChild, theAlert.children[1]);
        }

        theAlert.style.display = "block";
    }






    /**
    * RETURN TRUE IF VALUE IS NOT EMPTY (IS VALID)
    * Failure-resistant way to handle different NO-VALUE values returned from DDB
    */
    export function goodValue( theVal ) {

        // null or 0?
        if (! theVal) return false;

        // there IS a value but it may be '0' or "" string
        if (theVal == '0' || theVal.trim() == "") return false;

        return true;
    }


    /**
    * RETURN TRUE IF VALUE EMPTY (INVALID)
    * Failure-resistant way to handle different NO-VALUE values returned from DDB
    */
    export function noValue( theVal ) {

        // null or undefined?
        if (! theVal) return true;

        // there IS a value but it may be '0' or "" string
        if (theVal == 0 || theVal == '0' || theVal == "") return true;

        return false;
    }



    /**
    * save changes to create form
    * Post new leed to DB
    *
    */
    export async function postLeed( CURRENT_USER, LEED_CHANGES ) {

        if (! EDITING) return;

        endEditing();


        // console.log("POSTING NEW LEED:");
        // console.log(LEED_CHANGES);

        // LEED verification
        //            
        if ( noValue(LEED_CHANGES.tn) ) {
            printError("Add Leed", "Trade must be set");
            errorModal("Error Adding Leed: Trade must be set.", true);
            return;
        }

        
        if ( noValue(LEED_CHANGES.ti) ) {
            printError("Add Leed", "Title must be set");
            errorModal("Error Adding Leed: Title must be set.", true);
            return;
        }


        if ( noValue(LEED_CHANGES.st) ) {
            printError("Add Leed", "Start must be set");
            errorModal("Error Adding Leed: Start must be set.", true);
            return;
        }

        
        if ( noValue(LEED_CHANGES.et) ) {
            printError("Add Leed", "End must be set");
            errorModal("Error Adding Leed: End must be set.", true);
            return;
        }

        if (LEED_CHANGES.st > LEED_CHANGES.et) {
            printError("Add Leed", "Start date must precede end date");
            errorModal("Error Adding Leed: Start date must precede end date.", true);
            return;
        }

        if ( noValue(LEED_CHANGES.lc) ) {
            printError("Add Leed", "Location must be set");
            errorModal("Error Adding Leed: Location must be set.", true);
            return;


        } else {

            // ADDRESS VALIDATE
            // SET THE LEED_CHANGES ZIP HERE
            let the_zip = LEED_CHANGES.lc.slice(-5);


            // NOT A 5-DIGIT NUMBER
            if (! new Number( the_zip ).valueOf()) {

                printError("Add Leed", "zip code not found");
                errorModal("Error Adding Leed: Location must end in 5-digit zip.", true);
                return;

            }   
            LEED_CHANGES.zp = the_zip;
        }


        if ( noValue(LEED_CHANGES.dt) ) {
            printError("Add Leed", "Details must be set");
            errorModal("Error Posting Leed: Some details must be set.", true);
            return;
        }

        if (! LEED_CHANGES.pr) {
            printError("Add Leed", "Price must be set");
            errorModal("Error Adding Leed: Price must be set.", true);
            return;
        }


        waitCursor();
        
        showWaitingModal("Creating new Leed . . .");

        

        //   client <---> API Gateway <===> DB
        //
        //
        let from_DB = null;
        try {
            await createDBLeed( CURRENT_USER, LEED_CHANGES ).then((response) => from_DB = response );

        } catch (error) {
            printError("createDBLeed", error.message)
            errorModal("Error adding leed: " + error.message, false);

        } finally {
            
            normalCursor();
            clearFields();
            modalClose(false);
        }

        console.log(from_DB)
        if (! from_DB) return;


        /**
        * SHOW THE ERROR ALERT
        * will not get here if create throws exception above
        * This is a catch-all for null responses and
        * HTTP 200 codes that contain error messages 
        */
        if (from_DB.er) {
            var msg = "Error adding leed: " + LEED_CHANGES.ti + " : " + from_DB.er;
            printError("Add Leed", msg);
            errorModal(msg, false);


        } else {
            /**
            * SHOW THE SUCCESS ALERT
            *
            *  result = "{'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1}" 
            *            {'id': 15013540,'ti':2222 FairFax Airbrush Title,'pr':55,'cd': 1}
            */
            var msg = 'Leed created [ ' + from_DB.tn + ' ] ' + from_DB.ti;
            console.log(msg);
            successAlert(msg);

        }

    }





    /**
    *
    *
    */
    export async function leed_edit_Save( LEED_CHANGES ) {

        //   client <---> API Gateway <===> DB
        //
        //
        let from_DB = null;
        try {
            await saveLeedChanges(LEED_CHANGES).then((response) => from_DB = response ); 

        } catch ( error ) {
            errorModal("Error saving changes: " + error.message, false);

        } 
        console.log("GOT RESULTS!!!");
        console.log(from_DB)

            /**
             * SHOW THE ERROR ALERT
             */
        if (from_DB.er) {
            var msg = "Error adding leed: " + LEED_CHANGES.ti + " : " + from_DB.er;
            printError("Save Leed Changes", msg);
            errorModal(msg, true);

        } else {
            /**
            * SHOW THE SUCCESS ALERT
            *
            *  result = "{'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1}" 
            *            {'id': 15013540,'ti':2222 FairFax Airbrush Title,'pr':55,'cd': 1}
            */
            var msg = 'Leed Updated: ' + from_DB.ti + '  ( $ ' + from_DB.pr +' )';
            console.log(msg);
            successAlert( msg );
        }
    }



            

    /**
    *
    *
    */
    export async function leed_edit_Delete() {

      
        let from_DB = null;
        try {

            // GO BACK to server and delete leed
            // compliment of add leed

            from_DB = await deleteCurrentLeed();

        } catch ( error ) {
            printError("Delete Leed", error.message);
            errorModal("Error deleting leed: " + error.message, false);

        } 
        
        console.log(from_DB)
        if (! from_DB) return;


        /**
        * SHOW THE ERROR ALERT
        * will not get here if create throws exception above
        * This is a catch-all for null responses and
        * HTTP 200 codes that contain error messages 
        */
        if (from_DB.er) {
            var msg = "Error deleting leed: " + from_DB.er;
            printError("Delete Leed", msg);
            errorModal(msg, false);

        } else {

            /**
            * SHOW THE SUCCESS ALERT
            *
            *  result = "{'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1}" 
            *            {'id': 15013540,'ti':2222 FairFax Airbrush Title,'pr':55,'cd': 1}
            */
            var theAlert = document.getElementById("alert_success");
            var msg = 'Deleted leed:  ' + from_DB.ti + '  ($ ' + from_DB.pr +' )';
            var newChild = document.createElement("span");
            newChild.textContent = msg;

            if (theAlert.children.length <= 1) {
                theAlert.appendChild(newChild);
            } else {
                theAlert.replaceChild(newChild, theAlert.children[1]);
            }

            theAlert.style.display = "block";

        }   

    }



