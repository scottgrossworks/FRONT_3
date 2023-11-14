#
# ADD LEED
#
#

import json
import boto3
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from decimal import Decimal

import random
import logging



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











#
# SUCCESS
# {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': '1'} 
# ERROR
# {'er': " + err_str + ",'cd': '0'}
#
def handle_error(error):
       
    # create a dictionary with error details
    err_str = str(error)
    logger.error(err_str)

    ret_obj = {
        'er':err_str,
        'cd':0
    }
    return ret_obj
    
    
    
 
#
# return int value or zero if val is ""
#
def intOrZero( val ):

    try:
        if (val):
            return int(val)
        else:
            return 0
    

    except error:
        logger.error("Cannot convert value to int: " + val)
        throw





#
# flatten a list to a comma-delimited string
#
def listToString(lst):
    return ', '.join(str(x) for x in lst)



#
#
#
def getLocationInfo( locationAPI , lc ):
    
    
    response = locationAPI.search_place_index_for_text(
            IndexName="Leedz_PlaceIndex",
            FilterCountries= ["USA"],
            Text=lc
            )
                

    # if any of these are null throw an error
    if 'Results' not in response:
        raise ValueError("Location Service cannot resolve location:" + lc)
    
    if 'Place' not in response['Results'][0]:
        raise ValueError("Location Service cannot resolve location:" + lc)
   
    place = response['Results'][0]['Place']
    location = place['Geometry']
   
    return location
            
     
     

    
    
    
#
# matching leed will have
# == tn    trade name
# == lc    location x,y
# == st    start time
# == et    end time if provided
#
# will throw Error if check succeeds
#
def checkForExistingLeed( table, tn, lc, xy, st, et ):
    
    response = {}
    
    logger.info("CHECK tn=" + tn + " lc=" + lc + " st=" + st + " et=" + et)
    
    try:
                
        start_date =int(st)
        pk = "leed#" + tn


        #
        # for each leed in GSI
        #   is the address a match against xy?
        #   is the trade a match against tn?
        #
        # VALID LEEDS:  et < leed(st)  OR  st > leed(et)
        #
        #
        # leed:       1PM-----4PM
        #       st-et 
        #
        # leed:       1PM-----4PM
        #                         st-et
        #
        #
        #
        # WHAT WE WANT TO FIND:
        #
        #            1PM------4PM
        #
        #            st--------et
        #          s_d          e_d
        #
        #            st--------et
        #          s_d----e_d
        #
        
        #            st--------et
        #   s_d--e_d
        
        
        #            st--------et
        #               s_d-e_d
        #
        #            st--------et
        #                 s_d----e_d         
        #

        #            st--------et
        #                         s_d--e_d

        if et :
            end_date = int(et)
            
            response = table.query(
                IndexName='GSI_Loc',
                KeyConditionExpression="pk = :pk AND xy = :xy",
                ExpressionAttributeValues={
                    ':pk':pk,
                    ':xy':xy,
                    ':start_date':start_date,
                    ':end_date':end_date
                },
                FilterExpression="(st > :start_date AND st > :end_date) OR (et < :end_date AND et <= :start_date)" 
            )
            
        # check against start time only
        else :
            response = table.query(
                IndexName='GSI_Loc',
                KeyConditionExpression="pk = :pk AND xy = :xy",
                ExpressionAttributeValues={
                    ':pk':pk,
                    ':xy':xy,
                    ':start_date':start_date
      
                },
                FilterExpression="st = :start_date"
            )
    
    
    except ClientError as err:
            logger.error(
                "Error searching for matching leed %s: %s: %s",
                tn, err.response['Error']['Code'], err.response['Error']['Message'])
            raise
  
  
    logger.info(response)
  
    if "Items" in response:
        if (len(response["Items"]) != 0):
            msg = tn + " leed already exists for " + str(lc) + " at this date and time" 
            raise ValueError( msg )

    
    
    
    
    
    
    
#   
# will throw ValueError
#
#
def validateParam( event, param, required ):
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value






#
# Each TRADE has a leed counter 
# will throw error
#
def incrementLeedCounter(table, tn):
    
    # update the num_leedz for this trade
    #
    try:
        response = table.update_item(
                Key={ 'pk': 'trade', 'sk': tn },
                UpdateExpression="SET nl = nl + :inc",
                ExpressionAttributeValues={ ":inc": 1 },
                ConditionExpression='attribute_exists(sk)'
            )
        
        return response
    
    
    except ClientError as err:
        
        logger.error("Couldn't increment leed counter for trade %s: %s: %s", tn, err.response['Error']['Code'], err.response['Error']['Message'])
        raise


        
        
        
        
        

#   
# 
#
#
def addLeed(table, tn, ti, lc, zp, xy, st, et, dt, rq, ph, em, cr, pr, op):
      
      
    
    # RANDOMLY GENERATE ID -- 8 digit integer
    # WILL CHECK FOR DUPS
    id = str( random.getrandbits(24) )
    # id must be unique
    
    # PRIMARY KEY
    # leed#trade_name
    pk = 'leed#' + tn
    
    response = ""
    
    try:
        
        start_time = int(st)
        end_time = intOrZero(et)
        zip_code = int(zp)
        phone = intOrZero(ph)
        price = intOrZero(pr)
        
        # TODO 10/12/23
        # DOES NOT check if tn - tradename is a valid, existing trade
        # assume that is done on the client
        
        response = table.put_item(
            Item={
                'pk': pk,
                'sk': id,
                'ti': ti,
                'lc': lc,
                'zp': zip_code,
                'xy': xy,
                'st': start_time,
                'et': end_time,
                'dt': dt,
                'rq': rq,
                'ph': phone,
                'em': em,
                'cr': cr,
                'pr': price,
                'op': op
                },
            Expected={
                'sk': { 'Exists': False }
            },
            ReturnValues='NONE',
        )


    
    
    # no return value -- if it succeeds, return the new id
    # otherwise will throw error

    except ClientError as err:
        
     
        if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
            # LEED ID ALREADY EXISTS
            # CALL RECURSIVELY
            logger.error(err)
            return addLeed(table, tn, ti, lc, zp, xy, st, et, dt, rq, ph, em, cr, pr, op)
     
     
        else:    
            logger.error(
            "Couldn't add leed %s, %s: %s: %s", id, tn, err.response['Error']['Code'], err.response['Error']['Message'])
            raise
    
    
    # unique new id for leed
    return id
    
    
    
    
    
#   
# 
#
#
#
        
def lambda_handler(event, context):


    
    the_json = ""
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        true = 1
        false = 0
        
        
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', true)
        
        
   
        # TITLE - REQUIRED
        #
        ti = validateParam(event, 'ti', true)
        
        
        
        # LEED CREATOR - REQUIRED
        #
        cr = validateParam(event, 'cr', true)



        # EMAIL - OPTIONAL
        #
        em = validateParam(event, 'em', false)
        

   
        # PHONE - OPTIONAL
        #
        ph = validateParam(event, 'ph', false)

    
        # LOCATION - REQUIRED
        #
        lc = validateParam(event, 'lc', true)

        
        # ZIP - REQUIRED
        # 
        zp = validateParam(event, 'zp', true)


        # Another validation
        #
        if (not lc.endswith(zp)) :
            raise ValueError("HTTP Request error.  Zip code [" + zp + "] does not match location: " + lc)
            

        # XY
        # lat,lng
        # COMPUTE FROM LOCATION DATA
        # 
        # ADDRESS VALIDATION
        #
        locationAPI = boto3.client('location')
        
        
        # this will validate the address and throw Errors
        loc_info = getLocationInfo( locationAPI, lc )
        zip_coords = loc_info['Point']
        
        
        xy = listToString(zip_coords)
        
        
        
        # START TIME - REQUIRED
        #
        st = validateParam(event, 'st', true)
   
        
        
        # END TIME - OPTIONAL
        #
        et = validateParam(event, 'et', false)

        
        #
        # Is there an existing leed with the same address and start time?
        #
        # xy == xy
        # st in between st and et
        # tn == tn
        #
        # will throw error if match found
        checkForExistingLeed(table, tn, lc, xy, st, et)
        
        
        
        
        # DETAILS - OPTIONAL
        #
        dt = validateParam(event, 'dt', false)

        
        # REQS - OPTIONAL
        #
        rq = validateParam(event, 'rq', false)

         
        # PRICE - REQUIRED
        #
        pr = validateParam(event, 'pr', true)
         
        
        # OPTIONS - REQUIRED
        #
        op = validateParam(event, 'op', true)
         
        
        
        # increment leed counter on trade
        # 
        incrementLeedCounter(table, tn)
        
        
        
        # id will be generated in addLeed      
        # will call itself recursively until unique id created and leed added
        # or fail with exception
        #
        id = addLeed(table, tn, ti, lc, zp, xy, st, et, dt, rq, ph, em, cr, pr, op)
        
        
        # SUCCESS
        # {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': '1'} 
        #
   
        
        
        ret_obj = {
            'id':id,
            'ti':ti,
            'tn':tn,
            'pr':pr,
            'cd':1
        }
        
         
        the_json = json.dumps( ret_obj, cls=DecimalJsonEncoder )
        
                 
    #
    # ERROR HANDLING
    #
    except ClientError as error:

        
        if error.response['Error']['Code'] == 'ValidationException' or error.response['Error']['Code'] == 'ConditionalCheckFailedException':
            # one or more attribute fields doesn't match DB config
            msg = "Error updating trade '" + tn + "': Is this a valid trade name?"
            result = handle_error(msg)
            
        else :
            result = handle_error(error)
        
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
    
     
    except ValueError as error:
        
        result = handle_error(error)
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
        
    
    
    except BaseException as error:
        
        result = handle_error(error)
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
       
    

    return createHttpResponse( 200, the_json )


    
    
 
#
# Create the HTTP response object
#
#
def createHttpResponse( code, result ):
   
    response = {
        'statusCode': code,
        'body': result,
        'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
            },
    }

    logger.info(response)
    return response





