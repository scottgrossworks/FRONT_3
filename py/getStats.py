#
# GET STATS for the front page
#
#
#
#
#
import json
import json.encoder
from decimal import Decimal
import boto3
import logging






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

    err_msg = json.dumps(str(error), cls=DecimalJsonEncoder)
    logger.error(err_msg)
    return err_msg
    


    

    
    


#
#
#
#
def lambda_handler(event, context):

    
    result = ""
    try:

        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')


        pk = "stats"
        sk = "leedz"

        response = table.get_item(
            Key={'pk': pk, 'sk': sk}
        )
        
      
        if ('Item' not in response):
            raise ValueError("Leed stats not found")
            
        else:
            result = json.dumps( response['Item'], cls=DecimalJsonEncoder)
            
        
        
        
    except Error as e:
        result = handle_error(e)

  

    logger.info( result )   
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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
            },
    }

    return response
