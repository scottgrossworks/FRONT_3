#
# REPORT LEED
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
# will throw ValueError
#
#
def reportLeed( table, tn, id, un ):
    
    pk = "leed#" + tn
    
    try:
        response = table.get_item(
            Key={'pk': pk, 'sk': id}
        )
        
        logger.info("GOT RESPONSE!")
        logger.info(response['Item'])
        
        
        if ('Item' not in response):
            msg = "Leed not found [" + tn + "] " + id
            logger.error(msg)
            result = msg
        
        else:
            result = response['Item']
        
    
    except ClientError as err:
        
        msg = "Couldn't get details [" + tn + "] " + id
        logger.error(msg)
        throw
    

    
    return result
        
  
        
    
    
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
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')


        
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', true)
        
        
        # ID - REQUIRED
        # 
        id = validateParam(event, 'id', true)

        
        # UN -- REQUIRED
        # WHO IS REPORTING THIS LEED?
        # 
        un = validateParam(event, 'un', true)
        
        #
        # WILL THROW ERROR
        the_leed = reportLeed(table, tn, id, un)
        # logger.info(the_leed)
        
        # SUCCESS!
        # simplify return value
        result = {}
        result['id'] = id
        result['tn'] = tn
        result['ti'] = the_leed['ti']
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
       
    finally:
 
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
