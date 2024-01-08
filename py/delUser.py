#
# DELETE USER
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
    
    # create a dictionary with error details
    error_dict = {'error': str(error)}
    
    # Convert the dictionary to a JSON string
    error_json = json.dumps(error_dict)
  
    print(error_json)
      
    return error_json
    
    



#
# flatten a list to a comma-delimited string
#
def listToString(lst):
    return ', '.join(str(x) for x in lst)


    
    
    
#   
# 
#
#
#
        
def lambda_handler(event, context):

    result = ""
    true = 1
    false = 0
    
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        # USERNAME - REQUIRED
        #
        un = validateParam(event, 'un', true)
        #print("USERNAME=" + un)

        
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
                logger.error(
                    "Couldn't delete user %s: %s: %s",
                    un, err.response['Error']['Code'], err.response['Error']['Message'])
                raise
        else:
                result = response['Attributes']
  
  
  
 
  
    #
    # ERROR HANDLING
    #
    except ClientError as error:
        result = handle_error(error)
    
    except BaseException as error:
        result = handle_error(error)

    
    print("GOT RESPONSE")
    print(result)
    
        

    response = {
    'statusCode': 200,
    'body': result,
    'headers': {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
    },
    }

    return response





