#
# DELETE LEED
# 
# 12/2023
# do not change stats -- stats only grow
#

import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import logging

from decimal import Decimal



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
def handle_error(error):
       
    msg = str(error)
    logger.error(msg)
    
    result = {}
    result['cd'] = 0
    result['er'] = msg
    
    return result
    
 
    
    

    
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
# update the num_leedz for this trade
# will throw error
#
def decrementLeedCounter(table, tn):

    try:
        response = table.update_item(
            Key={ 'pk': 'trade', 'sk': tn },
            UpdateExpression="SET nl = nl - :dec",
            ExpressionAttributeValues={ ":dec": 1 },
            ConditionExpression='attribute_exists(sk)'
        )
    
        return response
    
        
    
    except ClientError as err:
        msg = str(err)
        logger.error("Couldn't increment leed counter for trade " + tn + ": " + msg)
        raise
    

      
      
      
        
        
        
        
    
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

         
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', true)
        
        pk = "leed#" + tn
   
        # ID - REQUIRED
        #
        id = validateParam(event, 'id', true)
  
    
        result = {}


        try:
                        
            response = table.delete_item(

                Key={
                    'pk': pk,
                    'sk': id 
                    },
                    ReturnValues='ALL_OLD'
            ) 
            
      
            logger.info(response)
            
            if (response['ResponseMetadata']['HTTPStatusCode'] != 200) :
                msg = "Delete Failed: " + tn + " id: " + sk + " Error: " + str(err)
                logger.error(msg)
                raise ValueError(msg)
            
            
            if 'Attributes' not in response :
                msg = "Leed not found: (" + tn + ") " + id
                logger.error( msg )
                raise ValueError(msg)
            
           
             
        except ClientError as err:
                msg = "Delete Failed: " + tn + " id: " + sk + " Error: " + str(err)
                logger.error(msg)
                raise
            
    
        
        else:
                #
                # SUCCESS
                #
                del_leed = response['Attributes']
                
                result['cd'] = 1
                result['ti'] = del_leed['ti']
                result['pr'] = del_leed['pr']
                
                
  
        #
        # decrement leed counter
        #
        decrementLeedCounter(table, tn)

  
    #
    # ERROR HANDLING
    #
    except ClientError as e1:
        result = handle_error(e1)
    
    except BaseException as e2:
        result = handle_error(e2)
    
    except Exception as e3:
        result = handle_error(e3)
        


    the_json = json.dumps(result, cls=DecimalJsonEncoder)
 
    
    return createHttpResponse( the_json )




    
#
# Create the HTTP response object
#
#
def createHttpResponse( result ):
   
    response = {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
        },
        'body': result,
    }


    logger.info("!!!!!! RETURNING RESPONSE")
    logger.info(response)
    
    
    return response


