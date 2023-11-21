/**
 * dbTools.js
 * 
 *  
 */




import { printError, throwError } from "./error.js";



export const API_GATEWAY = "https://jjz8op6uy4.execute-api.us-west-2.amazonaws.com/Leedz_Stage_1/";

export const USERNAME_URL_PARAM = "un";

export const ID_URL_PARAM = "id";
export const ABOUT_URL_PARAM = "ab";
export const EMAIL_URL_PARAM = "em";
export const WEBSITE_URL_PARAM = "ws";
export const SUBS_URL_PARAM = "sb";

export const START_TIME_URL_PARAM = "st";
export const END_TIME_URL_PARAM = "et";

export const ZIP_HOME_URL_PARAM = "zp";
export const ZIP_RADIUS_URL_PARAM = "zr";

export const TRADE_NAME_URL_PARAM = "tn";
export const TITLE_URL_PARAM = "ti";
export const LOCATION_URL_PARAM = "lc";
export const DETAILS_URL_PARAM = "dt";
export const REQS_URL_PARAM = "rq";
export const PHONE_URL_PARAM = "ph";

export const CREATOR_URL_PARAM = "cr";
export const PRICE_URL_PARAM = "pr";
export const OPTIONS_URL_PARAM = "op";
export const LEED_ID_URL_PARAM = "id";


export const DB_FAIL = 0;
export const DB_SUCCESS = 1;
// 2
export const DEL_USER = 3;
export const CHG_USER = 4;

export const ADD_LEED = 7;
export const BUY_LEED = 8;
export const DEL_LEED = 9;
export const CHG_LEED = 10;
export const REP_LEED = 11;






/**
 * 
 * 
 */
export async function db_updateUser( code, user_obj ) { 
    
    let json_obj = null;

    switch (code) {

        case DEL_USER:
            console.log("dbTools.db_updateUser() DEL_USER"); 
            break
        
        case CHG_USER:
            console.log("dbTools.db_updateUser() CHG_USER"); 
        
            
            let theURL = new URL(API_GATEWAY + "changeUser");
            let params = new URLSearchParams();
            params.append( USERNAME_URL_PARAM, user_obj.un );
            params.append( EMAIL_URL_PARAM, user_obj.em );
            params.append( WEBSITE_URL_PARAM, user_obj.ws );
            params.append( ABOUT_URL_PARAM, user_obj.ab );
            params.append( ZIP_HOME_URL_PARAM, user_obj.zp );
            params.append( ZIP_RADIUS_URL_PARAM, user_obj.zr );
            params.append( SUBS_URL_PARAM, user_obj.sb );

            theURL.search = params.toString();
            
            await doGet( theURL )
            .then(data => {
    
              json_obj = data;
    
            })
            .catch(error => {
    
              printError("Get User", error);
              throwError(error.src, "User not found: " + user_obj.un);
            });
    

            //console.log("CHANGE USER DONE");
            //console.log(json_obj);

            break

        default:
            throwError("db_updateUser", "Uknown code received: " + code);
    }



    return json_obj;
}







/**
 * 
 * 
 */


export async function db_updateLeed( code, user_obj, leed_obj ) { 
    
    let json_obj = [];

    switch (code) {



    
        /**
         * ADD LEED
         * 
         */
        case ADD_LEED:
       
            var theURL = new URL(API_GATEWAY + "addLeed");
            var params = new URLSearchParams();

            // from user obj
            params.append( CREATOR_URL_PARAM, user_obj.un );

            // leed_obj
            params.append( TRADE_NAME_URL_PARAM, leed_obj.tn );

            params.append( TITLE_URL_PARAM, leed_obj.ti );

            params.append( LOCATION_URL_PARAM, leed_obj.lc );

            params.append( ZIP_HOME_URL_PARAM, leed_obj.zp );

            params.append( START_TIME_URL_PARAM, leed_obj.st );

            if (leed_obj.et) params.append( END_TIME_URL_PARAM, leed_obj.et );
            
            if (leed_obj.dt) params.append( DETAILS_URL_PARAM, leed_obj.dt );

            if (leed_obj.rq) params.append( REQS_URL_PARAM, leed_obj.rq );

            if (leed_obj.ph) params.append( PHONE_URL_PARAM, leed_obj.ph );

            if (leed_obj.em) params.append( EMAIL_URL_PARAM, leed_obj.em );
            
            params.append( PRICE_URL_PARAM, leed_obj.pr );
        
            params.append( OPTIONS_URL_PARAM, leed_obj.op );

            theURL.search = params.toString();

            
            await doGet( theURL )
            .then(data => {

                json_obj = data;

            })
            .catch(error => {
                printError("Add Leed", error);
                throwError("Add Leed", error);
            });

            break;



        /**
         * BUY LEED
         * 
         */
        case BUY_LEED:
            
            console.log("dbTools.db_updateLeed() BUY LEED"); 
            var theURL = new URL(API_GATEWAY + "buyLeed");
            var params = new URLSearchParams();

            // from user obj
            params.append( USERNAME_URL_PARAM, user_obj.un );

            params.append( TRADE_NAME_URL_PARAM, leed_obj.tn);
            params.append( ID_URL_PARAM, leed_obj.id );

            theURL.search = params.toString();

            await doGet( theURL )
            .then(data => {

                json_obj = data;

            })
            .catch(error => {
                printError("Delete Leed", error);
                throwError("Delete Leed", error);
            });

            break;
        




        /**
         * DELETE LEED
         * 
         */
        case DEL_LEED:

            var theURL = new URL(API_GATEWAY + "delLeed");
            var params = new URLSearchParams();

            params.append( TRADE_NAME_URL_PARAM, leed_obj.tn);
            params.append( ID_URL_PARAM, leed_obj.id );

            theURL.search = params.toString();

            await doGet( theURL )
            .then(data => {

                json_obj = data;

            })
            .catch(error => {
                printError("Delete Leed", error);
                throwError("Delete Leed", error);
            });

            break;
        





        /**
         * CHANGE LEED
         * 
         */
        case CHG_LEED:

            var theURL = new URL(API_GATEWAY + "changeLeed");
            var params = new URLSearchParams();

            params.append( ID_URL_PARAM, leed_obj.id );

            if (leed_obj.tn) params.append( TRADE_NAME_URL_PARAM, leed_obj.tn );

            if (leed_obj.ti) params.append( TITLE_URL_PARAM, leed_obj.ti );

            if (leed_obj.lc) params.append( LOCATION_URL_PARAM, leed_obj.lc );

            if (leed_obj.zp) params.append( ZIP_HOME_URL_PARAM, leed_obj.zp );

            if (leed_obj.et) params.append( START_TIME_URL_PARAM, leed_obj.st );

            if (leed_obj.et) params.append( END_TIME_URL_PARAM, leed_obj.et );
            
            if (leed_obj.dt) params.append( DETAILS_URL_PARAM, leed_obj.dt );

            if (leed_obj.rq) params.append( REQS_URL_PARAM, leed_obj.rq );

            if (leed_obj.ph) params.append( PHONE_URL_PARAM, leed_obj.ph );

            if (leed_obj.em) params.append( EMAIL_URL_PARAM, leed_obj.em );

            // from user obj
            if (leed_obj.un) params.append( CREATOR_URL_PARAM, user_obj.un );
            
            if (leed_obj.pr) params.append( PRICE_URL_PARAM, leed_obj.pr );
        
            if (leed_obj.op) params.append( OPTIONS_URL_PARAM, leed_obj.op );

            theURL.search = params.toString();

            console.log("THEURL=" + theURL);

            await doGet( theURL )
            .then(data => {

                json_obj = data;

            })
            .catch(error => {

                printError("Change Leed", error);
                throwError("Change Leed", error);
            });

            break;
        




        /**
         * REPORT LEED
         * 
         */
        case REP_LEED:
            console.log("dbTools.db_updateLeed() REPORT LEED"); 
            
            var theURL = new URL(API_GATEWAY + "reportLeed");
            var params = new URLSearchParams();

            params.append( TRADE_NAME_URL_PARAM, leed_obj.tn );
            params.append( ID_URL_PARAM, leed_obj.id );
            params.append( USERNAME_URL_PARAM, user_obj.un );

            theURL.search = params.toString();

            console.log("THEURL=" + theURL);

            await doGet( theURL )
            .then(data => {

                json_obj = data;

            })
            .catch(error => {

                printError("Change Leed", error);
                throwError("Change Leed", error);
            });

            break;




        default:
            throwError("db_updateUser", "Uknown code received: " + code);
    }


    return json_obj;
}






/**
 * returns JSON list [ { key = "value" }, { key = "value" }, ... ] object
 * 
 * 
 */
export async function db_getTrades() {

    let json_obj = null;
    
    try {

        const theURL = new URL(API_GATEWAY + "getTrades");
        let json_obj= null;
          
        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });



        return json_obj;

    } catch (error) {
        throwError( error );

    }

    // should NOT be NULL
    return json_obj;

}





/**
 * returns JSON user object
 * 
 * 
 */
export async function db_getUser( username ) {
    
    if (username == null) {
        throwError("db_getUser()", "no username provided");
    }
    let json_obj = null;

    try {

        const theURL = new URL(API_GATEWAY + "getUser");
        const params = new URLSearchParams({ [USERNAME_URL_PARAM]: username });
        theURL.search = params.toString();
        
        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {

          printError("Get User", error);
          throwError(error.src, "User not found: " + username);
        });



    } catch (error) {
        throwError(error.src, error.message);
    }

    // SHOULD NOT BE NULL
    // or would have thrown error above

    return json_obj;
}    






/**
 * GET DEETZ
 * Get the full leed details for this leed
 * 
 * 
 */
export async function db_getDeetz( trade_name, leed_id, leed_op ) {
    
    // GET JSON from http server

    // console.log("GET DEETZ: " + trade_name + " ID=" + leed_id);

    let json_obj = null;
    try {
    
        const theURL = new URL(API_GATEWAY + "getDeetz");
        let searchParams = new URLSearchParams();
        searchParams.append( TRADE_NAME_URL_PARAM, trade_name );
        searchParams.append( LEED_ID_URL_PARAM, leed_id );
        searchParams.append( OPTIONS_URL_PARAM, leed_op );
        
        theURL.search = searchParams.toString();


        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });

    
    } catch (error) {
        printError("db_getDeetz()", error);
        throwError("db_getDeetz()", error);
    }


    
    
    console.log("GOT --- DETAILS --- JSON!!!");
    console.log(json_obj);


    return json_obj;  // SHOULD NOT BE NULL


}




/**
 * 
 * 
 */
export async function db_getLeedz( subs, start_date, end_date, zip_home, zip_radius ) {

    if (subs == null || start_date == null || end_date == null ) {
        throwError("db_getLeedz()", "null / undefined args");
    }

    console.error("DB GET LEEDZ!!!!");
    

    // SUBS
    // trades subscriptions will be a comma,delimited,string
    //
    let subs_string = "";
    for (const trade_name of subs) {
        subs_string += trade_name + ",";
    }
    subs_string = subs_string.slice(0, -1);

    let json_obj = null;

    try {

        const theURL = new URL(API_GATEWAY + "getLeedz");
        let searchParams = new URLSearchParams();
        searchParams.append( START_TIME_URL_PARAM, start_date );
        searchParams.append( END_TIME_URL_PARAM, end_date );
        searchParams.append( ZIP_HOME_URL_PARAM, zip_home );
        searchParams.append( ZIP_RADIUS_URL_PARAM, zip_radius );
        searchParams.append( SUBS_URL_PARAM, subs_string );

        theURL.search = searchParams.toString();


        // console.log(theURL.search)


        await doGet( theURL )
        .then(data => {

          json_obj = data;

        })
        .catch(error => {
          printError("doGet()", error);
          throwError('doGet()', 'There was a problem with the fetch operation:' + error.message);
        });


        if (json_obj.er)
            throwError("Get Leedz", json_obj.cd);


    } catch (error) {
        printError("Get Leedz", error);
        throwError("Get Leedz", error.message);
    }


    
    console.log("GOT --- PREVIEW --- JSON!!!");
    console.log(json_obj);


    return json_obj;  // SHOULD NOT BE NULL
}
















/**
 * 
 * 
 * 
 * 
 * 
 * 
 *
 */
async function doGet( theURL ) {

    console.log("---------> DOGET URL=" + theURL);


    return fetch(theURL,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Connection':'close'
            },
        timeout:"8000"
        }
    ).then(response => {

        if (! response.ok) { 
            console.log(response);
            throw new Error('Network response was not OK: [' + response.status + "] :" + response.message);
        }

        let the_json = null;
        
        // DECODE THE JSON
        try {   
            the_json = response.json();
        
        } catch (err) {
            throwError("JSON", err.message);
        }


        if (response.status == 200) {

            // SUCCESS!
            // console.log(the_json);
            return the_json;


        } else if (response.status == 204) {

            throw new Error( the_json.er );

        } else {

            var the_code = "Error code received from server: " + response.status;
            var the_msg = "<BR>Error message: " + the_json.er;
            throw new Error( the_code + the_msg );
        }
    }
    ).catch(error => {
        printError( "HTTP GET", error.message );
        throwError( error.status, error.message );
    });

}
      



/**
 * 
 *
 */
async function doPost( theURL, params ) {

    return fetch(theURL,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Connection':'close'
            },
        timeout:"4000",
        body:params
        }
    ).then(response => {
    
        if (! response.ok) {
           throw new Error('Network response was not ok');
        }
        
        return response.json();
    })
    .catch(error => {
        printError("fetch", error);
        throwError("fetch", error);
    });
}