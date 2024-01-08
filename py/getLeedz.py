#
# GET LEEDZ
#
#
#

import boto3
from botocore.exceptions import ClientError

import json
import json.encoder

import logging
import math

from decimal import Decimal





logger = logging.getLogger()
logger.setLevel(logging.INFO)




 
#
# Use this to JSON encode the DYNAMODB output
#
#


def encode_fakestr(func):
    def wrap(s):
        if isinstance(s, fakestr):
            return repr(s)
        return func(s)
    return wrap


json.encoder.encode_basestring = encode_fakestr(json.encoder.encode_basestring)
json.encoder.encode_basestring_ascii = encode_fakestr(json.encoder.encode_basestring_ascii)

class fakestr(str):
    def __init__(self, value):
        self._value = value
    def __repr__(self):
        return str(self._value)


class DecimalJsonEncoder(json.encoder.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return fakestr(o)
        return super().default(o)






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
def handle_error( msg ):
       
    logger.error(msg)

    ret_obj = { "cd" : 0,
                "er" : msg }

    return ret_obj
    
    
    
    
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
        if (value == 'null'):
            value = ""
        elif (value == '0'):
            value = 0

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
    trades = sb.split(',')
   
   
    # will use this below
    #
    home_xy = ""
    zip_home = 0
    zip_radius = 0
    if (zp):
        zip_home = int(zp)
        # get lon/lat coordinates for zip home
        home_xy = get_xy_from_loc(zp)
        if (zr):
            zip_radius = int(zr)
            
                    
    results = []

    # FOR EACH TRADE SUBSCRIPTION
    for sub in trades:
        
        pk = "leed#" + sub
        
        # query for all the leedz matching that trade
        # whose start time is between st and et
        # AND date bought == 0
        
        fromDB = table.query(
                    ProjectionExpression='pk,sk,st,et,zp,lc,ti,cr,op,db', 
                    KeyConditionExpression='pk=:pk',
                    FilterExpression='(st between :st and :et) AND (db = :zero)',
                    ExpressionAttributeValues={
                        ':pk': pk,
                        ':st': start_time,
                        ':et': end_time,
                        ':zero': 0
                }
         )

        # logger.info(fromDB['Items'])

        if ('Items' not in fromDB):
            raise ValueError("Server Error: GetLeedz query received empty response")
     
        
        # SOME data is returned - must be filtered
        for each_leed in fromDB['Items']:
            
            # is a search zip code set?
            if (zp) :
                # is there an exact hit on zip code?
                if (each_leed['zp'] == zip_home) :
                    # do not send back location data in preview
                    del each_leed['lc']
                    results.append( each_leed )
                    continue
                    
                # look for zip home / search radius match using haversine
                elif (zr) :
                    # get the xy coords from the leed location
                    leed_loc = get_xy_from_loc( each_leed['lc'] )
                    
                    # run leed through Haversine to see if it falls within zip radius of zp
                    # careful -- haversine expects lat, long 
                    miles_from = haversine(home_xy[1], home_xy[0], leed_loc[1], leed_loc[0])
             
                    # does the leed fall within the search circle
                    if (miles_from <= zip_radius):
                        # do not send back location data in preview
                        del each_leed['lc']
                        results.append(each_leed)
                        continue
                    
                    # ELSE... do not include the leed in results
            
            else:
                # no zip_home / search radius set -- return all results matching trade
                  # do not send back location data in preview
                del each_leed['lc']
                results.append(each_leed)
                continue
          
            

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
                  
        # logger.info(result)
        
        
    except ValueError as ve:
        
        result = handle_error( str(ve) )
        

    except ClientError as ce:

        result = handle_error( str(ce) )
     
    
    except BaseException as be:
        
        result = handle_error( str(be) )


    except Exception as e:
        
        result = handle_error( str(e) )
        
        
    finally:    
        
        the_json = json.dumps(result, cls=DecimalJsonEncoder)
        return createHttpResponse( the_json )




    
#
# Create the HTTP response object
#
#
def createHttpResponse( result ):
   
    response = {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
        },
        'body': result,
    }


    # logger.info("GET LEEDZ")
    # logger.info(response)
    
    
    return response

