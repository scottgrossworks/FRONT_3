/**
 * dbTools.js
 * 
 *  
 */

const API_GATEWAY = "http://localhost:3000/"






/**
 * 
 */
export async function toAPIGateway( action ) {


    var theUrl = API_GATEWAY + action;
    return fetch(theUrl, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
    .then(response => response.json())
    .catch(error => {
  
        // handle any errors that occur during parsing
        if (error instanceof SyntaxError) {
            console.error(">>>>>toAPI( SyntaxError )>>", error.message);
        } else {
            console.error(">>>>>toAPI( Error )>>", error.message);    
        }
        return {};
    });

}