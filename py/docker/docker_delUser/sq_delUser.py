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
from datetime import datetime as dt, timezone, timedelta


logger = logging.getLogger()
logger.setLevel(logging.INFO)






# return the current time in milliseconds based on the Pacific USA time zone.
#
def now_milliseconds():
    current_time = dt.now(timezone(timedelta(hours=-8)))
    epoch = dt(1970, 1, 1, tzinfo=timezone(timedelta(hours=-8)))
    milliseconds_since_epoch = int((current_time - epoch).total_seconds() * 1000)
    return milliseconds_since_epoch
    

#
# convert a long date from now_milliseconds() into a pretty date
# January 05, 2024 - 11:29
#
def prettyDate( the_date ):
    
    if (not the_date) :
        return ""
    
    int_date = int(the_date)
    timestamp = dt.fromtimestamp( int_date / 1000)  # Convert milliseconds to seconds
    formatted_date = timestamp.strftime("%B %d, %Y - %H:%M")
    return formatted_date
    
    
    
    
    
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
def delete_CognitoUser( user_pool_ID, un ):
    
    try:
        client = boto3.client('cognito-idp')

        response = client.admin_delete_user(
            UserPoolId=user_pool_ID,
            Username=un
        )
        return response
    
    
    except ClientError as err:
       if err.response['Error']['Code'] == 'UserNotFoundException':
            logger.info("Cognito user not found " + un + " : " + str(err))
       else:
            logger.error("Error deleting Cognito user " + un + " : " + str(err))

    except Exception as err:
        logger.error("Error deleting Cognito user " + un + " : " + str(err))
        # DO NOT FAIL
    
    

    
    
  
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

        else:
            result = response['Attributes']
            return result
        

    except ClientError as err:
        logger.error("Could not delete user %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise
    
    except Exception as err:
        logger.error("Error deleting Leedz user " + un + " : " + str(err))
        raise

   
   
   
   
      
    
            


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
    # Convert the dictionary to a JSON string
    the_json = json.dumps( the_dict )

    return createHttpResponse( the_json )



#
#
#        result['cd'] = 1
#        result['un'] = un
#        result['em'] = the_user['em']
#        result['id'] = merchant_id
#        result['dt'] = "User has been removed from the Leedz and Square authorization revoked"
#
# SEND user account delete confirmation RECEIPT EMAIL
# use SES service
#
def send_adminEmail( the_user ):
    
    SENDER = "admin@theleedz.com" # must be verified in AWS SES Email
    RECIPIENT = the_user['em']
    CC = "theleedz.com@gmail.com"
    SUBJECT = "Leedz User Deleted: " + the_user['un']
    
    user_info = "[" + the_user['un'] + "] " + the_user['em']


    # The email body for recipients with non-HTML email clients
    BODY_TEXT = ("Leedz user has been deleted."
                + "\r\n" + 
                user_info
                + "\r\n" + 
                "Square authorization revoked for: " + the_user['id'] 
                + "\r\n" + 
                "Square merchant: " + the_user['id']
                + "\r\n" + 
                "You will need to create a new account and re-auhtorize Square to use the Leedz again."
                + "\r\n" + 
                "Thank you,"
                + "\r\n" + 
                "The Leedz"
                )

                
    # The HTML body of the email
    BODY_START = "<html><head></head><body><b>Leedz user has been deleted. " + user_info + "</b><BR><BR>Square authorization revoked for merchant: " + the_user['id']
    BODY_MID = "<BR><BR>You will need to create a new account and re-auhtorize Square to use the Leedz again."
    BODY_END = "<BR><BR>Thank you,<BR>The Leedz</body></html>"
    

    try:
        
        # Create a new SES resource and specify a region.
        client = boto3.client('ses',region_name="us-west-2")
        
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
                'CcAddresses': [
                    CC,
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

        # COGNITO USER POOL - REQUIRED
        #
        cognito_pool = validateEnviron("user_pool_ID", TRUE)


        # LEEDZ USER
        #
        the_user = None
        try:

            fromDB = table.get_item(Key={"pk": "user", "sk" : un})
                      
            if 'Item' not in fromDB:
                raise ValueError("Leedz user not found: " + un)
            
            the_user = fromDB['Item']


        except Exception as err:
            logger.error("Cannot find Leedz user [" + un + "] : " + str(err))
            raise err
        
        
        # EMAIL
        # should only occur in testing
        user_email = 'undefined'
        if ('em' in the_user):
            user_email = the_user['em']
        
        
        
        # SQUARE MERCHANT ID
        # may not be set if user is not authorized 
        merchant_id = 'unauthorized'
        
        
        # logger.info( the_user )
        
        
        if (('sq_id' not in the_user) or (the_user['sq_id'] == None) or (the_user['sq_id'] == "")) :
            logger.info("No Square Authorization found for user: " + un)
            # DO NOT FAIL
            
        else :
            # REVOKE SQUARE AUTHORIZATION
            # will throw Exception
            merchant_id = the_user['sq_id']
            try :

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
        # will NOT throw if user not found
        delete_CognitoUser( cognito_pool, un )
        
        #
        # DELETE LEEDZ USER
        # 
        delete_LeedzUser( table, un )
  
    
        result = {}
        result['cd'] = 1
        result['un'] = un
        result['em'] = user_email
        result['id'] = merchant_id
        result['dt'] = "User has been removed from the Leedz and Square authorization revoked"
        
        
        # SEND CONFIRMATION EMAIL
        send_adminEmail( result )
        
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