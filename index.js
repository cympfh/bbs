var fs = require('fs');
var express = require('express');
var logger = require('morgan')

var messages = [];
var save_file = './save.json'

fs.access(save_file, fs.constants.R_OK, (err) => {
  if (!err) { messages = require(save_file); }
});

var app = express();

app.use(express.json());
app.use(logger("short"));

app.get('/bbs', (req, res) => {

  res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });

  // who are you
  var ip = req.connection.remoteAddress;
  var ua = req.headers['user-agent']
  res.write(`You are ${ip}, ${ua}\n`);

  // post?
  var post = req.query.post;
  if (post) {
    post = post.replace(/[\r\n\t]/g, ' ');
    messages.push([(new Date()).getTime(), [ip, ua], post]);
    res.write(`Accepted Message from ${ip}, body="${post}"\n`);
  }

  res.write('---\n');

  // bbs main
  for (var msg of messages) {
    res.write(`${msg[0]}\t${msg[1]}\t${msg[2]}\n`);
  }

  res.write('---\n');

  // readme
  var data = fs.readFileSync('README.txt');
  res.write(data.toString());

  res.end();
});

function clean() {
  var cur = (new Date()).getTime();
  while (messages.length > 0 && messages[0][0] < cur - 24 * 60 * 60 * 1000) {
    console.log(messages[0][0], cur);
    messages.pop();
  }
  fs.writeFile(save_file, JSON.stringify(messages), (err) => {
    if (err) console.log(err);
    else console.log('Saved');
  });
}

setInterval(clean, 5 * 60 * 1000);

var server = app.listen(process.env.PORT || 3000, () => {
  console.log('listen on: %d', server.address().port);
});
