#
# CHANGE USER
#
#

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import logging

import json
import json.encoder
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
def handle_error(error):
    
    str_err = str(error)
    
    # Convert the dictionary to a JSON string
    error_json = json.dumps(str_err, cls=DecimalJsonEncoder)
  
    logger.error(str_err)
      
    return error_json
    
    


    
    
    
#   
# 
#
#
#
        
def lambda_handler(event, context):


    true = 1
    false = 0

    
    try:
    
        # USERNAME - REQUIRED
        #
        un = validateParam(event, 'un', true)
            

        update_expr = 'SET'
        attr_vals = {}
        
        
        # EMAIL
        if ('em' in event['queryStringParameters']):
            em = event['queryStringParameters']['em']

            update_expr += ' em=:em,'
            attr_vals[':em'] = em
            
            
        # WEBSITE
        if ('ws' in event['queryStringParameters']):
            ws = event['queryStringParameters']['ws']

            update_expr += ' ws=:ws,'
            attr_vals[':ws'] = ws
    
    
        # ABOUT
        if ('ab' in event['queryStringParameters']):
            ab = event['queryStringParameters']['ab']

            update_expr += ' ab=:ab,'
            attr_vals[':ab'] = ab
            
            
    
        # ZIP
        if ('zp' in event['queryStringParameters']):
            zp = event['queryStringParameters']['zp']

            if (zp and zp != 'null') :
                update_expr += ' zp=:zp,'
                attr_vals[':zp'] = int(zp)
            
    
        # ZIP_RADIUS
        if ('zr' in event['queryStringParameters']):
            zr = event['queryStringParameters']['zr']
    
            if (zr and zr != 'null') :
                update_expr += ' zr=:zr,'
                attr_vals[':zr'] = int(zr)
            
    
    
        # SUBSCRIPTIONS
        if ('sb' in event['queryStringParameters']):
            sb = event['queryStringParameters']['sb']

            update_expr += ' sb=:sb,'
            attr_vals[':sb'] = sb
    
        
            
        # BADGES
        if ('bg' in event['queryStringParameters']):
            bg = event['queryStringParameters']['bg']

            update_expr += ' bg=:bg,'
            attr_vals[':bg'] = bg
    
    
    
        
        # REMOVE THE LAST TRAILING CHAR
        update_expr = update_expr.rstrip(update_expr[-1])
        
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        
        try:
                    
            response = table.update_item(
                Key={
                    'pk': 'user',
                    'sk': un
                },
                ConditionExpression='attribute_exists(sk)',
                UpdateExpression= update_expr,
                ExpressionAttributeValues= attr_vals,
                ReturnValues='UPDATED_NEW'
            )
        
        
            
            if 'Attributes' not in response :

                logger.error("DB Error: No Attributes Updated: " + response)
                raise ValueError("DB Error:  Cannot change user: " + un)
            
            


        # DYNAMODB ERRORS
        #
        except ClientError as err:
            
            if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
                msg = "DB Error: User not found: " + un
                return createHttpResponse(204, handle_error(err))
                
            else:
                return createHttpResponse(204, handle_error(err))
        
        
        #
        # SUCCESS!
        #
        else:
                json_response = json.dumps( response['Attributes'] , cls=DecimalJsonEncoder)
                return createHttpResponse( 200, json_response )
  
  
  
    #
    # ERROR HANDLING
    #
    except ClientError as error:
        return createHttpResponse( 204, handle_error(error) )
        
    
    except BaseException as error:
        return createHttpResponse( 204, handle_error(error) )
        

    
        
        
        
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

    return response
