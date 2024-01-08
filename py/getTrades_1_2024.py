#
# GET TRADES
#
#
#
import json
import json.encoder
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
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

    err_msg = str(error)
    logger.error(err_msg)
    return err_msg
    


    

    

# remove metadada and anything except the Items section containing scan results
#
def sortAndTrim( db_items ):
    
    
    json_output = []    
    for item in db_items:
        
        json_item = {}
        
        for key, value in item.items():
    
            if (key == 'pk'):
                continue
    
            if (key == 'nl'):
                value = int( json.dumps(value, cls=DecimalJsonEncoder) )
             
            # only insert sk=tradename and nl=numleedz
            json_item[key] = value
    
            
        # keep the output listed sorted by nl
        insertSorted(json_output, json_item)
    

    return json.dumps(json_output, cls=DecimalJsonEncoder)
    
    


# insert into the array sorted by nl num_leedz
#
def insertSorted(output, item):
    
  
    
    index = 0
    length = len(output)
    while (index < length) :
        
        if (item['nl'] > output[index]['nl']):
            output.insert(index, item)
            return
        else :
            index += 1
            
    # if we get here, insert at the end
    output.append(item)
    

    
    
    


#
#
#
#
def lambda_handler(event, context):

    
    result = ""
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')


        fromDB = table.query(
            KeyConditionExpression=Key('pk').eq('trade'),
            ScanIndexForward=False
        )

        if fromDB is None:
            raise ValueError("No trades in DB")
        
        if 'Items' not in fromDB:
            raise ClientError("No trades returned from DB")


        result = sortAndTrim( fromDB['Items'] )
        
    
    except ValueError as e:
        result = handle_error(e)
        
        
    except ClientError as e:
        result = handle_error(e)
  
  

   
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
