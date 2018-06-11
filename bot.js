const Botkit = require("botkit");
const nano = require("nano");
const logger = require("winston");
require("dotenv").config();

const controller = Botkit.facebookbot({
  verify_token: process.env.MESSENGER_VERIFY_TOKEN,
  access_token: process.env.MESSENGER_ACCESS_TOKEN
});
const bot = controller.spawn({});

const customerDb = nano(process.env.CUSTOMER_DATABASE);

controller.setupWebserver(process.env.port || 3000, (err, webserver) => {
  controller.createWebhookEndpoints(controller.webserver, bot, () => {
    logger.info("This bot is online!!!");
  });
});

// this is triggered when a user clicks the send-to-messenger plugin
controller.on("facebook_optin", (bot, message) => {
  bot.reply(message, "Welcome to my app!");
});

// user said hello
controller.hears(["hello"], "message_received", (bot, message) => {
  bot.reply(message, "Hey there.");
});

controller.hears(["help"], "message_received", (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.say(
      "Hello! Before I can assist you I need to gather some information first"
    );
    convo.ask("What is your Speedernet user id?", (response, convo) => {
      getUser(response.text)
        .then(user => {
          convo.say(
            "Hello, " + user.display_name + "! How can I assist you today?"
          );
        })
        .catch(err => {
          convo.say("Hmm, I'm sorry but I couldn't find your customer record");
        });
      convo.next();
    });
  });
});

/**
 * Fetches a user record from database by user id
 */
function getUser(id) {
  return new Promise((resolve, reject) => {
    customerDb.get(id, (err, user) => {
      if (!err) {
        resolve(user);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Logger helper
 */
function toString(data) {
  return JSON.stringify(data, null, 2);
}
