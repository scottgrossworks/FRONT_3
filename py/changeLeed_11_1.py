#
# CHANGE LEED
#
#
#

import json
import boto3
import decimal
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import random
import logging



logger = logging.getLogger()
logger.setLevel(logging.INFO)




 
#
# Use this to JSON encode the DYNAMODB output
#
#
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return str(o)
        return super().default(o)
    
    
    
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
# flatten a list to a comma-delimited string
#
def listToString(lst):
    return ', '.join(str(x) for x in lst)






#
#
#
def getLocationInfo( locationAPI , lc ):
    
    
    response = locationAPI.search_place_index_for_text(
            IndexName="Leedz_PlaceIndex",
            FilterCountries= ["USA"],
            Text=lc
            )
                

    # if any of these are null throw an error
    if 'Results' not in response:
        raise ValueError("Location Service cannot resolve location:" + lc)
    
    if 'Place' not in response['Results'][0]:
        raise ValueError("Location Service cannot resolve location:" + lc)
   
    place = response['Results'][0]['Place']
    location = place['Geometry']
   
    return location
            
     
     

    
    
    
    
    
    
    
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
def changeLeed(update_expr, attr_vals, tn, id):

    
    dynamodb_client = boto3.resource("dynamodb")
    table = dynamodb_client.Table('Leedz_DB')
  

    pk = "leed#" + tn
    response = []
    
    try:
            
        response = table.update_item(
            Key={
                'pk': pk,
                'sk': id,
            },
            ConditionExpression='attribute_exists(sk)',
            UpdateExpression= update_expr,
            ExpressionAttributeValues= attr_vals,
            ReturnValues='UPDATED_NEW'
        )
        
        
        if 'Attributes' not in response :
        
            logger.error("DB Error: No Attributes Updated: " + response)
            raise ValueError('DB Error:  Cannot change ' + tn + ' leed: ' + id)
        
    
    
    except ClientError as err:
    
        if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
            msg = 'DB Error: ' + tn + ' leed not found: ' + id
            logger.error( msg )
            response = msg
            
        else:
            response = handle_error(err)
    
    except Exception as error:
        
        logger.error("Change Leed: " + str(error))
        response = handle_error(error)
  
  

    return response
    
    
    
    
    
    
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
        
        
        # TRADE NAME - REQUIRED
        # 11/1/23 CANNOT CHANGE 
        #
        tn = validateParam(event, 'tn', true)
        
        update_expr = 'SET'
        attr_vals = {}
        
        
        # ID - REQUIRED
        # DOESN'T CHANGE
        # 
        id = validateParam(event, 'id', true)

   
        
        # TITLE
        if ('ti' in event['queryStringParameters']):
            ti = event['queryStringParameters']['ti']
            update_expr += ' ti=:ti,'
            attr_vals[':ti'] = ti      
        
        
        
        # EMAIL
        if ('em' in event['queryStringParameters']):
            em = event['queryStringParameters']['em']
            update_expr += ' em=:em,'
            attr_vals[':em'] = em
        

   
        # PHONE
        if ('ph' in event['queryStringParameters']):
            ph = event['queryStringParameters']['ph']
            update_expr += ' ph=:ph,'
            attr_vals[':ph'] = ph
            
            

        
        # if lc is set
        # zip must also be set
        #
        # XY
        # lat,lng
        # COMPUTE FROM LOCATION DATA
        # 
        # ADDRESS VALIDATION
        #
        lc = validateParam(event, 'lc', false)
        if lc:
            
            update_expr += ' lc=:lc,'
            attr_vals[':lc'] = lc
            
            locationAPI = boto3.client('location')
            
            # this will validate the address and throw Errors
            loc_info = getLocationInfo( locationAPI, lc )
            zip_coords = loc_info['Point']
            
            xy = listToString(zip_coords)
            update_expr += ' xy=:xy,'
            attr_vals[':xy'] = xy
            
            # zip also required -- not user generated
            # will throw error
            zp = validateParam(event, 'zp', true)
            update_expr += ' zp=:zp,'
            attr_vals[':zp'] = zp

            
        
        
        
        # START TIME
        # 
        if ('st' in event['queryStringParameters']):
            st = event['queryStringParameters']['st']
            update_expr += ' st=:st,'
            attr_vals[':st'] = int(st)
        
   
        # END TIME 
        # 
        if ('et' in event['queryStringParameters']):
            et = event['queryStringParameters']['et']
            update_expr += ' et=:et,'
            attr_vals[':et'] = int(et)
        

        # DETAILS 
        # 
        if ('dt' in event['queryStringParameters']):
            dt = event['queryStringParameters']['dt']
            update_expr += ' dt=:dt,'
            attr_vals[':dt'] = dt

        
        
        # REQS
        #
        if ('rq' in event['queryStringParameters']):
            rq = event['queryStringParameters']['rq']
            update_expr += ' rq=:rq,'
            attr_vals[':rq'] = rq


   
        # PRICE
        #
        if ('pr' in event['queryStringParameters']):
            pr = event['queryStringParameters']['pr']
            update_expr += ' pr=:pr,'
            attr_vals[':pr'] = pr


         
   
        # OPTIONS
        #
        if ('op' in event['queryStringParameters']):
            op = event['queryStringParameters']['op']
            update_expr += ' op=:op,'
            attr_vals[':op'] = op
         
        
        
        # REMOVE THE LAST TRAILING CHAR
        update_expr = update_expr.rstrip(update_expr[-1])
        
        
        #
        # WILL THROW ERROR
        result = changeLeed(update_expr, attr_vals, tn, id)
        

     
           
                 
    #
    # ERROR HANDLING
    #
    except ClientError as error:
        result = handle_error(error)
    
    except BaseException as error:
        result = handle_error(error)



    the_json = json.dumps(result, cls=DecimalEncoder)

    return createHttpResponse( the_json )







# json.dumps(some_object, cls=DecimalEncoder)
    
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


    return response
