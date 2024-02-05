#
# ADD USER
#
# Being called primarily from Cognito HostedUI Lambda Trigger
#

import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import logging




logger = logging.getLogger()
logger.setLevel(logging.INFO)




#
#
#
#
def handle_error(error):
    
    # create a dictionary with error details
    error_dict = {'error': str(error)}
    # Convert the dictionary to a JSON string
    error_json = json.dumps(error_dict)
  
    logger.error(error_json)
      
    return error_json
    
    

    
    
    
#   
# will throw ValueError
#
def validateParam( event, param, required ):
    
    value = ""
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param]   # GOTCHA
        
    return value





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
# 
#
#
#
        
def lambda_handler(event, context):

    result = ""
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        TRUE = 1
        FALSE = None
        NO_VAL = None
        NEW_USER = "new"
        
        
        fromUI = ('triggerSource' in event and event['triggerSource'] == "PostConfirmation_ConfirmSignUp")
        
        if (fromUI):
            if ('userAttributes' not in event['request']):
                raise ValueError("Cognito -> Lambda trigger error.  No 'userAttributes' in event.request.userAttributes")
    
            un = event['userName']
            em = event['request']['userAttributes']['email']
    
        
    
        # USERNAME - REQUIRED
        if not fromUI:
            un = validateParam(event, 'un', TRUE)
        # print("USERNAME=" + un)


        # EMAIL - REQUIRED
        if not fromUI:
            em = validateParam(event, 'em', TRUE)
        # print("EMAIL=" + em)
         
    
        # WEBSITE - OPTIONAL
        ws = ""
        if not fromUI:
            ws = validateParam(event, 'ws', FALSE)
    
        
        # ABOUT - OPTIONAL
        ab = ""
        if not fromUI:
            ab = validateParam(event, 'ab', FALSE)
    
    
        # ZIP - OPTIONAL
        zp = 0
        if not fromUI:
            zp = validateParam(event, 'zp', FALSE)
        
        
        # ZIP RADIUS - OPTIONAL
        zr = 0
        if not fromUI:
            zr = validateParam(event, 'zr', FALSE)


        # BADGES - OPTIONAL
        # 12/5 start everyone with an OG badge
        bg = START_BG = '0,1'
        if not fromUI:
            bg = validateParam(event, 'bg', FALSE)


        # SUBSCRIPTIONS - OPTIONAL
        sb = ""
        if not fromUI:
            sb = validateParam(event, 'sb', FALSE)
    
        #
        # 1/3/2024
        # Square
        # sq_at = encrypted_access_token
        # sq_rt = encrypted_refresh_token 
        # sq_st = state
        # sq_ex = expires_at

        try:
                        
            response = table.put_item(
                Item={
                    'pk': 'user',
                    'sk': un,
                    'em': em,
                    'ws': ws,
                    'ab': ab,
                    'zp': intOrZero(zp),
                    'zr': intOrZero(zr),
                    'bg': bg,
                    'sb': sb,
                    'lb': 0,
                    'lp': 0,
                    'ls': 0,
                    'sq_at': NO_VAL,
                    'sq_ex': 0,
                    'sq_id': NO_VAL,
                    'sq_rt': NO_VAL,
                    'sq_st': NEW_USER
                },
               ConditionExpression='attribute_not_exists(pk) and attribute_not_exists(sk)'
            )
            
            
        
        
            # logger.info(response)
            
        except ClientError as err:
                logger.error(
                    "Couldn't add user %s, %s: %s: %s",
                    un, em, err.response['Error']['Code'], err.response['Error']['Message'])
                
                if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
                    # ERROR: user already exists
                    msg = 'User already exists: ' + un
                    logger.error(msg)
                    raise ValueError(msg)
                    
                raise    
        
        
        else:
                result = response
  
  
  
  
    #
    # ERROR HANDLING
    #
    except ClientError as error:
        result = handle_error(error)
    
    except BaseException as error:
        result = handle_error(error)

    
    logger.info( result )
        
        

    #response = {
    #'statusCode': 200,
    #'body': result,
    #'headers': {
    #'Content-Type': 'application/json',
    #'Access-Control-Allow-Origin': '*'
    #},
    #}
    #
    #return response

    # 12/5
    # return event object back to Hosted UI
    #
    return event


