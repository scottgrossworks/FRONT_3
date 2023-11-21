#
# GET DEETZ
#
# --> trade, leed id
# <-- leed details
#

import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from decimal import Decimal
import logging





logger = logging.getLogger()
logger.setLevel(logging.INFO)






 
#
# Use this to JSON encode the DYNAMODB output
#
#
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            long_str = str(obj)
            short_str = long_str.strip("Decimal()")
            return short_str
        return json.JSONEncoder.default(self, obj)
    
    
    


#
#
#
#
def handle_error( msg ):
  
    logger.error( msg )
    ret_obj = { "cd": 0,
                "err": msg
            }
    
    return ret_obj
    
    
    
    
    
# This code defines a convert_sets_to_lists function that recursively traverses the JSON object 
# and converts any sets to lists. It also converts any Decimal objects to strings, which are JSON serializable.
# After running this code, the output will be a JSON string that does not contain any sets and can therefore
# be serialized without errors.    
def convert_sets_to_lists(obj):
    if isinstance(obj, set):
        #print(f"GOT A SET=", obj)
        #return list(obj)
        return [convert_sets_to_lists(elem) for elem in obj]
    elif isinstance(obj, dict):
        #print(f"GOT A DICT=", obj)
        return {k: convert_sets_to_lists(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        #print(f"GOT A LIST=", obj)
        return [convert_sets_to_lists(elem) for elem in obj]
    elif isinstance(obj, Decimal):
        #print(f"GOT A DECIMAL=", obj)
        return str(obj)
    else:
        return obj



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
    
    if ('queryStringParameters' not in event):
        raise ValueError("Http Request error.  No query string parameters found")
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value



#
# build the projection expression
# "pk,sk,lc,dt,rq,em,ph,pr"
# representing which details to return to the client
# do not send back info that is being hidden
# START_OPTS = "0000021122110";
# LOCKED  = 0;
# SHOWING = 1;
# OPTS_HIDDEN  = 2;

def buildProjExpr(op):
    
    # start with fields that MUST be returned
    expr = "pk,sk,pr,"
    
    if (op[5] != '2'):
        expr += 'lc,'
        
        
    if (op[7] != '2'):
        expr += 'et,'
    
    if (op[8] != '2'):
        expr += 'em,'
    
    if (op[9] != '2'):
        expr += 'ph,'
    
    if (op[10] != '2'):
        expr += 'dt,'
    
    if (op[11] != '2'):
        expr += 'rq,'
    
    # remove trailing comma
    return expr[:-1]
    
    
    
    
#   
# 
#
#
#
        
def lambda_handler(event, context):

    
    result = ""
    true = 1
    
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')


        tn = validateParam(event, 'tn', true)
        # logger.info("TRADE NAME=" + tn)
        pk = "leed#" + tn


        id = validateParam(event, 'id', true)
        # logger.info("LEED ID=" + str(id))


        op = validateParam(event, 'op', true)
        #"op" : "0000021122110"
        exp_str = buildProjExpr(op)
        

    
        try:
            response = table.get_item(
                Key={'pk': pk, 'sk': id},
                ProjectionExpression=exp_str
                )
        
        
        
            # logger.info("GOT RESPONSE!")
            # logger.info(response['Item'])
            
        
            if ('Item' not in response):
                msg = "Leed not found [" + tn + "] " + id
                raise ValueError(msg)
                
            else:
                result = response['Item']
        
        
        
        except Exception as err:
                
                msg = "Could not find Leed details: " + str(err)
                result = handle_error(msg)
        
        
  
  
    #
    # ERROR HANDLING
    #
    
    
    except ValueError as error:
        result = handle_error(str(error))
        
        
    except ClientError as error:
        
        if error.response['Error']['Code'] == 'ConditionalCheckFailedException':
            result = handle_error('Leed not found [' + tn + '] ' + id)
        else:
            result = handle_error(str(error))
    
    
    except BaseException as error:
        result = handle_error(str(error))



       
    finally:
 
        the_json = json.dumps(result, cls=DecimalEncoder)
        return createHttpResponse( the_json )








 
 
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



    # logger.info("RETURNING RESPONSE")
    # logger.info(response)
    
    
    return response






