#
# BUY LEED (BEGIN)
#
# 1/2024
# the payment is NOT COMPLETE
#
#
# BOOKEEPING will be completed in callback from Square once purchase complete
#


import json
import boto3
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from decimal import Decimal

from datetime import datetime, timezone

import random
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
# SUCCESS
# {'id': " + id + ",'ti':" + ti + ",'pr':" + pr + ",'cd': '1'} 
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
    

    except error:
        logger.error("Cannot convert value to int: " + val)
        throw





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
    
    value = ""
    
    if (param not in event['queryStringParameters']):
            if required:
                raise ValueError("HTTP Request error.  No '" + param + "' query string parameter")
    else:
        value = event['queryStringParameters'][param] 
        
    return value



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
# 
#
#
#
        
def lambda_handler(event, context):


    
    the_json = ""
    try:
        
        dynamodb_client = boto3.resource("dynamodb")
        table = dynamodb_client.Table('Leedz_DB')

        true = 1
        false = 0
        
        
        # BUYER  - REQUIRED
        # un
        # username
        #
        un = validateParam(event, 'un', true)
        
        
        # LEED
        # tn
        # TRADE NAME - REQUIRED
        #
        tn = validateParam(event, 'tn', true)

        
        # LEED
        # Square Order ID 
        # ID - REQUIRED
        #
        id = validateParam(event, 'id', true)

        
        # the payment is NOT COMPLETE
        #
        # generate Square QuickPay Checkout Link
        # code buyer and trade name into link
        # 
        
        
        # EVERYTHING ELSE will be completed in callback from Square once purchase complete
        
        # BUY THE LEED
        #
        # FIXME FIXME FIXME
        
        
        
        
        # Find the leed -- will throw Exception if not found
        # increment leed bought date and buyer name
        # the_leed = checkForExistingLeed(table, tn, id)
        #
        the_leed = leed_updatePurchaseInfo( table, tn, id, un ) 
        
        
        # BOOKEEPING -- increment buyer and seller counters
        #
        #
        the_buyer = buyer_incrementLeedzBought( table, un )
        
        the_seller = seller_incrementLeedzSold( table, the_leed['cr'] )
        
        #
        #
        #
        buyer_awardUserBadge( table, the_buyer )
        
        seller_awardUserBadge( table, the_seller )


        
        #
        # UPDATE stats page
        #
        updateStats(table, tn)
        
        
        
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
            msg = "Error buying " + tn + " leed: " + id
            result = handle_error(msg)
            
        else :
            result = handle_error(error)
        
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
    
     
    except ValueError as error:
        
        result = handle_error(error)
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
        
    
    
    except BaseException as error:
        
        result = handle_error(error)
        the_json = json.dumps( result, cls=DecimalJsonEncoder )
       
    

    return createHttpResponse( 200, the_json )


    
    
 
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





