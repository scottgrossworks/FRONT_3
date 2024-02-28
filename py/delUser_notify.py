#
# REQUEST DELETE USER
#
# 
#

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import _datetime
from decimal import Decimal
import json

import logging



logger = logging.getLogger()
logger.setLevel(logging.INFO)

        

        
#
# current time since epoch GMT (hopefully)
#
def getToday():
    today = str( _datetime.date.today() )
    return today




 
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
        
        
        




    
    

# SUCCESS!
# simplify return value
# {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1} 
def handle_success( un, em ) :
    
    result = {}
    result['un'] = un
    result['em'] = em
    result['cd'] = 1
        
    the_json = json.dumps(result, cls=DecimalJsonEncoder)
    
    return the_json
    
        
        

# ERROR!
#
# {'er': " + err_str + ",'cd': 0} 
#
def handle_error( the_error ):
       
    err_str = str( the_error )
    logger.error(err_str)
    result = {
                'er': err_str,
                'cd':0 
            }

    the_json = json.dumps(result, cls=DecimalJsonEncoder)
    
    return the_json
    
 
 
 



    
    
    
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
# will throw Error
#
#
def findUser( table, un ):
    
    pk = "user"
    
    the_user = ""
    try:
        response = table.get_item(
            Key={'pk': pk, 'sk': un}
        )
        
        # logger.info(response['Item'])
        
        if ('Item' not in response):
            msg = "User not found: " + un
            raise Exception( msg )
        
        else:
            the_user = response['Item']
            return the_user
        
    
    except Exception as err:
        
        msg = "Error findingu user [ " + un + " ]: " + str(err)
        logger.error(msg)
        raise err
    
        




#
#
#
def sendDeleteEmail( the_user ):
    
    SENDER = "admin@theleedz.com" # must be verified in AWS SES Email
    RECIPIENT = "theleedz.com@gmail.com"
    SUBJECT = "Delete User request"
    
    the_date = "Date: " + getToday()
        
    intro = "Leed Delete Request"
    user_preview = "User: " + the_user['sk'] + " Email: " + the_user['em']
    user_detail = str(the_user)


    # The email body for recipients with non-HTML email clients
    BODY_TEXT = (
        intro + "\r\n" +
        user_preview + "\r\n" +
        the_date + "\r\n" +
        user_detail 
    )
               
                
    # The HTML body of the email
    BODY_HTML = "<html><head></head><body><h1>" + intro + "</h1><BR>" + user_preview + "<BR>" + the_date + "<BR>" + user_detail


    try:
        
        # Create a new SES resource and specify a region.
        client = boto3.client('ses',region_name="us-west-2")
        
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': BODY_HTML
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
        
    # Display an error if something goes wrong.	
    except Exception as error:
        raise
    
    
    
        
    
    
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


        
        # UN -- REQUIRED
        # WHO IS REQUESTING DELETION?
        # 
        un = validateParam(event, 'un', 1)
        
        the_user = findUser( table, un )
        
        sendDeleteEmail( the_user )
        
        # SUCCESS!
        result = handle_success( the_user['sk'], the_user['em'] )
        
                 
    except Exception as error:
        result = handle_error(error)

       
    finally:
        return createHttpResponse( result )





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
    
    logger.info(result)
    
    return response
