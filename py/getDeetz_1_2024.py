#
# GET DEETZ
#
# --> trade, leed id
# <-- leed details
#
#
# 1/2024
# return SQ payment link
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
    
    
    
    
    
#   
# will throw ValueError
#
#
def validateHeader( event, header, required ):
    
    if ('headers' not in event):
        raise ValueError("Http Request error.  Invalid request format")
    
    value = ""
    
    if (header not in event['headers']):
            if required:
                raise ValueError("Http Request error.  Invalid request format")
    else:
        value = event['headers'][header] 
        
    return value






    
#   
# will throw ValueError
#
#
def validateParam( event, param, required ):
    
    if ('queryStringParameters' not in event):
        raise ValueError("Http Request error.  Invalid request format")
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value



#
# build the projection expression
# 
# representing which details to return to the client
# do not send back info that is being hidden
# START_OPTS = "0000010011110";
#
# LOCKED  = 0;
# SHOWING = 1;
# OPTS_HIDDEN  = 2;
#
# 1/2024 - added Square QuickPay link for buy button
#
def buildProjExpr(op):
    
    # start with fields that MUST be returned
    expr = "pk,sk,cr,et,op,pr,sq_url,st,ti,zp,"
    
    # if it is a SHOW_ALL_OPTS - return buyer name and date_bought
    if (op =="0000000000000"):
        expr += "bn,db,"
    
    if (op[5] != '2'):
        expr += 'lc,'
        
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
# WHY pass leed options from client to DB instead of just
# reading them from the leed when it comes back from get_item?
#
# 11/2023:  BECAUSE we don't know if user making the request
# is the creator of the leed or the buyer
# this gives more flexibility in return values to client
# than sending the un of the requester --> all or none
#
        
def lambda_handler(event, context):

    
    result = {}
    FALSE = 0
    TRUE = 1

    
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')


        # REQUESTER
        un = validateParam(event, 'un', TRUE)
        # logger.info("TRADE NAME=" + tn)

        
        # TRADE NAME
        tn = validateParam(event, 'tn', TRUE)
        # PRIMARY KEY
        pk = "leed#" + tn


        id = validateParam(event, 'id', TRUE)
        # logger.info("LEED ID=" + str(id))

    
        # options go in headers
        op = validateHeader(event, 'op', FALSE)
        if (not op):
            op = "0000020022110"
        # default to START_OPTS
        # logger.info("GOT OPTIONS: " + op)
        exp_str = buildProjExpr(op)
        

    
        try:
            response = table.get_item(
                Key={'pk': pk, 'sk': id},
                ProjectionExpression=exp_str
                )
        
        
            if ('Item' not in response):
                msg = "Leed not found [" + tn + "] " + id
                raise ValueError(msg)
                
            else:
                result = response['Item']
        

        
            # logger.info("GOT RESPONSE!")
            logger.info( result )
            
            

            # FINAL CHECK -- cannot change leed opts if leed requester != creator or buyer
            #
            all_access = FALSE
            if (result['cr'] == un):
                all_access = TRUE
            
            if ('bn' in result and result['bn'] == un):
                all_access = TRUE
            
            if not all_access and (result['op'] != op):
                raise Exception("Not authorized to view full leed details")

        
        
        except Exception as err:
                
                msg = "Error finding leed details: " + str(err)
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






