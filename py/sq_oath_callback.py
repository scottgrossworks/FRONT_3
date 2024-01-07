#
# Receives authorization result from the Square authorization page.
# If it is a successful authorization, it will use the code to exchange an
# access_token and refresh_token and store them in db table.
# If it is a failed authorization, it collects the failure oauth_apin and render the response.
#

import os
from cryptography.fernet import Fernet

from http import cookies
import json

import boto3
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from square.client import Client

import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)




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
# will throw ValueError
#
#
def validateHeader( event, header, required ):
    
    if ('headers' not in event):
        raise ValueError("Http Request error.  No headrrs found")
    
    value = ""
    
    if (header not in event.headers):
            if required:
                raise ValueError("HTTP Request error.  No '" + header + "' header")
    else:
        value = event.headers[header] 
        
    return value




    
    
#
#
#
#
def handle_error( err ):
    
    err_msg = str( err )
    
    logger.error(err_msg)

    ret_obj = { "cd" : 0,
                "er" : err_msg }

    return ret_obj
    



# from https://developer.squareup.com/apps/sq0idp-fGPn-QZvqEnvGeWHA9sHMw/settings

# sandbox_app_ID = "sandbox-sq0idb-phu8jRWJjN1ysnWqGMsBMA"
# sandbox_access_token = "EAAAEM-qAHvj9qqGJ3wle3yx5iKeaK2h4fvF8yofv_ycuckMuCl7mxhnAK2wgSLq"
# token_encrypt_key = "GBUsOzobKYCsKC2s-nKrXfQeO03B170-LhYZInaFhik="


# endpoint that handles Square authorization callback
# @app.route('/authorize-callback', methods=['GET'])
#
#  This callback endpoint should be added as the OAuth Redirect URL of your Square application
#  in the Square Developer Dashboard.
#
# EXAMPLE
# https://example.com/callback.php?code=sq0cgb-xJPZ8rwCk7KfapZz815Grw&response_type=code&state=jf0weoif3dfsk04imofpdgmlksadfwmvmf4oip
#
# Query Parameters
# ----------------
# response_type : str
#     The type of the response, it should be 'code' with a succesful authorization callback.
#
# code : str
#     A valid authorization code. Authorization codes are exchanged for OAuth access tokens with the ObtainToken endpoint.
#
# state : str
#     The state that was set in the original authorization url. verify this value to help
#     protect against cross-site request forgery.
#
# error : str
#     The error code of a failed authrization. Only exists when failed to authorize.
#
# error_description : str
#     The error description of a failed authrization. Only exists when failed to authorize.

def lambda_handler(event, context):

    result = ""
    TRUE = 1
    FALSE = 0
    
    try:
        
        # CHECK FOR ERROR
        error_code = validateParam(event, 'error', FALSE)
        if error_code:
            the_error = validateParam(event, 'error_description', FALSE)
            err_str = "Square Authorization Error [" + error_code + "] " + the_error
            logger.error(err_str)
            raise Exception( err_str )
        
        
        # STATE
        # generated in authorization link sent during sign-up
        state = validateParam(event, 'state', TRUE)

        # COOKIE
        # 
        # get the auth state cookie to compare with the state that is in the callback
        cookie_state = ''
        cookie = validateHeader(event, 'cookie', TRUE)

        if cookie:
            c = cookies.SimpleCookie(cookie)
            cookie_state = c['OAuthState'].value
            
        # ERROR
        # cookie state fron web client either NULL or doesn't match param state
        if cookie_state == '' or state != cookie_state:
            raise ValueError("Authorization failed: invalid auth state")
                
    
        # RESPONSE TYPE
        # 
        # look for 'code' indicating refresh/access tokens
        #
        response_type = validateParam(event, "response_type", TRUE)
        if (response_type == 'code'):
            # authorization to trade for tokens
            auth_code = validateParam(event, "code", TRUE)   

            # TOKEN EXCHANGE
            #
            app_ID = validateEnviron('sq_app_id', TRUE)
            app_secret = validateEnviron('sq_app_secret', TRUE)
            environment = validateEnviron('sq_environ', FALSE)
            if not environment:
                environment = "sandbox"
            
            # calls Square client to make special POST req to Square
            the_response = exchange_oauth_tokens( environment, auth_code, app_ID, app_secret )
  
  
            if (the_response.is_success()):
                
                access_token = the_response.body['access_token'].encode('ASCII')
                refresh_token = the_response.body['refresh_token'].encode('ASCII')
                expires_at = the_response.body['expires_at']
                merchant_id = the_response.body['merchant_id']
                
                
                # connect to DynamoDB
                #
                dynamodb_client = boto3.resource("dynamodb")
                table = dynamodb_client.Table('Leedz_DB')
                
                # reverse-lookup from state-->Leedz username
                un = getLeedzUser( table, state )
                
                
                # 1/2024 TODO FERNET ENCRYPT TOKENS 
                # encrypt the refresh_token and access_token before save to db
                
                # token_encrypt_key = validateEnviron('token_encrypt_key', 1)
                # fernet = Fernet(token_encrypt_key)
                # sq_rt = encrypted_refresh_token = fernet.encrypt( refresh_token )
                # sq_at = encrypted_access_token = fernet.encrypt( access_token )

                if not expires_at:
                    expires_at = '0'
                
                saveTokensToDB( table, un, access_token, merchant_id, refresh_token, 'authorized', int(expires_at) )

                result = {  
                            "cd" : 1,
                            "msg" : "authorized",
                            "sq_ex": expires_at,
                            "merchant_id" : merchant_id
                          }

            
            # ERROR
            #
            elif (the_response.is_error()):
                err_type = "Authorization Error [" + the_response.body['type'] + "]: "
                err_msg = the_response.body['message']
                raise ValueError( err_type + err_msg )
  
  
        # ERROR
        #
        else:
            err_param = validateParam(event, 'error', 0)
            if (err_param):
                err_type = "Authorization Error [" + err_param + "]: "
                err_desc = validateParam(event, 'error_description', 0)
                raise ValueError( err_type + err_desc )
            
  
  
    except Exception as e:
        
        result = handle_error( str(e) )
        
        
    finally:    
        
        the_json = json.dumps( result )
        return createHttpResponse( the_json )




#
# Exchange Square OAuth tokens with authorization code 
#
#
# This method exchanges two OAuth tokens (Access Token and Refresh Token) with
# the authorization code that is returned with the authorize callback.
# We call `obtain_token` api with authorization code to get OAuth tokens.
#
def exchange_oauth_tokens(env, code, id, secret):
   
    response = ""
    try:
        # initialize square oauth client
        square_client = Client(
            environment=env,
            user_agent_detail='sq_oauth_callback'
        )
        oauth_api = square_client.o_auth
    
        request_body = {}
        request_body['client_id'] = id
        request_body['client_secret'] = secret
        request_body['code'] = code
        request_body['grant_type'] = 'authorization_code'
        response = oauth_api.obtain_token( request_body )

    except Exception as e:
        response = handle_error( str(e) )

    finally:    
        return response



#
#
#
def getLeedzUser( table, sq_st ) :
    
    try:  
        response = table.query(
            IndexName='GSI_sq_st',
            KeyConditionExpression=Key('sq_st').eq(sq_st)
        )

    
        # logger.info("GOT RESPONSE!")
        # logger.info(response['Item'])
        
    
        if ('Item' not in response):
            msg = "OAuth Error. Leedz user not found: " + sq_st
            raise ValueError(msg)
            
        else:
            result = response['Item']
            # sort key of GSI will be Leedz username
            return result['sk']
    
    
    except Exception as err:
        
        raise

        
        



#
# save or overwrite the oauth record to db
# encrypt the refresh_token and access_token before save to db
#
# sq_id = used only for error reporting
#
# sq_at = encrypted_access_token = fernet.encrypt( access_token )
# sq_rt = encrypted_refresh_token = fernet.encrypt( refresh_token )
# sq_st = state --> authorized
# sq_ex = expires_at
#
def saveTokensToDB( table, un, sq_at, sq_id, sq_rt, sq_st, sq_ex ) :
   
  
    expr = 'SET sq_at=:sq_at,sq_rt=:sq_rt,sq_st=:sq_st,sq_ex=:sq_ex'
    vals = {
            ':sq_at' : sq_at,
            ':sq_rt' : sq_rt,
            ':sq_st' : sq_st,
            ':sq_ex' : sq_ex                
    }
    
    response = []
    
    try:
            
        response = table.update_item(
            Key={
                'pk': 'user',
                'sk': un,
            },
            ConditionExpression='attribute_exists(sk)',
            UpdateExpression= expr,
            ExpressionAttributeValues= vals,
            ReturnValues='UPDATED_NEW'
        )
        
        
        if 'Attributes' not in response :
        
            logger.error("DB Error: No Attributes Updated: " + response)
            raise ValueError('Token Save Error. user: ' + un + ' merchant ID: ' + sq_id)
        

        return response['Attributes']
    
    
    except ClientError as err:
    
        if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
            msg = 'Token Save Error.  User not found: ' + un + ' merchant ID: ' + sq_id
            response = handle_error( msg )
            
        else:
            msg = "Token save error: " + str(err) + ' merchant ID: ' + sq_id
            response = handle_error( msg )
    
    except Exception as error:
        
        msg = "Token Save Error: " + str(error) + ' merchant ID: ' + sq_id
        response = handle_error( msg )
  
  
    return response
  
  







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
    # logger.info("RETURNING RESPONSE")
    # logger.info(response)
    
    return response
