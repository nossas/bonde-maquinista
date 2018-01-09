//  Description:
//    Search for details about activist donations
//  Dependencies:
//    "<module name>": "<module version>"
//  Configuration:
//    DATABASE_URL
//  Commands:
//    hubot buscar ativista <email> - <answer with information about subscription>
//  Notes:
//    Command available only to authorized users
//  Author:
//    lpirola
//   These are from the scripting documentation: https://github.com/github/hubot/blob/master/docs/scripting.md

const { Pool } = require('pg')
const assert = require('assert')
var AsciiTable = require('ascii-table')

assert(process.env.DATABASE_URL, '`DATABASE_URL` not set')

const connectionString = process.env.DATABASE_URL

const pool = new Pool({
  connectionString: connectionString,
})

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = async (robot) => {
  const client = await pool.connect()
  var annoyIntervalId, answer, enterReplies, leaveReplies, lulz;
  robot.hear(/badger/i, function(res) {
    return res.send("Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS");
  });
  robot.respond(/buscar ativista (.*)/i, async (res) => {

    // var role, user;
    // role = 'support';
    // user = robot.brain.userForName(res.message.user.name);
    // if (user == null) {
    //   return res.reply(`${name} does not exist`);
    // }
    // if (!robot.auth.hasRole(user, role)) {
    //   res.reply(`Access Denied. You need role ${role} to perform this action.`);
    //   return;
    // }

    var doorType;
    doorType = res.match[1];
    // if (validateEmail(doorType)) {

      const text = `
      SELECT
      c.name as community,
      m.name as mobilization,
      d.id as donation_id,
      d.widget_id,
      d.created_at,
      d.updated_at,
      s.token,
      s.status,
      d.payment_method,
      d.amount,
      d.email,
      d.card_hash,
      d.customer,
      d.skip,
      d.transaction_id,
      d.transaction_status,
      d.subscription,
      d.credit_card,
      d.activist_id,
      d.period,
      d.plan_id,
      d.parent_id,
      d.payables,
      d.gateway_data,
      d.payable_transfer_id,
      d.old_synch,
      d.converted_from,
      d.synchronized,
      d.local_subscription_id,
      d.mailchimp_syncronization_at,
      d.mailchimp_syncronization_error_reason,
      d.checkout_data,
      d.cached_community_id
  from
      donations d
      left join widgets w on d.widget_id = w.id
      left join blocks b on w.block_id = b.id
      left join mobilizations m on b.mobilization_id = m.id
      left join communities c on m.community_id = c.id
      left join subscriptions s on d.local_subscription_id = s.id
  where d.email ~ $1
`
      const values = [doorType]

      try {
        const query = await client.query(text, values)
        const sizeResults = query.rows.length
        if ( sizeResults > 0) {
          res.reply(
            "```_||__|   |  ______________________   ______\n" +
            "(        | | " + sizeResults + " REGISTROS ENCONTRADOS| |      |\n" +
            "/-()---() ~ ()---------------------() ~ ()--()```");
          query.rows.map((v) => {
            const table = new AsciiTable(v.email + ' - ' + v.community + ' - ' + v.mobilization)
            table.addRow('transaction_id', v.transaction_id);
            table.addRow('transaction_status', v.transaction_status);
            table.addRow('payment_method', v.payment_method);
            table.addRow('amount', v.amount/100);
            if (v.subscription) {
              table.addRow('is_subscription', v.subscription);
              table.addRow('subscription_id', v.local_subscription_id);
              table.addRow('subscription_status', v.status);
              table.addRow('subscription_token', v.token);
              table.addRow('subscription_period', v.period);
              table.addRow('subscription_edit', `https://app.bonde.org/subscriptions/${v.local_subscription_id}/edit?token=${v.token}`);
            }
            table.addRow('donation_id', v.donation_id);
            table.addRow('widget_id', v.widget_id);
            table.addRow('activist_id', v.activist_id);
            table.addRow('created_at', v.created_at);
            table.addRow('updated_at', v.updated_at);
            // table.addRow('synchronized', d.synchronized);
            // table.addRow('local_subscription_id', d.local_subscription_id);
            // table.addRow('mailchimp_syncronization_at', d.mailchimp_syncronization_at);
            // table.addRow('mailchimp_syncronization_error_reason', d.mailchimp_syncronization_error_reason);

            res.reply("```" + table.toString() + "```");
          })
        } else {
          res.reply(
            "```_||__|   |  _____________________   ______\n" +
            "(        | | 0 REGISTROS ENCONTRADOS| |      |\n" +
            "/-()---() ~ ()--------------------() ~ ()--()```");
        }

      return true
    } catch(err) {
      robot.logger.error(err.stack)
      console.log(err.stack)
    }
  // } else {
  //   return res.reply("E-mail inválido, tente novamente...");
  // }
  });
  robot.hear(/I like pie/i, function(res) {
    return res.emote("makes a freshly baked pie");
  });
  lulz = ['lol', 'rofl', 'lmao'];
  robot.respond(/lulz/i, function(res) {
    return res.send(res.random(lulz));
  });
  robot.topic(function(res) {
    return res.send(`${res.message.text}? That's a Paddlin'`);
  });
  enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you'];
  leaveReplies = ['Are you still there?', 'Target lost', 'Searching'];
  robot.enter(function(res) {
    return res.send(res.random(enterReplies));
  });
  robot.leave(function(res) {
    return res.send(res.random(leaveReplies));
  });
  answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING;
  robot.respond(/what is the answer to the ultimate question of life/, function(res) {
    if (answer == null) {
      res.send("Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again");
      return;
    }
    return res.send(`${answer}, but what is the question?`);
  });
  robot.respond(/you are a little slow/, function(res) {
    return setTimeout(function() {
      return res.send("Who you calling 'slow'?");
    }, 60 * 1000);
  });
  annoyIntervalId = null;
  robot.respond(/annoy me/, function(res) {
    if (annoyIntervalId) {
      res.send("AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH");
      return;
    }
    res.send("Hey, want to hear the most annoying sound in the world?");
    return annoyIntervalId = setInterval(function() {
      return res.send("AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH");
    }, 1000);
  });
  robot.respond(/unannoy me/, function(res) {
    if (annoyIntervalId) {
      res.send("GUYS, GUYS, GUYS!");
      clearInterval(annoyIntervalId);
      return annoyIntervalId = null;
    } else {
      return res.send("Not annoying you right now, am I?");
    }
  });
  robot.router.post('/hubot/chatsecrets/:room', function(req, res) {
    var data, room, secret;
    room = req.params.room;
    data = JSON.parse(req.body.payload);
    secret = data.secret;
    robot.messageRoom(room, `I have a secret: ${secret}`);
    return res.send('OK');
  });
  robot.error(function(err, res) {
    robot.logger.error("DOES NOT COMPUTE");
    if (res != null) {
      return res.reply("DOES NOT COMPUTE");
    }
  });
  robot.respond(/have a soda/i, function(res) {
    var sodasHad;
    // Get number of sodas had (coerced to a number).
    sodasHad = robot.brain.get('totalSodas') * 1 || 0;
    if (sodasHad > 4) {
      return res.reply("I'm too fizzy..");
    } else {
      res.reply('Sure!');
      return robot.brain.set('totalSodas', sodasHad + 1);
    }
  });
  return robot.respond(/sleep it off/i, function(res) {
    robot.brain.set('totalSodas', 0);
    return res.reply('zzzzz');
  });
};
