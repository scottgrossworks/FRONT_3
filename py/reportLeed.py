#
# REPORT LEED
#
# 1/2024 - added email
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
        
        
        




    
    
#
#
#
# SUCCESS!
# simplify return value
# {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': 1} 
# {'er': " + err_str + ",'cd': 0} 
#
def handle_error( the_error ):
       
    err_str = str( the_error )
    logger.error(err_str)
    result = "{'er': " + err_str + ",'cd': 0}" 
    
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
# will throw Error
#
#
def reportLeed( table, tn, id, un ):
    
    pk = "leed#" + tn
    
    the_leed = ""
    try:
        response = table.get_item(
            Key={'pk': pk, 'sk': id}
        )
        
        logger.info("REPORT GOT ITEM!")
        logger.info(response['Item'])
        
        
        if ('Item' not in response):
            msg = "Leed not found [" + tn + "] " + id
            raise Exception( msg )
        
        else:
            the_leed = response['Item']
        
        
        sendReportEmail( the_leed, tn, un )
    
    
    except Exception as err:
        
        msg = "Error reporting leed [" + tn + "] " + id + ": " + str(err)
        logger.error(msg)
        raise err
    
    
    return the_leed
        




#
#
#
def sendReportEmail( the_leed, tn, un ):
    
    SENDER = "theleedz.com@gmail.com" # must be verified in AWS SES Email
    RECIPIENT = SENDER
    SUBJECT = "Leed reported: " + the_leed['sk']
    
    PRICE = str( the_leed['pr'] )
    
    
    un_leed_report = "Leedz user " + un + " reported a leed"   
    the_date = "Date: " + getToday()
    leed_summary = "[" + tn + "] " + the_leed['ti'] + " (" + PRICE + ")"
    leed_detail = str(the_leed)

    # The email body for recipients with non-HTML email clients
    BODY_TEXT = (
        un_leed_report + "\r\n" +
        the_date + "\r\n" +
        leed_summary + "\r\n\r\n" + 
        leed_detail
    )
               
                
    # The HTML body of the email
    BODY_START = "<html><head></head><body><h1>" + un_leed_report + "</h1><BR>" + the_date + "<BR>"
    BODY_MID = leed_summary + "<BR><BR>" + leed_detail
    BODY_END = "</body></html>"
    

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
                        'Data': BODY_START + BODY_MID + BODY_END
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
    true = 1
    false = 0
    
    
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')


        
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', true)
        
        
        # ID - REQUIRED
        # 
        id = validateParam(event, 'id', true)

        
        # UN -- REQUIRED
        # WHO IS REPORTING THIS LEED?
        # 
        un = validateParam(event, 'un', true)
        
        #
        # WILL THROW ERROR
        the_leed = reportLeed(table, tn, id, un)
        # logger.info(the_leed)
        
        # SUCCESS!
        # simplify return value
        result = {}
        result['id'] = id
        result['tn'] = tn
        result['ti'] = the_leed['ti']
        result['cd'] = 1
        
                 
    #
    # ERROR HANDLING
    #
    except Exception as error:
        result = handle_error(error)

    #
    # JSON-encode the result
    #
       
    finally:
 
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
    
    logger.info(result)
    
    return response
