#
# SQUARE DELETE USER
#
# 1/2024 - adding Square revoke access token
#

import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import logging
from square.client import Client
import os


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
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value





# Revoke All Square OAuth tokens from a merchant
# 
# The endpoint that revoke all the access token from the specified merchant for this application
# This method calls `revoke_token` api with id of the merchant whose token you want to revoke.
#  
# This endpoint does two things:
#    1. call Square OAuth to revoke the tokens
#    2. remove the OAuth record from the database
#
def revoke_Square( square_client, client_id, client_secret, merchant_id ):
     
    request_body = {}
    request_body['client_id'] = client_id
    request_body['merchant_id'] = merchant_id
    # The authentication need a special prefix 'Client ' before appending client secret
    response = square_client.o_auth.revoke_token(request_body, 'Client ' + client_secret)
    
    if response.is_success():
        return response
        
    elif response.is_error():
        type = response.body['type']
        err = response.body['message']
        raise Exception("Cannot revoke Square authorization [" + type + "] : " + err)

  


#
# remove user from Cognito user pool
# will throw Exception
#
def delete_CognitoUser( un ):
    
    try:
        client = boto3.client('cognito-idp')

        response = client.admin_delete_user(
            UserPoolId='leedz_users',
            Username=un
        )

        return response
    
    except Exception as err:
        raise
    
    

    
    
  
#
# Remove user from Leedz DB
# will throw Exception
#
def delete_LeedzUser( table, un ):
    
    result = None
    try:
        
        response = table.delete_item(
            Key={
            'pk':'user',
            'sk':un 
            },
            ReturnValues='ALL_OLD'
        ) 

        if 'Attributes' not in response :
            logger.error("User not found: %s", un)
            raise ValueError("User not found: " + un)

    except ClientError as err:
        logger.error("Couldn't delete user %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise

    else:
        result = response['Attributes']
            
    return result
            
            


#
#
# 
def handle_error(error):
    
    # create a dictionary with error details
    error_dict = {  'cd': 0,
                    'er': str(error) }
    
    # Convert the dictionary to a JSON string
    error_json = json.dumps(error_dict)
  
    print(error_json)
      
    return error_json
    
    


    
#   
# 
#
#
#
def lambda_handler(event, context):

    result = ""
    TRUE = 1
    FALSE = None
    
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        # USERNAME - REQUIRED
        #
        un = validateParam(event, 'un', TRUE)


        # LEEDZ USER
        #
        the_user = None
        try:

            fromDB = table.get_item(Key={"pk": "user", "sk" : un})
                      
            if 'Item' not in fromDB:
                raise ValueError("User not found: " + un)
            
            the_user = fromDB['Item']
            if ('sq_id' not in the_user):
                raise ValueError("Cannot find Square merchant ID for user: " + un)

        except Exception as err:
            logger.error("Cannot find user [" + un + "] : " + str(err))
            raise err
        
        
        # SQUARE MERCHANT ID
        # may not be set if user is not authorized
        merchant_id = the_user['sq_id']
        
        
        if (not merchant_id or merchant_id == ""):
            logger.info("No Square Authorization found for user: " + un)
        
        else :
            # REVOKE SQUARE AUTHORIZATION
            # will throw Exception
            try :

                # SQUARE INFO
                #
                client_id = validateEnviron('sq_app_id', TRUE)
                client_secret = validateEnviron('sq_app_secret', TRUE)
                environ = validateEnviron('sq_environ', TRUE)

                # initialize square oauth client
                square_client = Client(
                    environment=environ,
                    user_agent_detail='sq_delUser'
                )

                revoke_Square( square_client, client_id, client_secret, merchant_id )

            except Exception as err:
                logger.error("Error revoking Square authorization [" + merchant_id + "] : " + str(err))
                raise err

        
        #
        # DELETE COGNITO USER from leedz_users userpool
        #
        delete_CognitoUser(un)
        
        
        #
        # DELETE LEEDZ USER
        # 
        delete_LeedzUser(table, un)
  
  
  
    #
    # ERROR HANDLING
    #
    except Exception as error:
        result = handle_error(error)
    
    
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
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            },
    }
    
    logger.info(response)
    
    return response