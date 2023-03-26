/**
 * dbTools.js
 * 
 *  
 */

const API_GATEWAY = "http://localhost:3000/"

const DEFAULT_TRADES = [
    
    
    
    {
      trade_name: "caricatures",
      total_leedz: 5,

    },
  
  
    
    {
      trade_name: "dancer",
      total_leedz: 3,

    },
  
  
    
    {
      trade_name: "deejay",
      total_leedz: 15,

    },
  
  
  
    
    {
      trade_name: "eeeeeee",
      total_leedz: 3,

    },
  
  
  
    {
      trade_name: "firebreather",
      total_leedz: 12,

    },
  
  
  
  
    
    {
      trade_name: "flame thrower",
      total_leedz: 32,

    },
  
  
  
  
  
    {
      trade_name: "ggggggg",
      total_leedz: 32,

    },
  
  
  
    
    {
      trade_name: "hhhhhhhhh",
      total_leedz: 2,

    },
  
  
    {
      trade_name: "mmmmmm",
      total_leedz: 5,

    },
  
  
  
    
    {
      trade_name: "oooooooooooo",
      total_leedz: 5,

    },
  
  
  
  
    {
      trade_name: "something else",
      total_leedz: 7,
     
    },
  
  
  
    {
      trade_name: "xxxxx",
      total_leedz: 3,

    },
  
    {
      trade_name: "yyyyyyyy",
      total_leedz: 3,
 
    },
  
    
    {
      trade_name: "zzzzzzzzz",
      total_leedz: 3,

    },
  
    
    {
      trade_name: "taco table",
      total_leedz: 5,

    },
  
  
    {
      trade_name: "taco123123 table",
      total_leedz: 5,

    },
  
  
    {
      trade_name: "xx123123xxx",
      total_leedz: 3,

    },
  
    {
      trade_name: "yyy123yyyyy",
      total_leedz: 3,

    },
  
    
    {
      trade_name: "zzzz123zzzzz",
      total_leedz: 3,
   
    },
  
  
    
    {
      trade_name: "to23 678tab",
      total_leedz: 5,

    },
  
  
    {
      trade_name: "xx12312 3678xxx",
      total_leedz: 3,
 
    },
  
    {
      trade_name: "yyy123y 678yyyy",
      total_leedz: 3,
 
    },
  
    
    {
      trade_name: "zz123678zz",
      total_leedz: 3,

    },
  
  
  ];



/**
 * 
 */
export function getAllTrades() {

    let retJSON = DEFAULT_TRADES;

    if(true) return retJSON;
  
    console.error(">>>>>getAllTrades(1) <<<<<<<<<");

      try {
        let fromAPI = toAPIGateway("getTrades");

        if (fromAPI != null) {
            let numResults = Object.keys(fromAPI).length;
            if (numResults > 0) retJSON = fromAPI;
        }

      } catch (error) {

        console.error(">>>>>getAllTrades(error)" + error);

      } finally {

        console.error(">>>>>getAllTrades(finally)" + JSON.stringify(retJSON));
        return retJSON;
      }

}



/**
 * 
 */
function toAPIGateway( action ) {


    var theUrl = API_GATEWAY + action;
    var retData = {};

  
    console.error(">>>>>toAPI(1)>>" + theUrl);

    fetch( theUrl )

    .then(response => response.json())       

    .then(data => {
    
        console.error(">>>>>toAPI(data)>>" + data);
        retData = data;
        
    
        console.error(">>>>>toAPI(returning)>>"  + retData);
        return retData;

    }).catch(error => {
  
        // handle any errors that occur during parsing
          if (error instanceof SyntaxError) {
        console.error(">>>>>toAPI( SyntaxError )>>", error.message);
   
    } else {
        console.error(">>>>>toAPI( Error )>>", error.message);
    }
    });

}