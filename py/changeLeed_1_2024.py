#
# CHANGE LEED
#
#
#

import boto3
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

import random

from decimal import Decimal

import json

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
#
#
# SUCCESS!
# simplify return value
# {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1} 
# {'er': " + err_str + ",'cd': 0} 
#
def handle_error(error):
       
    err_str = str(error)
    logger.error(err_str)

    result = "{'er': " + err_str + ",'cd': 0}" 
    
    return result
    
 
 
 

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
# 
#
# 
def changeLeed(update_expr, attr_vals, tn, id):

    
    dynamodb_client = boto3.resource("dynamodb")
    table = dynamodb_client.Table('Leedz_DB')
  

    pk = "leed#" + tn
    response = []
    
    # logger.info("CHANGE LEED ID=" + id)
    
    try:
            
        response = table.update_item(
            Key={
                'pk': pk,
                'sk': id,
            },
            ConditionExpression='attribute_exists(sk)',
            UpdateExpression= update_expr,
            ExpressionAttributeValues= attr_vals,
            ReturnValues='ALL_NEW'
        )
        
        
        if 'Attributes' not in response :
        
            logger.error("DB Error: No Attributes Updated: " + response)
            raise ValueError('DB Error:  Cannot change ' + tn + ' leed: ' + id)
        
        
    
    
    except ClientError as err:
    
        if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
            msg = 'DB Error: ' + tn + ' leed not found: ' + id
            logger.error( msg )
            response = msg
            
        else:
            response = handle_error(err)
    
    except Exception as error:
        
        logger.error("Change Leed: " + str(error))
        response = handle_error(error)
  
  

    return response['Attributes']
    
    
    
    
    
    
#   
# 
#
#
#
        
def lambda_handler(event, context):

    result = ""
    true = 1
    false = 0
    
    
    try:
        
        
        # TRADE NAME - REQUIRED
        # 11/1/23 CANNOT CHANGE 
        #
        tn = validateParam(event, 'tn', true)
        
        update_expr = 'SET'
        attr_vals = {}
        
        
        # ID - REQUIRED
        # DOESN'T CHANGE
        # 
        id = validateParam(event, 'id', true)

   
        
        # TITLE
        ti = ""
        if ('ti' in event['queryStringParameters']):
            ti = event['queryStringParameters']['ti']
            update_expr += ' ti=:ti,'
            attr_vals[':ti'] = ti      
        
        
        
        # EMAIL
        if ('em' in event['queryStringParameters']):
            em = event['queryStringParameters']['em']
            update_expr += ' em=:em,'
            attr_vals[':em'] = em
        

   
        # PHONE
        if ('ph' in event['queryStringParameters']):
            ph = event['queryStringParameters']['ph']
            update_expr += ' ph=:ph,'
            attr_vals[':ph'] = ph
            
            

        
        # if lc is set
        # zip must also be set
        #
        # XY
        # lat,lng
        # COMPUTE FROM LOCATION DATA
        # 
        # ADDRESS VALIDATION
        #
        lc = validateParam(event, 'lc', false)
        if lc:
            
            update_expr += ' lc=:lc,'
            attr_vals[':lc'] = lc
            
            locationAPI = boto3.client('location')
            
            # this will validate the address and throw Errors
            loc_info = getLocationInfo( locationAPI, lc )
            zip_coords = loc_info['Point']
            
            xy = listToString(zip_coords)
            update_expr += ' xy=:xy,'
            attr_vals[':xy'] = xy
            
            # zip also required -- not user generated
            # will throw error
            zp = validateParam(event, 'zp', true)
            update_expr += ' zp=:zp,'
            attr_vals[':zp'] = zp

            
        
        
        
        # START TIME
        # 
        if ('st' in event['queryStringParameters']):
            st = event['queryStringParameters']['st']
            update_expr += ' st=:st,'
            attr_vals[':st'] = int(st)
        
   
        # END TIME 
        # 
        if ('et' in event['queryStringParameters']):
            et = event['queryStringParameters']['et']
            update_expr += ' et=:et,'
            attr_vals[':et'] = int(et)
        

        # DETAILS 
        # 
        if ('dt' in event['queryStringParameters']):
            dt = event['queryStringParameters']['dt']
            update_expr += ' dt=:dt,'
            attr_vals[':dt'] = dt

        
        
        # REQS
        #
        if ('rq' in event['queryStringParameters']):
            rq = event['queryStringParameters']['rq']
            update_expr += ' rq=:rq,'
            attr_vals[':rq'] = rq


   
        # PRICE
        #
        pr = 0
        if ('pr' in event['queryStringParameters']):
            pr = event['queryStringParameters']['pr']
            update_expr += ' pr=:pr,'
            attr_vals[':pr'] = pr


         
   
        # OPTIONS
        #
        if ('op' in event['queryStringParameters']):
            op = event['queryStringParameters']['op']
            update_expr += ' op=:op,'
            attr_vals[':op'] = op
         
        
        
        # REMOVE THE LAST TRAILING CHAR
        update_expr = update_expr.rstrip(update_expr[-1])
        
        
        #
        # WILL THROW ERROR
        the_leed = changeLeed(update_expr, attr_vals, tn, id)
        # logger.info(the_leed)
        
        # SUCCESS!
        # simplify return value
        result = {}
        result['id'] = id
        result['tn'] = tn
        result['ti'] = the_leed['ti']
        result['pr'] = the_leed['pr']
        result['cd'] = 1
        
                 
    #
    # ERROR HANDLING
    #
    except ClientError as error:
        result = handle_error(error)
    
    except BaseException as error:
        result = handle_error(error)



    #
    # JSON-encode the result
    #
    the_json = json.dumps(result, cls=DecimalJsonEncoder)

    return createHttpResponse( the_json )







# json.dumps(some_object, cls=DecimalEncoder)
    
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

    #logger.info("RETURNING JSON")
    logger.info(result)
    
    return response
