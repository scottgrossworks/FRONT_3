#
#
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
# 
#
#
#
        
def lambda_handler(event, context):

    result = ""
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        true = 1
        false = 0
        
    
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', true)
        # print("TRADE NAME=" + tn)


        # NUM LEEDZ - OPTIONAL
        #
        nl = validateParam(event, 'nl', false)
        num_leedz = 0
        if (nl):
            num_leedz = int(nl)

        
        try:
                        
            response = table.put_item(
                Item={
                    'pk': "trade",
                    'sk': tn,
                    'nl': num_leedz
                },
               ConditionExpression='attribute_not_exists(sk)'
            )
            
            
            
        except ClientError as err:
                
                logger.error(
                    "Couldn't add trade %s: %s: %s",
                    tn, err.response['Error']['Code'], err.response['Error']['Message'])
                
                if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
                    # ERROR: trade already exists
                    msg = 'Trade already exists: ' + tn
                    logger.error(msg)
                    raise ValueError(msg)
                    
                raise    
        
        
        else:
                return createHttpResponse(200, response)
  
  
    #
    # ERROR HANDLING
    #
    except ValueError as error:
        return createHttpResponse(204, str(error))
    
    except ClientError as error:
        return createHttpResponse(400, handle_error(error))
    
    except BaseException as error:
        return createHttpResponse(400, handle_error(error))

    
    
    
    
#
#
#
#
    
def createHttpResponse(the_code, the_result):
    
    response = {
        'statusCode': the_code,
        'body': the_result,
        'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
        },
    }

    return response







ERROR_HELP_STRINGS = {
    # Common Errors
    'InternalServerError': 'Internal Server Error, generally safe to retry with exponential back-off',
    'ProvisionedThroughputExceededException': 'Request rate is too high. If you\'re using a custom retry strategy make sure to retry with exponential back-off.' +
                                              'Otherwise consider reducing frequency of requests or increasing provisioned capacity for your table or secondary index',
    'ResourceNotFoundException': 'One of the tables was not found, verify table exists before retrying',
    'ServiceUnavailable': 'Had trouble reaching DynamoDB. generally safe to retry with exponential back-off',
    'ThrottlingException': 'Request denied due to throttling, generally safe to retry with exponential back-off',
    'UnrecognizedClientException': 'The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying',
    'ValidationException': 'The input fails to satisfy the constraints specified by DynamoDB, fix input before retrying',
    'RequestLimitExceeded': 'Throughput exceeds the current throughput limit for your account, increase account level throughput before retrying',
}


