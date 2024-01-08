# GET USER
#
# 1/3 WILL CHECK SQUARE CODES AND RETURN AUTH LINK ACCCORDINGLY
#
#

import os

import boto3
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

import uuid
import json
from decimal import Decimal

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
#
def validateEnviron( var, required ):
    
    the_val = ""
    try:
        the_val = os.environ[var]
    except KeyError:
        if required:
            raise ValueError("Environment Variable not found: " + var)
        the_val = ""
        
    return the_val
    
    
    
#   
# will throw ValueError
#
#
def validateParam( event, param, required ):
    
    if ('queryStringParameters' not in event):
        raise ValueError("Http Request error.  No query string parameters found")
    
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
def lambda_handler(event, context):
 
    NO_COOKIE = ""
    result = "" 
    
    try:        
        
        true = 1
        
        # USERNAME - required
        #
        un = validateParam(event, 'un', true)
        # print("USERNAME=" + un)
        pk = "user"

        
        # DDB QUERY
        #
        #
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')
    
        fromDB = table.get_item(Key={"pk": pk, "sk" : un})
                      
        
        if 'Item' not in fromDB:
            raise ValueError("User not found: " + un)
        
        DB_item = fromDB['Item']
        
        cookie_str = NO_COOKIE
        #
        # 1/2024
        # is this profile authorized for Square?
        # NO -- send back Auth link and store the code in sq_st -- 
        # sq_st = 'authorized' | square authorization url
        #
        if (DB_item['sq_st'] != 'authorized') :
         
            # set the Auth_State cookie with a random uuid string to protect against cross-site request forgery
            # Auth_State will expire in 300 seconds once the page is loaded
            # `HttpOnly` helps mitigate XSS risks and `SameSite` helps mitigate CSRF risks. 
            state = str(uuid.uuid4())
            
            # ! IMPORTANT
            #
            # store the state in the GSI_sq_st reverse lookup table for authorization callback lookup later
            saveUserState(table, state, un)
            
            # FROM SQUARE
            # https://developer.squareup.com/apps/sq0idp-fGPn-QZvqEnvGeWHA9sHMw/settings
            sq_url = validateEnviron('sq_url', 1)
            sq_app_id = validateEnviron('sq_app_id', 1)
            
            cookie_str = 'OAuthState={0}; HttpOnly; Max-Age=300; SameSite=Lax'.format(state)
            
            # create the authorize url with the state
            authorize_url = construct_authorize_url(sq_url, sq_app_id, state)
            DB_item['sq_st'] = authorize_url
       
       
    
        # subs and badges are sets
        # which are not JSON serializable by default. 
        # need to convert these sets to lists before converting the entire object to JSON.     

        result = convert_sets_to_lists(DB_item)
              
        #
        # SUCCESS!
        #
        return createHttpResponse( 200, json.dumps( result, cls=DecimalJsonEncoder), cookie_str )
        
        
        
    except ValueError as e:
        result = handle_error(e)
        return createHttpResponse( 204, json.dumps(result) , NO_COOKIE)
        
        
    except ClientError as e:
        result = handle_error(e)
        return createHttpResponse( 400, json.dumps(result) , NO_COOKIE)
                
   



 


# CONSTRUCT Square authorization url 
#
# creates  Square authroization url that takes client to Square
# authorization page to finish OAuth permission grant process.
# query parameters:
# client_id - aka. application id, the Square application which is requesting permissions.
# scope - s space-separated list of the permissions the application is requesting, different square api require different permissions.
#
# session - Suggest to set it to `false` all the time in production, only set it to `true` in sandbox FIXME FIXME FIXME
#
# state - we should set state value and verify the value in the callback to help protect against cross-site request forgery.
#
# "api_gateway_stage": "api",
# "environment_variables": 
# "environment": "sandbox",
# "base_url": "https://connect.squareupsandbox.com",
# "permissions": "ITEMS_READ PAYMENTS_READ",
# "session": "true"

def construct_authorize_url(sq_url, app_ID, state):

    
    authorize_url = (
        sq_url + '/oauth2/authorize'
        '?client_id=' + app_ID +
        '&scope=' + "ITEMS_READ PAYMENTS_READ" +
        '&session=' + "true" +
        '&state=' + state
    )
    
    return authorize_url







#
#
# Ensure a reverse mapping state --> Leedz username
# for later use during authorization callback
#
# will throw error
#
def saveUserState(table, sq_st, un):
    
    # update the leedz posted for this user
    #
    try:
        response = table.update_item(
                Key={ 'pk': 'user', 'sk': un },
                UpdateExpression="SET sq_st=:sq_st",
                ExpressionAttributeValues={ ":sq_st": sq_st },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="ALL_NEW"
            )
    

        # throw an error
        #
        if 'Attributes' not in response:
            msg = "Error updating OAuth state for user: " + un
            logger.error(msg)
            raise ValueError(msg)
            
        
        # return user object
        #
        return response['Attributes']
    
    
    except ClientError as err:
        logger.error("Error updating OAuth state for user %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise

   
   
   

    
 


 
#
# Create the HTTP response object
#
#
def createHttpResponse( status_code, result, cookie_str ):
   
    response = {
        'statusCode': status_code,
        'body': result,
        'headers': {
        'Set-Cookie': cookie_str,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
            },
    }
    
    return response
    
    
    


#
#
#
#
def handle_error(error):
    
    err_msg = str(error)
    
    logger.error(err_msg)
    
    return err_msg
    
        
    
    
    
    
# This code defines a convert_sets_to_lists function that recursively traverses the JSON object 
# and converts any sets to lists. It also converts any Decimal objects to strings, which are JSON serializable.
# After running this code, the output will be a JSON string that does not contain any sets and can therefore
# be serialized without errors.    
def convert_sets_to_lists(obj):
    if isinstance(obj, set):
        #print(f"GOT A SET=", obj)
        #return list(obj)
        return [convert_sets_to_lists(elem) for elem in obj]
    elif isinstance(obj, dict):
        #print(f"GOT A DICT=", obj)
        return {k: convert_sets_to_lists(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        #print(f"GOT A LIST=", obj)
        return [convert_sets_to_lists(elem) for elem in obj]
    elif isinstance(obj, Decimal):
        #print(f"GOT A DECIMAL=", obj)
        return str(obj)
    else:
        return obj





