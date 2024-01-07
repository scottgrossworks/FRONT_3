#
# BUY LEED (BEGIN)
#
# 1/2024
# the payment is NOT COMPLETE
#
# REQUIRES environ vars
#    sq_checkout_url
#    sq_location_id
#
# BOOKEEPING will be completed in callback from Square once purchase complete
#

import os
import json

import urllib.request

import boto3
from botocore.exceptions import ClientError
from decimal import Decimal

from datetime import datetime, timezone


import logging



logger = logging.getLogger()
logger.setLevel(logging.INFO)



        
#
# current time since epoch GMT (hopefully)
#
def now_milliseconds():
    current_time = datetime.now(timezone.utc)
    epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
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
    timestamp = datetime.datetime.fromtimestamp( int_date / 1000)  # Convert milliseconds to seconds
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











#
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
# return int value or zero if val is ""
#
def intOrZero( val ):

    try:
        if (val):
            return int(val)
        else:
            return 0
        
    except Exception:
        logger.error("Cannot convert value to int: " + val)
        raise





#
# flatten a list to a comma-delimited string
#
def listToString(lst):
    return ', '.join(str(x) for x in lst)


     


#
#
#
#
def validateEnviron( var, required ):
    
    the_val = ""
    try:
        the_val = os.environ[var]
    except Exception:
        if required:
            raise ValueError("Environment Variable not found: " + var)
        the_val = ""
        
    return the_val
    
    
    
    
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
# STEP 1 of Checkout
# return to Javascript Client with Square QuickPay Checkout link
#
#
def lambda_handler(event, context):

    the_json = ""
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        TRUE = 1

        # BUYER  - REQUIRED
        # un
        # bn - buyer name
        #
        bn = validateParam(event, 'un', TRUE)
        
        
        # LEED
        # tn
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', TRUE)

        
        # LEED
        # Square Order ID 
        # ID - REQUIRED
        #
        id = validateParam(event, 'id', TRUE)

        
        # !!!  the payment is NOT COMPLETE !!!
        #

        # will throw error if leed has completed checkout
        # and has bn == buyer_name set in callback
        the_leed = getLeedInfo(table, tn, id)
        
        # 1/2024
        # retrieves the full DB entry for the seller
        # seller_info contains SQUARE authorization
        seller_info = getSellerInfo(table, bn, tn, id)
         
         
        # generate Square QuickPay Checkout Link
        # code buyer and trade name into link
        sq_pay_link = createPaymentLink(seller_info, the_leed, bn)
        # 1/2024
        # DO NOT store the_leed.bn until callback lambda AFTER Square payment authorized
        
        # SUCCESS
        sq_order_id = sq_pay_link['order_id']
        sq_long_url = sq_pay_link['long_url']
       
        # create a dictionary with details        
        # 
        ret_obj = {
            'id':id,
            'tn':tn,
            'ti':the_leed['ti'],
            'sq_oid':sq_order_id,
            'sq_url':sq_long_url,
            'cd':1
        }
        
        
        # ALL BOOKEEPING will be completed in callback from Square once purchase complete

        
        # SUCCESS
        # will return below as an HTTP response to client
        the_json = json.dumps( ret_obj, cls=DecimalJsonEncoder )
       
       
       
              
    #
    # ERROR HANDLING
    #
    except ClientError as error:

        
        if error.response['Error']['Code'] == 'ValidationException' or error.response['Error']['Code'] == 'ConditionalCheckFailedException':
            # one or more attribute fields doesn't match DB config
            msg = "Error buying " + tn + " leed: " + id
            result = handle_error(msg)
            
        else :
            result = handle_error(error)
        
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
    
    
    except Exception as error:
        
        result = handle_error(error)
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
       
    


    # BACK TO JAVASCRIPT CLIENT
    return createHttpResponse( 200, the_json )






# CREATE SQUARE PAYMENT LINK 
#
# generate SQUARE QuickPay Checkout Link
# the_seller contains SELLER authorization code
#
# https://developer.squareup.com/explorer/square/checkout-api/create-payment-link
#
def createPaymentLink(the_seller, the_leed, bn) :
    
    SQUARE_URL = validateEnviron("sq_checkout_url", 1)
    LOCATION_ID = validateEnviron("sq_location_id", 1)

    # tn - trade name
    # trade#balloons --> balloons
    #
    tn = the_leed['pk'].split('#', 1)[-1]

    # where we pass info through to the client and back up to the leed_bought callback  
    # id | trade | bn
    payment_note = the_leed['sk'] + '|' + tn + '|' + bn

    # displayed in checkout
    long_title = '[' + tn + '] ' + the_leed['ti'] + ' (' + the_leed['zp'] + ')'        

    # PRICE
    # must be expressed in cents
    price_cents = int(the_leed['pr']) * 100
    app_fee = int(price_cents * 0.09)

    # Square Access Token
    # FIXME 1/2024
    # MUST fernet (un)encrypt token
    acc_token = 'Bearer ' + the_seller['sq_at']

    
    # Define the payload as a Python dictionary
    payload = {
        "checkout_options": {
            "app_fee_money": {
                "currency": "USD",
                "amount": app_fee
            },
            "redirect_url": "theleedz.com/hustle.html",
            "merchant_support_email": "theleedz.com@gmail.com"
        },
        "quick_pay": {
            "location_id": LOCATION_ID,
            "name": the_leed['ti'],
            "price_money": {
                "currency": "USD",
                "amount": price_cents
            }
        },
        "description":long_title,
        "payment_note": payment_note
    }

    # Convert the payload to JSON format
    json_payload = json.dumps(payload).encode('utf-8')
    
        
    # Set the request headers
    headers = {
        'Accept': 'application/json',
        'Square-Version': '2023-12-13',
        'Authorization': acc_token,
        'Content-Type': 'application/json'
    }
    
    #
    # POST request to Square API
    #
    try :
    
        # Send the HTTP POST request
        res = urllib.request.urlopen(
            urllib.request.Request(
            url = SQUARE_URL,
            headers = headers,
            data = json_payload,
            method = 'POST'
        ),
            timeout=8)

        
        # RETURN payment_link dict -- will throw Exception
        return decodeSquareResponse( SQUARE_URL, res )
        
    
    except Exception as err:
        
        msg = "Cannot create Square Payment Link.  Error in POST request to: " + SQUARE_URL
        logger.error(msg + ": " + str(err))
        raise
    
    
    
    
#
# DECODE / simplify the response from Square
# return a dict
#    dict['long_url'] = response_json['payment_link']['long_url']
#    dict['order_id'] = response_json['payment_link']['order_id']
def decodeSquareResponse(sq_url, res):

    response = res.read().decode('utf-8')
    response_json = json.loads(response)
    
    if 'payment_link' not in response_json or 'long_url' not in response_json['payment_link']:
        url_msg = "Invalid response from " + sq_url
        error_message = url_msg + ". Quick Checkout payment_link / long_url not found"
        logging.error(error_message)
        raise Exception(error_message)
    
    # else -- extract and return just the quick-pay link dictionary containing long_url and order_id
    return response_json['payment_link']









 
 # 
 # GET LEED INFO
 #
 # check for buyer_name bn
 # throw an error if leed has already been bought
 #
def getLeedInfo(table, tn, id):

    pk = "leed#" + tn

    try:
        response = table.get_item(
            Key={'pk': pk, 'sk': id}
        )

        if ('Item' not in response):
            leed_info = "[" + tn + "] " + id
            msg = "Cannot generate Pay Link for " + leed_info + ". Leed not found."
            logger.error(msg)
            raise Exception( msg )

        else:
            the_leed = response['Item']

            # CHECK BUYER NAME / DATE BOUGHT
            # Has this leed been bought - or in the process-of?
            if (the_leed['bn']):
                date_bought = prettyDate( the_leed['db'] ) 
                msg = "This leed has been bought: " + date_bought
                raise Exception(msg)
            
            # ALL GOOD
            return the_leed


    except Exception as err:
        leed_info = "[" + tn + "] " + id
        msg = "Cannot find leed " + leed_info + ". Error: " + str(err)
        logger.error(msg)
        raise  
    
    
    
    
    
    
#
# GET SELLER INFO
#
# extra params are for error reporting of potentially spurrious activity
#
def getSellerInfo(table, cr, tn, id):
         
    pk = "user"
    
    try:
        response = table.get_item(
            Key={'pk': pk, 'sk': cr}
        )
       
        if ('Item' not in response):
            leed_info = "[" + tn + "] " + id
            msg = "Cannot generate Pay Link for " + leed_info + ". Seller not found:" + cr
            logger.error(msg)
            raise Exception( msg )
        
        else:
            the_seller = response['Item']
            
            # seller SQUARE STATE must be AUTHORIZED
            # RETURN seller data
            if (the_seller['sq_st'] == 'authorized'):
                return the_seller
    
    
            # OTHERWISE WE ARE IN AN ERROR CONDITION  
            raise Exception("Seller not authorized: " + cr)
    
    except Exception as err:
        leed_info = "[" + tn + "] " + id
        err_str = " Error: " + str(err)
        msg = "Cannot generate Pay Link for " + leed_info + ". Seller:" + cr + err_str
        logger.error(msg)
        raise  
    

 


 
   
 
#
# Create the HTTP response object
#
#
def createHttpResponse( code, result ):
   
    logger.info(result)
    
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
