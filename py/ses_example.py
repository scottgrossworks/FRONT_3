

# SEND SELLER RECEIPT EMAIL
# use SES service
# Send a receipt with the full leed details to the buyer
# will throw Exception on error
#
def seller_ReceiptEmail( the_leed, the_buyer, the_seller ):
    
    SENDER = "theleedz.com@gmail.com" # must be verified in AWS SES Email
    RECIPIENT = the_seller['em']
    SUBJECT = "Leed Sold! " + the_leed['id']
    
    leed_info = "[" + the_leed['tn'] + "] " + the_leed['ti'] + " (" + the_leed['pr'] + ")"


    # The email body for recipients with non-HTML email clients
    BODY_TEXT = ("Congratulations, you sold a Leed!" +
                "\r\n" + 
                leed_info
                + "\r\n" + 
                "Buyer: " + the_buyer['sk'] + " - " + the_buyer['em']
                + "\r\n" + 
                "Square will credit your account shortly.  For any questions, please contact The Leedz - theleedz.com@gmail.com"
                + "\r\n" + 
                "Thank you,"
                + "\r\n" + 
                "The Leedz"
                )

                
    # The HTML body of the email
    BODY_START = "<html><head></head><body><h1>Congratulations, you sold a Leed! " + leed_info + "</h1><BR><BR>Buyer: " + the_buyer['sk'] + " - " + the_buyer['em']
    BODY_MID = "Square will credit your account shortly.  For any questions, please contact The Leedz - <a href='mailto:theleedz.com@gmail.com'>theleedz.com@gmail.com</a>"
    BODY_END = "<BR><BR>Thank you,<BR>The Leedz</body></html>"
    

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
    