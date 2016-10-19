var request = require('request');
var sprintf = require('sprintf').sprintf;
var config = require('./config.json');


/*
 * GitHub Issue Search Plugin
 * Populate the list of commands available from the config file.
 */
var IssueSearch = function() {
  this.commands = Object.keys(config.commands);
  this.usage = {
    issues: 'ex: !issues <search text>. Gets any issues matching <search text>.'
  };
};


/*
 * Executing the command
 */
Object.keys(config.commands).forEach(function(repo) {
  IssueSearch.prototype[repo] = function(bot, to, from, msg, callback) {
    var settings = config.commands[repo],
        creds ='',
        label = settings.label ? 'label:'+ settings.label : '',
        intervalId, options;

    if (settings.username && settings.password) {
      creds = sprintf('%s:%s@', settings.username, settings.password);
    }

    options = {
      url: sprintf('https://%sapi.github.com/search/issues?q=repo:%s+is:open+%s+%s', creds, settings.repo, label, encodeURIComponent(msg)),
      headers: {
        'User-Agent': 'Roarbot'
      }
    };

    request(options, function(err, res, body) {
      if (err) {
        bot.say(to, err);
        callback();
        return;
      }
      var epInfo = {},
          outMsg = '',
          totalCount = 0,
          issueTitles = [],
          results = JSON.parse(body);

      clearInterval(intervalId);
      if (!results && !results.total_count) {
        bot.say(to, 'Unable to retrieve any issues for ' + msg);
        callback();
        return;
      }

      totalCount = results.total_count;

      if (totalCount) {
        results.items.forEach(function(item) {
          issueTitles.push({
            title:item.title,
            url: item.html_url
          });
        });

        outMsg = sprintf('%d issues found:', totalCount);
        issueTitles.forEach(function(item) {
          outMsg += sprintf('\n - %s: %s', item.title, item.url);
        });
      } else {
        outMsg = 'No issues were found for search: ' + msg;
      }

      bot.say(to, outMsg);
      callback();
    });
  };

});


exports.Plugin = IssueSearch;
