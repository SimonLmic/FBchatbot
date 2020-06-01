  /* Facebook webhook listener GET */
  approuter.get('/webhook', function(req, res) {
    console.log("Webhook is healthy");
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'chatbotpassword') {
      console.log("Validating webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error("Failed validation. Make sure the validation tokens match.");
      res.sendStatus(403);
    }
  });
  
  /* Facebook webhook listener POST */
  approuter.post('/webhook', function (req, res) {
    console.log("Webhook received index post");
    var data = req.body;
    if (data.object == 'page') {
      data.entry.forEach(function(pageEntry) {
        var pageID = pageEntry.id;
        var timeOfEvent = pageEntry.time;
        pageEntry.messaging.forEach(function(messagingEvent) {
          if (messagingEvent.optin) {
          } else if (messagingEvent.message) {
            receivedMessage(messagingEvent);
          } else if (messagingEvent.delivery) {
          } else if (messagingEvent.postback) {
            receivedPostback(messagingEvent);
          } else {
            console.log("Webhook received unknown messagingEvent: ", messagingEvent);
          }
        });
      });
      res.sendStatus(200);
    }
  });
  
  /* 
  received a message event from FB messenger page
  process image attachement utilizing
  API 8bits.ai for petfood class detection
  */
 function receivedMessage(event) {
    var FBsenderID = event.sender.id;
    var message = event.message;
    var messageText = message.text;
    var messageAttachments = message.attachments;
  
    if (messageText) {
      switch (messageText) {
        case 'choix 1: factory food':
            displayProductCard(1,FBsenderID);
          break;
        case 'choix 2: bio petfood':
            displayProductCard(2, FBsenderID);
          break;
      }
    }
    else if (message && messageAttachments[0].type==='image') {
      image_url = messageAttachments[0].payload.url;
      product_tags = '';
      var api_url = 'http://api.8bit.ai/tag';//8BITSVISION URL
      request({
          url: api_url,
          method: 'POST',
          form: {
            url: image_url,
            apikey: 'api-key',
            modelkey: 'petfood-detection'
          },
          headers: {'accept': 'application/json'}
        }, function(error, response, body) {
          if (error) {
            console.log('Error sending message: ', error);
          } else if (response.body.error) {
            console.log('Error: ', response.body.error);
          } else {
            console.log(JSON.parse(response.body));
            displayProductCard(image_url, FBsenderID, tradeoff_param);
          }
        });
    }
  }

  /* 
  return a FB message to FB Page user
  to display him a Product Widget Card
  with a Buy It link
  */
  function displayProductCard(senderId, option) {
    messageData = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [
          {
            "title": "for your cat",
            "subtitle": "petfood bio",
            "image_url": "https://pepette.co/storage/medias/original/GU1cIW85BtcSgoK3BPiRy1c0h0t7dSsiSSo2zA1Y.png",
            "buttons": [{
              "type": "web_url",
              "url": "https://pepette.co/fr/recettes-chats",
              "title": "-12.4",}],
          },
          {
            "title": "for your dog",
            "subtitle": "petfood bio",
            "image_url": "https://pepette.co/storage/medias/original/qu5Ru8qhMiLpz97Fh7cdXCE4dSiSSNNqPVLz7VWp.png",
            "buttons": [{
              "type": "web_url",
              "url": "https://pepette.co/fr/chiens",
              "title": "123",}],
          },
          {
            "title": "for your small dog",
            "subtitle": "petfood bio",
            "image_url": "https://pepette.co/storage/medias/original/vd3PddpbI4gPRRYbsk1WqPJfV9TPhtFFaeCWj55r.jpeg",
            "buttons": [{
              "type": "web_url",
              "url": "https://pepette.co/fr/la-marque",
              "title": "Released in 2014-03-07",}],
          }
         ],
        }
      }
    };
  
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
      method: 'POST',
      json: {
        recipient: {id:sender},
        message: messageData,
      }
    }, function(error, response, body) {
      if (error) {
        console.log('Error sending message: ', error);
      } else if (response.body.error) {
        console.log('Error: ', response.body.error);
      }
    });
  
  }