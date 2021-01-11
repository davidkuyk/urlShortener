const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var URL = require("url").URL;
const app = express();
mongoose.set('useFindAndModify', false);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors({optionsSuccessStatus: 200}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Connecting Database
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Creating Schema
const youRLSchema = new mongoose.Schema({
    original_url: String,
    short_url: Number,
});

// Creating Model
const YouRL = mongoose.model('YouRL', youRLSchema);

// URL Regex
var pattern = new RegExp('^(https?:\\/\\/)+'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

// URL Regex 2
  const reg1 = /^https:\/\//;
  const reg2 = /^http:\/\//;
  const reg3 = /\/$/;

const stringIsAValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch (err) {
    return false;
  }
};

app.post('/api/shorturl/new', (req, res) => {
  const originalURL = req.body.url;
  if (pattern.test(originalURL) === false) {
    res.json({ error: 'invalid url' });
  } else {
    if (!stringIsAValidUrl(originalURL)) {
      res.json({ error: 'invalid url' });
    } else if ((new URL(originalURL).protocol != "http:") && (new URL(originalURL).protocol != "https:")) {
      res.json({ error: 'invalid url' });
      }else {
    YouRL.countDocuments({}, function (err, count) {
      if (err){
          console.log(err)
      } else {
          var count = count;
          var origURL = req.body.url
          var shortURL = count + 1
          var newYouRL = new YouRL({original_url: origURL, short_url: shortURL});

          newYouRL.save(function(err, data) {
            if(err) return console.error(err);
            return data;
          });

        res.json({
          original_url: origURL,
          short_url: shortURL
        });
      }
    });
  }
  }
})

app.get('/api/shorturl/:short_url', (req, res) => {
  YouRL.findOne({short_url: req.params.short_url}, function(err, data) {
    if(err) {
      res.json({ error: 'invalid url' });
    } else {
        if (reg1.test(data.original_url) || reg2.test(data.original_url)) {
          res.redirect(data.original_url);
        } else {
          res.redirect("https://" + data.original_url);
        }
    }
      })
})