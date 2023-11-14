#
#
#

import boto3
from botocore.exceptions import ClientError


import logging
import math


logger = logging.getLogger()
logger.setLevel(logging.INFO)







# Haversine formula
#
# returns distance between two lat/lon coordinates in MILES
#

def haversine(lat1, lon1, lat2, lon2):
     
     
    # distance between latitudes
    # and longitudes
    dLat = (lat2 - lat1) * math.pi / 180.0
    dLon = (lon2 - lon1) * math.pi / 180.0
 
    # convert to radians
    lat1 = (lat1) * math.pi / 180.0
    lat2 = (lat2) * math.pi / 180.0
 
    # apply formulae
    a = (pow(math.sin(dLat / 2), 2) +
         pow(math.sin(dLon / 2), 2) *
             math.cos(lat1) * math.cos(lat2));
    rad = 6371
    c = 2 * math.asin(math.sqrt(a))
    
    km_result = rad * c
    mi_result = 0.6213711922 * km_result
    
    return mi_result


 



#
# flatten a list to a comma-delimited string
#
def listToString(lst):
    return ', '.join(str(x) for x in lst)
    
    

#
#
#
#
def get_xy_from_loc( loc ):

    
    try:
        location = boto3.client('location')
        response = location.search_place_index_for_text(
            IndexName="Leedz_PlaceIndex",
            FilterCountries=['USA'],
            Text=loc
        )
        
        if ('Results' not in response):
            raise ValueError("No position coordinates found for location: " + loc)
        
        data = response['Results']
        print(data)

        if (len(data) == 0):
             raise ValueError("No position coordinates found for location: " + loc)
     

        lon = data[0]["Place"]["Geometry"]["Point"][0]
        lat = data[0]["Place"]["Geometry"]["Point"][1]
        
        return [lon, lat]        

        

    except ClientError as error :
        logger.error("Error in Location Service: " + str(error))
        raise
    
            


#
#
#
#
def handle_error(error):
       
    msg = str(error)   
    logger.error(msg)
    return msg
    
    
    
    
#   
# will throw ValueError
#
#
def validateParam( event, param, required ):
    
    if ('queryStringParameters' not in event):
        raise ValueError("HTTP Request error.  No query string parameters")
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value





#
#
# 
#
#
#
#
def searchForLeedz(sb, st, et, zp, zr):


    dynamodb_client = boto3.resource("dynamodb")
    table = dynamodb_client.Table('Leedz_DB')

    start_time = int(st)
    end_time = int(et)

    zip_home = int(zp)
    zip_radius = int(zr)
    
    if zp: 
        home_xy = get_xy_from_loc(zp)

    
    results = []

    # FOR EACH TRADE SUBSCRIPTION
    for sub in sb:

        pk = "leed#" + sub
        
        print("PK=" + pk)

        # query for all the leedz matching that trade
        # whose start time is between st and et
        fromDB = table.query(
                KeyConditionExpression='pk=:pk',
                FilterExpression='st between :st and :et',
                ExpressionAttributeValues={
                    ':pk': pk,
                    ':st': start_time,
                    ':et': end_time,
                }
         )
        
     
        if ('Items' not in fromDB):
            raise ValueError("Server Error: GetLeedz query received empty response")
     
        for each_leed in fromDB['Items']:
            
            
            # preselect all the leedz whose zip matches zip_home
            if (zip_home) :
                
                if (each_leed['zp'] == zip_home) :
                    results.append( each_leed )
            
                else :
                    # get the xy coords from the leed location
                    leed_loc = get_xy_from_loc( each_leed['lc'] )
                    
                    # run leed through Haversine to see if it falls within zip radius of zp
                    # careful -- haversine expects lat, long 
                    miles_from = haversine(home_xy[1], home_xy[0], leed_loc[1], leed_loc[0])
                      
                    print("LEED ZIP=" + str(each_leed['zp']))  
                    print("MILES FROM=" + str(miles_from))
                    
                    
                    if (miles_from <= zip_radius):
                        results.append(each_leed)
            
            
            else:
                # no search radius set -- return all results matching trade
                results.append(each_leed)
                


    
    return results

    
    
    
    
    




    
    
    
#   
# 
#
#
#
        
def lambda_handler(event, context):


    result = ""
    try:
        
     
        true = 1
        false = 0
        
        
        # TRADE SUBSCRIPTIONS - REQUIRED
        #
        sb = validateParam(event, 'sb', true)
        
        # START TIME - REQUIRED
        st = validateParam(event, 'st', true)
        
        # END TIME - REQUIRED
        et = validateParam(event, 'et', true)
        
        
        # ZIP HOME - OPTIONAL
        # SEARCH RADIUS - OPTIONAL
        # 
        zp = validateParam(event, 'zp', false)
        zr = validateParam(event, 'zr', false)
        

        result = searchForLeedz(sb, st, et, zp, zr)

    
    
    except ValueError as e:
        result = handle_error(e)
        

    except ClientError as e:

        result = handle_error(e)
     
    
    except BaseException as e:
        
        result = handle_error(e)

 
    return createHttpResponse( result )



 
 
 
#
# Create the HTTP response object
#
#
def createHttpResponse( result ):
   
    response = {
        'statusCode': 200,
        'body': result,
        'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
            },
    }

    return response

