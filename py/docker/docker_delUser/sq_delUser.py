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
        logger.error("Error deleting Cognito user " + un + " : " + str(err))
        raise
    
    

    
    
  
#
# Remove user from Leedz DB
# will throw Exception
#
def delete_LeedzUser( table, un ):
    
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
        logger.error("Could not delete user %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise
    
    except Exception as err:
        logger.error("Error deleting Leedz user " + un + " : " + str(err))
        raise

    else:
        result = response['Attributes']
        return result
            

            
            


#
#
# 
def handle_error(error):
    
    err_msg = str(error)
    logger.error(err_msg)
    
    # create a dictionary with error details
    error_dict = {  'cd': 0,
                    'er': err_msg }
    
    # Convert the dictionary to a JSON string
    error_json = json.dumps(error_dict)

    return createHttpResponse( error_json )







#
#
# 
def handle_success( the_dict ):
    
    msg = str( the_dict )
    logger.error( msg )
    
    # Convert the dictionary to a JSON string
    the_json = json.dumps( the_dict )

    return createHttpResponse( the_json )






# SEND user account delete confirmation RECEIPT EMAIL
# use SES service
#
def send_userEmail( the_user ):
    
    SENDER = "theleedz.com@gmail.com" # must be verified in AWS SES Email
    RECIPIENT = the_user['em']
    SUBJECT = "Leedz User Deleted: " + the_user['un']
    
    user_info = "[" + the_user['un'] + "] " + the_user['em']


    # The email body for recipients with non-HTML email clients
    BODY_TEXT = ("Leedz user has been deleted."
                + "\r\n" + 
                user_info
                + "\r\n" + 
                "Square authorization revoked for: " + the_user['id'] 
                + "\r\n" + 
                "You will need to create a new account and re-auhtorize Square to use the Leedz again."
                + "\r\n" + 
                "Thank you,"
                + "\r\n" + 
                "The Leedz"
                )

                
    # The HTML body of the email
    BODY_START = "<html><head></head><body><h1>Leedz user has been deleted. " + user_info + "</h1><BR><BR>Square authorization revoked for: " + the_user['id']
    BODY_MID = "You will need to create a new account and re-auhtorize Square to use the Leedz again."
    BODY_END = "<BR><BR>Thank you,<BR>The Leedz</body></html>"
    

    try:
        
        # Create a new SES resource and specify a region.
        client = boto3.client('ses',region_name="us-west-2")
        
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': BODY_START + BODY_MID + BODY_END
                    },
                    'Text': {
                        'Charset': 'UTF-8',
                        'Data': BODY_TEXT
                    },
                },
                'Subject': {

                    'Data': SUBJECT
                },
            },
            Source=SENDER
        )
        
        logger.info("EMAIL SENT to " + RECIPIENT + " ID: " + response['MessageId'])
        
    # Display an error if something goes wrong BUT DO NOT FAIL
    except Exception as error:
        logger.error("Error sending user deleted receipt email to " + user_info)
    
    
    
    
    
    
    

    
#   
# 
#
#
#
def lambda_handler(event, context):

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
                user_info = un + " [" + merchant_id + "] : "
                logger.error("Error revoking Square authorization for " + user_info + str(err))
                # DO NOT FAIL -- still continue deleting

        
        #
        # DELETE COGNITO USER from leedz_users userpool
        #
        delete_CognitoUser(un)
        
        
        #
        # DELETE LEEDZ USER
        # 
        delete_LeedzUser(table, un)
  
    
        result = {}
        result['cd'] = 1
        result['un'] = un
        result['em'] = the_user['em']
        result['id'] = merchant_id
        result['dt'] = "User has been removed from the Leedz and Square authorization revoked"
        
        
        # SEND CONFIRMATION EMAIL
        send_userEmail( result )
        
        return handle_success(result)
  
  
  
    #
    # ERROR HANDLING
    #
    except Exception as error:
        return handle_error(error)
    






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