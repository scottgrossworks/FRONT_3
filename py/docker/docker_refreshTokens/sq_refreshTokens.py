#
# Find expiring Square access tokens and refresh them
#
#
import os
import json

from cryptography.fernet import Fernet
import base64
import hashlib

from square.client import Client

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.types import Binary
from boto3.dynamodb.conditions import Key

from datetime import datetime, timedelta, timezone


import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)

 




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
    
    

def decryptToken(key_txt, encrypted_token):
    try:
        fernet_key = generateFernetKey(key_txt)
        f = Fernet(fernet_key)

        # Convert the encrypted_token to bytes
        bytes_object = encrypted_token.value

        decrypted_token = f.decrypt(bytes(bytes_object))

        return decrypted_token.decode('ASCII')

    except Exception as err:
        print("Error in decryptToken: " + str(err))
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
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value




#
# SUCCESS
# {'cd': '1'}
#
def handle_success( details ):
       
    ret_obj = {
        'dt':details,
        'cd':1
    }
    
    the_json = json.dumps( ret_obj )
    return createHttpResponse( 200, the_json )
    
    
    

#
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
    
    the_json = json.dumps( ret_obj )
    return createHttpResponse( 200, the_json )




# input -- string formatted in the ISO date format --2024-02-27 03:33:41.187138
# returns -- int the number of milliseconds since the epoch -- 1707106525200
#
def future_ex_date():
    epoch = datetime.utcfromtimestamp(0)
    current_datetime = datetime.now()
    duration = timedelta(days=22)
    new_datetime = current_datetime + duration
    milliseconds = int((new_datetime - epoch).total_seconds() * 1000)
    return milliseconds

    
    
#
# The expiring OAuth record is defined as the OAuth record with access token is 7 days or older
# As recommended by Square, we should renew all token older than 7 days
# so the expiration date should be 30 - 8 = 22 days ahead
#
# 2024-02-21T08:50:28Z
#
def get_expiringRecords(table) :
  
    # test FUTURE date is 22 days ahead
    ex_date = future_ex_date()
    
    try:
        
        fromDB = table.query(
            KeyConditionExpression=Key('pk').eq('user'),
            FilterExpression = 'sq_ex <= :ex_date',
            ExpressionAttributeValues = { ':ex_date': ex_date }
        )

        if ((fromDB is None) or ('Items' not in fromDB)):
            err_msg = "Error finding expiring user records for date: " + str(ex_date)
            logger.error(err_msg)
            raise ClientError( err_msg )
            
        
        # may still be empty
        return fromDB['Items']
        
        
    except Exception as err :
        raise
    




#
# Call Square API to refresh user access token 
#
def refresh_userToken(square, client_id, client_secret, the_user ) :

    try:
        encrypted_refresh_token = the_user['sq_rt']
        decrypted_refresh_token = decryptToken( the_user['sk'], encrypted_refresh_token ) 
        
        request_body = {}
        request_body['client_id'] = client_id
        request_body['client_secret'] = client_secret
        request_body['grant_type'] = 'refresh_token'
        request_body['refresh_token'] = str(decrypted_refresh_token)
        request_body['redirect_uri'] = "http://theleedz.com/"

        response = square.obtain_token( request_body )
        if (not response):
            msg = "No response from Square obtain_token API"
            logger.error(msg)
            raise Exception(msg)


        if (response.is_error()):
            msg = "Error returned from Square obtain token API: " + response.errors
            logger.error(msg)
            raise Exception(msg)
        

        # RESPONSE will contain new refresh and expires
        if (('access_token' not in response.body) or
            ('expires_at' not in response.body) or
            ('refresh_token' not in response.body)) :
            msg = "Tokens not found in Square obtain_token API response"
            logger.error(msg)
            raise Exception(msg)

        
        ret_obj = {}
        ret_obj['sq_at'] = response.body[ 'access_token' ]
        ret_obj['sq_rt'] = response.body[ 'refresh_token' ]
        ret_obj['sq_ex'] = 0
        # ret_obj['sq_ex'] = response[ 'expries_at' ]

        
        try :
            if response.body['expires_at']:
                # convert ISO format String to milliseconds
                # 2024-02-10T08:32:54Z --> 171434234934794 or whatever
                dt = datetime.fromisoformat(response.body['expires_at'])
                epoch = datetime.utcfromtimestamp(0).replace(tzinfo=timezone.utc)
                ret_obj['sq_ex'] = int((dt - epoch).total_seconds() * 1000)

            
            # RETURN Square credentials
            return ret_obj
        
        
        except Exception as sq_err:
            msg = "Error converting expires_at date [" + str(response.body['expires_at']) + "] : " + str(sq_err)
            logger.error( msg )
            raise ValueError(msg)
        
   
    except Exception as err :
        msg = str(err)
        logger.error("Unable to refresh Square user tokens: " + msg)
        raise
    



#
# Store the new sq_ex token back in DB for user
# ALL TOKENS MUST BE ENCRYPTED
#
def save_newTokens(table, the_user, new_tokens) :
        
    un = the_user['sk']
    response = None
    
    new_access = encryptToken(the_user['sk'], new_tokens['sq_at'])
    new_expires = new_tokens[ 'sq_ex' ]
    new_refresh =  encryptToken(the_user['sk'], new_tokens['sq_rt'])
    
    update_expr = "SET sq_at=:sq_at,sq_ex=:sq_ex,sq_rt=:sq_rt"
    
    attr_vals = {}
    attr_vals[':sq_at'] = new_access
    attr_vals[':sq_ex'] = new_expires
    attr_vals[':sq_rt'] = new_refresh
    
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

            err_msg = "Empty response.  Cannot refresh Square tokens for user: " + un
            logger.error( err_msg )
            raise ValueError( err_msg )
    
        
        return response['Attributes']
        
    
    except Exception as err:
        err_msg = str(err) + ".  Cannot refresh Square tokens for user: " + un
        logger.error(err_msg)
        raise Exception( err_msg )
        






#
#
#
def lambda_handler(event, context):

    try:

        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        # GET EXPIRING RECORDS FROM DB
        expiring_users = get_expiringRecords( table )

        if (not expiring_users):
            return handle_success("No expiring oauth records found")
            

        # CONNECT TO SQUARE
        #
        TRUE = 1
        client_id = validateEnviron('sq_app_id', TRUE)
        client_secret = validateEnviron('sq_app_secret', TRUE)
        environ = validateEnviron('sq_environ', TRUE)

        # initialize square oauth client
        square_client = Client(
            environment=environ,
            user_agent_detail='sq_refreshTokens',
            max_retries=3,
            timeout=600
        )

        # FOR EACH USER
        # get the refresh token from the oauth record, refresh token is used to refresh the access token
        # decrypt the refresh token before send to the square oauth service
        success_counter = 0
        for the_user in expiring_users :

            try:
            
                # refresh the OAuth access token
                # will throw error -- will NOT return empty tokens
                new_tokens = refresh_userToken( square_client.o_auth,
                                                client_id,
                                                client_secret, 
                                                the_user )
                

                save_newTokens(table, the_user, new_tokens)
                success_counter += 1
        
        
            except Exception as error:
                # do not abort because of one problem user
                user_info = the_user['sk']
                if (the_user['sq_id']):
                    user_info = user_info + " - " + str(the_user['sq_id'])
                logger.error("Unable to refresh user token for leedz user: " + user_info)
                logger.error( str(error ))
        
        
        
        result = "Refreshed " + str(success_counter) + " / " + str(len(expiring_users)) + " expiring oauth records"
        return handle_success( result )
        
    
    except Exception as error:
        
        return handle_error(error)
    












#
# Create the HTTP response object
#
#
def createHttpResponse( code, result ):
   
    response = {
        'statusCode': code,
        'body': result,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            },
    }
    
    logger.info(response)
    
    return response