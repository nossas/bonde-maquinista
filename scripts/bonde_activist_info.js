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

const { Pool, Client } = require('pg')
const assert = require('assert')
const Table = require('cli-table')

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
    var doorType;
    doorType = res.match[1];
    if (validateEmail(doorType)) {
      res.reply("E-mail válido, busca iniciada...");

      const text = 'select s.* from donations d right join subscriptions s on d.local_subscription_id = s.id where d.email ~ $1 group by d.local_subscription_id,s.id'
      const values = [doorType]

      const table = new Table({
        head: [
          'id',
          'widget_id',
          'activist_id',
          'community_id',
          'status',
          'period',
          'amount',
          // 'created_at',
          // 'updated_at',
          'payment_method',
          'token'
          // 'mailchimp_syncronization_at',
          // 'mailchimp_syncronization_error_reason'
        ]
      });
      try {
        const query = await client.query(text, values)

        query.rows.map((v) => table.push([v.id,
          v.widget_id,
          v.activist_id,
          v.community_id,
          v.status,
          v.period,
          v.amount,
          // v.created_at,
          // v.updated_at,
          v.payment_method,
          v.token
        ]))
        // console.log(table.toString())
        return res.reply("\n" + table.toString());
      } catch(err) {
        robot.logger.error(err.stack)
        console.log(err.stack)
      }
    } else {
      return res.reply("E-mail inválido, tente novamente...");
    }

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
