#
# Called by Square Webhook after hosted payment checkout
# EVENT payment.created
# the Payment is authorized and complete
#
# https://developer.squareup.com/reference/square/payments-api/webhooks/payment.created
#
# This function:
#    BOOKEEPING - credit the buyer / seller and update stats
#    SEND EMAIL RECEIPTS
#

import json
import boto3
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from decimal import Decimal

from datetime import datetime as dt, timezone

import random
import logging



logger = logging.getLogger()
logger.setLevel(logging.INFO)



        
#
# current time since epoch GMT (hopefully)
#
def now_milliseconds():
    current_time = dt.now(timezone.utc)
    epoch = dt(1970, 1, 1, tzinfo=timezone.utc)
    milliseconds_since_epoch = int((current_time - epoch).total_seconds() * 1000)
    return milliseconds_since_epoch


#
# convert a long date from now_milliseconds() into a pretty date
# January 05, 2024 - 11:29
#
def prettyDate( the_date ):
    
    if (not the_date) :
        return ""
    
    int_date = int(the_date)
    timestamp = dt.fromtimestamp( int_date / 1000)  # Convert milliseconds to seconds
    formatted_date = timestamp.strftime("%B %d, %Y - %H:%M")
    return formatted_date

 
 
 
 


 
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










# ERROR
# {'er': " + err_str + ",'cd': '0'}
#
def handle_error(error):
       
    # create a dictionary with error details
    err_str = str(error)
    logger.error(err_str)

    ret_obj = {
        'er':err_str,
        'cd':0
    }
    return ret_obj
    
    
    
 

    
    
    
    
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







# SEND BUYER RECEIPT EMAIL
# use SES service
# Send a receipt with the full leed details to the buyer
# will throw Exception on error
#
def buyer_receiptEmail( the_leed, the_buyer, the_seller ):
    
    leed_info = the_leed['ti'] + " ($" + str(the_leed['pr']) + ")"
    
    SENDER = "theleedz.com@gmail.com" # must be verified in AWS SES Email
    RECIPIENT = the_buyer['em']
    # BCC = "theleedz.com@gmail.com"
    SUBJECT = "Leedz Receipt: " + the_leed['ti']
    

    # The email body for recipients with non-HTML email clients
    BODY_TEXT = ("You bought a leed! " + leed_info + 
                "\r\n\r\n" + 
                str(the_leed) +
                "\r\n\r\n" + 
                "Seller " + the_seller['sk'] + " - " + the_seller['em']
                + "\r\n" + 
                "Thank you,"
                + "\r\n" + 
                "The Leedz"
                )

    TITLE = "Title:  " + the_leed['ti'] + "<BR>"
    TRADE = "Trade:  " + the_leed['pk'][5:] + "<BR>"
    START_DATE = "Start:  " + prettyDate( int(the_leed['st']) ) + "<BR>"
    END_DATE = "End:  " + prettyDate( int(the_leed['et']) ) + "<BR>"
    LOC = "Address:  " + the_leed['lc'] + "<BR>"
    PHONE = "Phone:  " + str(the_leed['ph']) + "<BR>"
    EMAIL = "Email:  " + the_leed['em'] + "<BR>"
    DETAILS = "Details:  " + the_leed['dt'] + "<BR>"
    REQS = "Requirements:  " + the_leed['rq'] + "<BR>"
    
    SELLER = "<BR>Seller:  " + the_leed['cr'] + " -- " + the_seller['em'] + "<BR>"
    
    PRICE = "<BR><b style='font-size:large'>Price:  $" + str(the_leed['pr']) + "</b><BR>"
    
    DISCLAIMER = "<BR><b>*</b> This leed is not a confirmed booking.  You must use the contact information provided to sell your service to the client.  The Leedz guarantees you exclusive access to this information, which will now be removed from the calendar.  For more information, please refer to our <a href='http://theleedz.com/leedz_tos.html'>Terms of Service</a>."

    # The HTML body of the email
    BODY_START = "<html><head></head><body><b>You bought a leed!</b><BR><BR>" + leed_info + "<BR>"
    CONTACT = "<BR>Square will debit your account shortly.  For any questions, please contact The Leedz - <a href='mailto:theleedz.com@gmail.com'>theleedz.com@gmail.com</a>"
    BODY_END = "<BR><BR>Thank you,<BR>The Leedz</body></html>"
    

    try:
        
        # Create a new SES resource and specify a region.
        client = boto3.client('ses',region_name="us-west-2")
        
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ]
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': BODY_START + TITLE + TRADE + START_DATE + END_DATE + LOC + PHONE + EMAIL + DETAILS + REQS + SELLER + PRICE + DISCLAIMER + CONTACT + BODY_END
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
    
    
    



# SEND SELLER RECEIPT EMAIL
# use SES service
# Send a receipt with the full leed details to the buyer
# will throw Exception on error
#
def seller_receiptEmail( the_leed, the_buyer, the_seller ):
    
    leed_info = the_leed['ti'] + " ($" + str(the_leed['pr']) + ")"
    
    SENDER = "theleedz.com@gmail.com" # must be verified in AWS SES Email
    RECIPIENT = the_seller['em']
    BCC = "theleedz.com@gmail.com"
    SUBJECT = "Leed Sold! " + leed_info
    

    # The email body for recipients with non-HTML email clients
    BODY_TEXT = ("Congratulations, you sold a Leed!"
                + "\r\n" + 
                leed_info
                + "\r\n" + 
                "Seller: " + the_seller['sk'] + " - " + the_seller['em']
                + "\r\n" + 
                "Buyer: " + the_buyer['sk'] + " - " + the_buyer['em']
                + "\r\n" + "\r\n" + 
                "Square will credit your account shortly.  For any questions, please contact The Leedz - theleedz.com@gmail.com"
                + "\r\n" + "\r\n" +  
                "Thank you,"
                + "\r\n" + 
                "The Leedz"
                )

                
    # The HTML body of the email
    BODY_START = "<html><head></head><body><b>Congratulations, you sold a Leed!</b><BR><BR>" + leed_info + "<BR><BR>Seller: " + the_seller['sk'] + " - " + the_seller['em'] + "<BR><BR>Buyer: " + the_buyer['sk'] + " - " + the_buyer['em']
    BODY_MID = "<BR>Square will credit your account shortly.  For any questions, please contact The Leedz - <a href='mailto:theleedz.com@gmail.com'>theleedz.com@gmail.com</a>"
    BODY_END = "<BR><BR>Thank you,<BR>The Leedz</body></html>"
    

    try:
        
        # Create a new SES resource and specify a region.
        client = boto3.client('ses',region_name="us-west-2")
        
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
                'BccAddresses': [
                    BCC,
                ]
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
# BOOKEEPING
#
#

#
#
# Each seller user has a leedz_sold ls counter
# will throw error
#
def seller_incrementLeedzSold(table, un):
    
    # update the leedz posted for this user
    #
    try:
        response = table.update_item(
                Key={ 'pk': 'user', 'sk': un },
                UpdateExpression="SET ls = ls + :inc",
                ExpressionAttributeValues={ ":inc": 1 },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="ALL_NEW"
            )
    

        # throw an error
        #
        if 'Attributes' not in response:
            msg = "Error updating leedz sold for user: " + un
            logger.error(msg)
            raise ValueError(msg)
            
        
        # return just the SELLER user object
        #
        return response['Attributes']
    
    
    except ClientError as err:
        
        logger.error("Couldn't increment leedz sold for seller %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise

   




#
#
# Each buyer user has a leedz_bought lb counter
# will throw error
#
def buyer_incrementLeedzBought(table, un):
    
    
    # update the leedz posted for this user
    #
    try:
        response = table.update_item(
                Key={ 'pk': 'user', 'sk': un },
                UpdateExpression="SET lb = lb + :inc",
                ExpressionAttributeValues={ ":inc": 1 },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="ALL_NEW"
            )
    

        # throw an error
        #
        if 'Attributes' not in response:
            msg = "Error updating leedz bought for user: " + un
            logger.error(msg)
            raise ValueError(msg)
            
        
        # return just the user object
        #
        return response['Attributes']
    
    
    except ClientError as err:
        
        logger.error("Couldn't increment leedz bought for buyer %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise

    except Exception :
        raise

   
   
#        
#
# if the buyer user has more than 10 leedz bought - award the new badge 
# BADGE_4 --> 10+ leedz bought
#
#
def buyer_awardUserBadge( table, the_buyer ):      
    
    un = the_buyer['sk']
    lb = the_buyer['lb']
    
    leedz_bought = int(json.dumps( lb , cls=DecimalJsonEncoder))
    if ( leedz_bought < 10) :
        # buyer has not yet bought 10 leedz
        return
         
    if ('4' in the_buyer['bg']) :
        # badges already contains badge 4
        return
    
    # new badges string
    new_bg = the_buyer['bg'] + ',4'
    

    # update the badges string for this trade
    #
    try:
        response = table.update_item(
                Key={ 'pk': 'user', 'sk': un },
                UpdateExpression="SET bg = :new_bg",
                ExpressionAttributeValues={ ":new_bg": new_bg },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="NONE"
            )
            
            
        # logger.info("BADGES")
        # logger.info(response)
        return response
    
    
    except ClientError as err:
        
        logger.error("Couldn't award user badge 4 for buyer %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise
        





#        
#
# if the seller user has more than 10 leedz sold - award the new badge 
# BADGE_3 --> 10+ leedz sold
#
#
def seller_awardUserBadge( table, the_seller ):      
    
    ls = the_seller['ls']
    un = the_seller['sk']
    
    leedz_sold = int(json.dumps( ls , cls=DecimalJsonEncoder))
    if ( leedz_sold < 10) :
        # user has not yet sold 10 leedz
        return
         
    if ('3' in the_seller['bg']) :
        # badges already contains badge 3
        return
    
    # new badges string
    new_bg = the_seller['bg'] + ',3'
    

    # update the badges string for this trade
    #
    try:
        response = table.update_item(
                Key={ 'pk': 'user', 'sk': un },
                UpdateExpression="SET bg = :new_bg",
                ExpressionAttributeValues={ ":new_bg": new_bg },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="ALL_NEW"
            )
            
            
        # logger.info("BADGES")
        # logger.info(response)
        return response
    
    
    except ClientError as err:
        
        logger.error("Couldn't award user badge 3 for seller %s: %s: %s", un, err.response['Error']['Code'], err.response['Error']['Message'])
        raise
        

        

# increment bought date and buyer name
# raise Exception if not found
#
# un is buyer name
#
def leed_updatePurchaseInfo( table, tn, id, un ) :

    date_today = now_milliseconds()    
    pk = "leed#" + tn
    
    response = []
    
    # update the date_bought and buyer_name for this leed
    #
    try:
        response = table.update_item(
                Key={ 'pk': pk, 'sk': id },
                UpdateExpression="SET db=:date_today, bn=:un",
                ExpressionAttributeValues={ ":date_today": date_today, ":un": un },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="ALL_NEW"
            )
    
        
        # throw an error
        #
        if 'Attributes' not in response:
            msg = tn + " leed not found: " + id
            logger.error(msg)
            raise ValueError(msg)
        
        
        # return just the user object
        #
        return response['Attributes']
    
    
    except Exception as err:
        
        logger.error("Error updating purchase info for leed: " + id + ": " + str(err))
        raise

    







        

# UPDATE stats leedz
#
#
def updateStats( table, tn ) :

    date_today = now_milliseconds()    
    pk = "stats"
    sk = "leedz"
    
    response = []

    try:
        response = table.update_item(
                Key={ 'pk': pk, 'sk': sk },
                UpdateExpression="SET db=:date_today, lb=lb + :inc, ab=:tn",
                ExpressionAttributeValues={ ":date_today": date_today, ":inc": 1, ":tn":tn },
                ConditionExpression='attribute_exists(sk)',
                ReturnValues="ALL_NEW"
            )
    

        # throw an error
        #
        if 'Attributes' not in response:
            msg = "Cannot find stats leedz"
            logger.error(msg)
            raise ValueError(msg)
            
        
        # return just the user object
        #
        return response['Attributes']
    
    
    except Exception as err:
        
        logger.error("Error updating stats: " + str(err))
        raise

    




















    
#
# matching leed will have
# == tn    trade name
# == id    matching ID
#
# will throw Error if check succeeds
#
def checkForExistingLeed( table, tn, id ):
    
    response = []
    
    try:
        
        pk = "leed#" + tn     
        sk = id
  
        response = table.query(
            KeyConditionExpression=Key('pk').eq(pk) & Key('sk').eq(sk),
        )

    
    except ClientError as err:
            logger.error(
                "Error searching for matching leed %s: %s: %s",
                tn, err.response['Error']['Code'], err.response['Error']['Message'])
            raise
  
    
    if "Items" not in response:
        msg = tn + " leed not found: " + id 
        raise ValueError( msg )

    
    return response['Items'][0]




#
# PARSE note fromSQUARE event
# will throw Error if Webhook response not contain note / invalid format
#
def getLeedzInfo(body):
    
    # check for errors
    if 'data' not in body:
        raise Exception("Malformed Square Webhook response: missing 'data'")
    if 'object' not in body['data']:
        raise Exception("Malformed Square Webhook response: missing 'data.object'")
    if 'payment' not in body['data']['object']:
        raise Exception("Malformed Square Webhook response: missing 'data.object.payment'")
    if 'status' not in body['data']['object']['payment']:
        raise Exception("Malformed Square Webhook response: missing 'data.object.payment.status'")
        
        
    #
    # STATUS
    #
    payment = body['data']['object']['payment']

    if payment['status'] in ['CANCELED', 'FAILED']:
        raise Exception("Square purchase has not been approved: " + payment['status'])
    
    #
    # NOTE
    #
    if 'note' not in payment:
        raise Exception("Malformed Square Webhook response: missing 'data.object.payment.note'")

    # Extract the note
    note = payment['note']
    if not note:
        raise Exception("Malformed Square Webhook response: empty 'data.object.payment.note'")

    # Split and validate the note format
    note_parts = note.split('|')
    if len(note_parts) != 3:
        raise Exception("Malformed Square Webhook 'data.object.payment.note' format: " + note)

    return note_parts
   

    

    
#   
# 1/2024 
# being called by Square Webhook API
# https://developer.squareup.com/reference/square/payments-api/webhooks/payment.created
#
# MUST return 200 status code
        
def lambda_handler(event, context):

    
    the_json = ""
    TRUE = 1
    leed_id = "leed_id"
    tn = "trade"
    un = "buyer"
    
    try:
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')
       

        # COMING FROM SQUARE
        if ( ('headers' in event) and ('x-square-signature' in event['headers']) ):
            
            body = json.loads(event['body'])
   
            # will throw Exception if body is missing Leedz 'note'
            leedz_info = getLeedzInfo(body)
            leed_id = leedz_info[0]
            tn = leedz_info[1]
            un = leedz_info[2]
        
        
        # COMING FROM TEST
        else: 

            # BUYER  - REQUIRED
            # un
            # username
            un = validateParam(event, 'un', TRUE)
            
            # LEED
            # tn
            # TRADE NAME - REQUIRED
            tn = validateParam(event, 'tn', TRUE)

            # LEED
            # id
            # ID - REQUIRED
            leed_id = validateParam(event, 'id', TRUE)

        
        
        ##
        ## BOOKEEPING
        ##
        
        # increment leed bought date and buyer name
        # Call the asynchronous function using asyncio.run()
        the_leed = leed_updatePurchaseInfo(table, tn, leed_id, un)

        
        # increment buyer and seller counters
        #
        the_buyer = buyer_incrementLeedzBought( table, un )
        
        the_seller = seller_incrementLeedzSold( table, the_leed['cr'] )
        
        # award badges
        #
        buyer_awardUserBadge( table, the_buyer )
        
        seller_awardUserBadge( table, the_seller )


        # UPDATE stats page
        #
        updateStats(table, tn)
        
        
        # SEND RECEIPT TO BUYER
        #
        buyer_receiptEmail( the_leed, the_buyer, the_seller )
        
        
        # SEND RECEIPT TO SELLER
        #
        seller_receiptEmail( the_leed, the_buyer, the_seller )
            
            
        
        # SUCCESS
        #
        # return FULL LEED DETAILS
        #
        # {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",.....} 
        #
        the_json = json.dumps( the_leed, cls=DecimalJsonEncoder )
       
       
       
              
    #
    # ERROR HANDLING
    #
    except ClientError as error:

        
        if error.response['Error']['Code'] == 'ValidationException' or error.response['Error']['Code'] == 'ConditionalCheckFailedException':
            # one or more attribute fields doesn't match DB config
            buyer_msg = " Buyer: " + un
            msg = "Error buying leed [" + tn + "] id: " + leed_id + buyer_msg
            result = handle_error(msg)
            
        else :
            result = handle_error(error)
        
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
    
     
    
    except Exception as error:
        
        result = handle_error(error)
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
       
    


    # MUST respond with 200 to SQUARE API
    return createHttpResponse( 200, the_json )


    
    
 
 

#
# Create the HTTP response object
#
#
def createHttpResponse( code, result ):
   
    # logger.info(result)
    
    response = {
        'statusCode': code,
        'body': result,
        'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
            },
    }

    logger.info(response)
    return response





