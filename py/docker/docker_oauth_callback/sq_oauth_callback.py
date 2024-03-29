#
# Receives authorization result from the Square authorization page.
# If it is a successful authorization, it will use the code to exchange an
# access_token and refresh_token and store them in db table.
# If it is a failed authorization, it collects the failure oauth_apin and render the response.
#

import os

from cryptography.fernet import Fernet
import base64
import hashlib

import json

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

import urllib.request
import urllib.error

from square.client import Client

from datetime import datetime, timezone

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
    
    
    value = ""
    
    if ('headers' not in event):
        if (required):
            raise ValueError("Http Request error.  No headers found")
    else:
        return value
    
    
    if (header not in event['headers']):
        if required:
            raise ValueError("HTTP Request error.  No '" + header + "' header")
    else:
        value = event['headers'][header] 
        
    return value







#
# 
# 
def handle_success( msg, un ) :
    
    result = "<!DOCTYPE html><html><head><meta http-equiv='refresh' content='0; URL=https://theleedz.com/user_editor.html?square=authorized'></head></html>"
    
    log_result = {  
        "cd" : 1,
        "msg" : msg,
        "un":un
        }

    logger.info(log_result)
    
    return createHttpResponse( result )
    



    
    
#
# return 200 respone with leedz error code to Square server
# copy all the Exception fields and args into the message
# log error
#
def handle_error( err ):
    
    err_type = str(type(err))
    
    if isinstance(err.args, tuple):
        err_args = ', '.join(map(str, err.args))
    else:
        err_args = str(err.args)
        
    err_msg = "[ " + err_type + " ] ( " + err_args + " ) : " + str(err)
    
    logger.error(err_msg)
    
    long_msg = "Error receiving Square seller authorization.  " + err_msg + ".  Please report this error at theleedz.com@gmail.com"

    result = { "cd" : 0,
                "er" : long_msg }

    
    the_json = json.dumps( result )
    return createHttpResponse( the_json )
    







#
# Create the HTTP response object
#
#
def createHttpResponse( result ):
   
    response = {
        'statusCode': 200,
        'body': result,
        'headers': {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
            },
    }
    # logger.info(response)
    
    return response




#
# ENCRYPTION HANDLING
#
#

def encryptToken( key_txt, token_txt):
    try:
        fernet_key = generateFernetKey(key_txt)
        f = Fernet(fernet_key)
        encrypted_token = f.encrypt(token_txt.encode('ASCII'))
        return encrypted_token
    
    except Exception as err:
        raise err   



# take a string as input and converts it into a string of 32 bytes suitable for cryptographic use
#
def convert( src ):
    hash_object = hashlib.sha256( src.encode() )
    return hash_object.digest()

# create a Fernet encryption key from a plain text source
#
def generateFernetKey( txt_src ) :
    seed = convert( txt_src )        
    return base64.urlsafe_b64encode( seed )







# from https://developer.squareup.com/apps/sq0idp-fGPn-QZvqEnvGeWHA9sHMw/settings

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

    TRUE = 1
    FALSE = 0
    
    # logger.info(str(event))
    
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


        # connect to DynamoDB
        #
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')
        
        
        # LEEDZ_USER
        # reverse-lookup from state-->Leedz username
        the_user = getLeedzUser( table, state )
        # logger.info(the_user)
        

        # QUICK CHECK -- are we already authorized?
        # Is this a quick-duplicate call?
        if (the_user['sq_st'] == 'authorized'):
            return handle_success( 'authorized', the_user['sk'])
            

        # does user profile contain a state key generated in getUser()
        # check state against user state
        verifyUserState(state, the_user)
        
    
        # RESPONSE TYPE
        # 
        # look for 'code' indicating refresh/access tokens
        # will not appear on error
        #
        response_type = validateParam(event, "response_type", FALSE)
        
        if (response_type == 'code'):
            doTokenExchange(table, event, the_user)
            return handle_success( 'authorized', the_user['sk'])

         
        # ERROR
        #
        else:
            is_error = validateParam(event, "error", FALSE)
            if (is_error) :
                err_desc = validateParam(event, "description", FALSE)
                err_msg = "Error obtaining Square seller authorization [" + is_error + "]: " + err_desc
                raise Exception(err_msg)
            

            else:
                err_msg = "Unknown Square OAuth response: " + response_type
                logger.error( event )
                raise Exception( err_msg ) 
            
  
    # CATCH EVERYTHING
    except Exception as e:
        logger.error("OAuth callback Exception: " + str(e))
        return handle_error( e )
        






#
# SQUARE TOKEN EXCHANGE
# ---> auth code 
# access/refresh tokens <---
#
def doTokenExchange(table, event, the_user):
    
    TRUE = 1
    FALSE = 0
    
    # authorization to trade for tokens
    auth_code = validateParam(event, "code", TRUE)   

    # TOKEN EXCHANGE
    #
    app_ID = validateEnviron('sq_app_id', TRUE)
    app_secret = validateEnviron('sq_app_secret', TRUE)
    sq_env = validateEnviron('sq_environ', FALSE)
    if not sq_env:
        sq_env = "production"
    
    
    #
    # create SQUARE CLIENT 1 to perform token exchange
    #
    the_response = exchange_oauth_tokens( sq_env, auth_code, app_ID, app_secret )

    
    if ('errors' in the_response.body) :

        err_cat = the_response.body['category']
        err_code = the_response.body['code']
        err_det = the_response.body['detail']               
        err_msg = "Error in OAuth token exchange - " + err_cat + " (" + err_code + ") : " + err_det
        logger.error(err_msg)
        raise Exception(err_msg)


    #
    # Contains access_token or it's an ERROR
    #
    elif ('token_type' in the_response.body and the_response.body['token_type'] == 'bearer') :

        try: 
            access_token = the_response.body['access_token']
            refresh_token = the_response.body['refresh_token']
            expires_at = the_response.body['expires_at']
            merchant_id = the_response.body['merchant_id']
            
            # logger.info("ACCESS_TOKEN=" + access_token)
            # logger.info("REFRESH_TOKEN=" + refresh_token)
                        
            # GET LOCATION ID FOR THIS SELLER
            # will raise Exception
            sq_lc = getLocationID( sq_env, access_token )
            
            
            # encrypt the refresh_token and access_token before save to db
            # TOKEN ENCRYPT KEY WILL BE USERNAME
            sq_at = encryptToken( the_user['sk'], access_token )
            sq_rt = encryptToken( the_user['sk'], refresh_token )
            
            sq_ex = 0
            if expires_at:
                # convert ISO format String to milliseconds
                # 2024-02-10T08:32:54Z --> 171434234934794 or whatever
                dt = datetime.fromisoformat(expires_at)
                epoch = datetime.utcfromtimestamp(0).replace(tzinfo=timezone.utc)
                sq_ex = int((dt - epoch).total_seconds() * 1000)
            
            # will throw exception on failure
            saveTokensToDB( table, the_user, sq_at, sq_ex, merchant_id, sq_lc, sq_rt, 'authorized' )




        except Exception as e:
            msg = "Error in token exchange: "
            err_str = msg + str(e)
            logger.error( err_str )    
            raise Exception(err_str)
        
    
    else :
        err_msg = "Error in OAuth token exchange.  Callback did not receive bearer token"
        logger.error(err_msg)
        logger.error(the_response)
        raise Exception(err_msg)
        



#
# Exchange Square OAuth tokens with authorization code 
#
#
# This method exchanges two OAuth tokens (Access Token and Refresh Token) with
# the authorization code that is returned with the authorize callback.
# We call `obtain_token` api with authorization code to get OAuth tokens.
#
def exchange_oauth_tokens(sq_env, code, id, secret):
   
    # initialize square oauth client
    square_client = Client(
        environment=sq_env,
        user_agent_detail='exchange_oauth_tokens',
        max_retries=3,
        timeout=900
    )
    
    response = ""
    try:

        scopes = [ "ORDERS_WRITE", "ORDERS_READ", "PAYMENTS_WRITE", "PAYMENTS_READ", "PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS", "MERCHANT_PROFILE_READ" ]
    
        request_body = {}
        request_body['client_id'] = id
        request_body['client_secret'] = secret
        request_body['scopes'] = scopes
        request_body['code'] = code
        request_body['redirect_uri'] = "https://theleedz.com/user_editor.html?square=authorized"
        request_body['grant_type'] = 'authorization_code'
        response = square_client.o_auth.obtain_token( request_body )

        # logger.info( response )
        
        return response
    

    except Exception as e:
        err_str = str(e)
        logger.error("Exception in exchange_oauth_tokens: "  + err_str)    
        raise e







# state created in getUser -- saved in the_user
# programmed into login link
# state comes back from oauth callback
# 
# does state == the_user['sq_st']
#
def verifyUserState(state, the_user) :
    if (the_user['sq_st'] != state) :
        msg = "Cannot validate OAuth request state.  " + the_user['sq_st'] + " != " + state
        logger.error( msg )
        raise ValueError(msg)
        





#
# return entire user object
# reverse lookuo in GSI_sq_st
# using sq_st as key --> leedz un
#
def getLeedzUser(table, sq_st):
    try:
        response = table.query(
            IndexName='GSI_sq_st',
            KeyConditionExpression=Key('sq_st').eq(sq_st)
        )

        # logger.info(response)

        if 'Items' not in response or len(response['Items']) == 0:
            msg = "OAuth Error. Leedz user not found: " + sq_st
            raise ValueError(msg)
        else:
            the_user = response['Items'][0]
            return the_user

    except Exception as err:
        raise
        





#
# Get location_id to include in any leed for sale payment link
#
def getLocationID( sq_env, access_token ) :
    
    try:        
        # Create SQUARE CLIENT 2 to do Location ID search
        # using authorization access_token
        #
        square_client = Client (
            access_token = access_token,
            environment = sq_env
        )
    
        response = square_client.locations.retrieve_location(
            location_id = "main"
        )

        # SUCCESS !!
        # RETURN location_id from response dict
        #
        if response.is_success():
        
            location = response.body['location']
            location_id = location['id']
            # logger.info(location_id)
            return location_id



        # ERROR
        #
        elif response.is_error():
            print('Error calling LocationsApi.listlocations')
            errors = response.errors
            # An error is returned as a list of errors
            err_str = ""
            for error in errors:
                # Each error is represented as a dictionary
                for key, value in error.items():
                    err_str = str(key) + ": " + str(value) + ", " + err_str

            raise Exception(error_message)

        else:
            error_message = "Unknown response from locations API: " + str(response)
            # logger.error(error_message)
            raise Exception(err_str)
            
      
        
    except Exception as err:
        
        err_str = "Cannot get Location ID: " + str(err)
        raise Exception( err_str )
    
    
    
    
    
 



#
# save or overwrite the oauth record to db
# encrypt the refresh_token and access_token before save to db
#
# sq_id = used only for error reporting
#
# sq_at = encrypted access_token 
# sq_rt = encrypted refresh_token 
# sq_st = state --> authorized
# sq_ex = expires_at  int epoch milliseconds
#
# saveTokensToDB( table, the_user, sq_at, expires_at, merchant_id, sq_rt, 'authorized' )
#
def saveTokensToDB( table, the_user, sq_at, sq_ex, sq_id, sq_lc, sq_rt, sq_st ) :
    
    un = the_user['sk']

    expr = 'SET sq_at=:sq_at,sq_ex=:sq_ex,sq_id=:sq_id,sq_lc=:sq_lc,sq_rt=:sq_rt,sq_st=:sq_st'
    vals = {
            ':sq_at' : sq_at,
            ':sq_ex' : sq_ex,
            ':sq_id' : sq_id,
            ':sq_lc' : sq_lc,    
            ':sq_rt' : sq_rt,
            ':sq_st' : sq_st
            }

    # award badge 5 if necessary
    if ('5' not in the_user['bg']) :   
        # new badges string
        expr += ',bg=:bg'
        new_bg = the_user['bg'] + ',5'
        vals[':bg'] = new_bg    
        

    
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
            logger.error(msg)
            raise Exception(msg)
            
        else:
            msg = "Token save error: " + str(err) + ' merchant ID: ' + sq_id
            logger.error(msg)
            raise Exception(msg)
    
    except Exception as error:
        
        msg = "Token Save Error: " + str(error) + ' merchant ID: ' + sq_id
        logger.error(msg)
        raise Exception(error)
  



