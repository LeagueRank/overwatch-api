'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (platform, region, tag, cb) {

  var url = platform === 'pc' ? 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag : 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;

  var options = {
    uri: encodeURI(url),
    encoding: 'utf8'
  };

  (0, _requestPromise2.default)(options).then(function (htmlString) {

    // Begin html parsing.
    var $ = _cheerio2.default.load(htmlString);
    var user = $('.header-masthead').text();
    var level = $('.player-level div').first().text();
    var portrait = $('.player-portrait').attr('src');
    var permission = $('.masthead-permission-level-text').text();

    // Get prestige level by matching .player-level background url hex.
    var prestigeEl = $('.player-level').first().attr('style');
    var prestigeHex = prestigeEl.match(/0x0*[1-9a-fA-F][0-9a-fA-F]*/);
    var prestigeLevel = prestigeHex ? (0, _utils.getPrestigeLevel)(prestigeHex[0]) : 0;

    // Endorsements.
    var endorsementLevel = $('.masthead .endorsement-level div').last().text();
    var endorsementFrame = $('.masthead .EndorsementIcon').attr('style').slice(21, -1);

    var sportsmanshipValue = $('.masthead .EndorsementIcon-border--sportsmanship').data('value');
    var shotcallerValue = $('.masthead .EndorsementIcon-border--shotcaller').data('value');
    var teammateValue = $('.masthead .EndorsementIcon-border--teammate').data('value');

    var endorsement = {
      sportsmanship: { value: sportsmanshipValue, rate: parseFloat((sportsmanshipValue * 100).toFixed(2)) },
      shotcaller: { value: shotcallerValue, rate: parseFloat((shotcallerValue * 100).toFixed(2)) },
      teammate: { value: teammateValue, rate: parseFloat((teammateValue * 100).toFixed(2)) },
      level: parseInt(endorsementLevel),
      frame: endorsementFrame
    };

    endorsement.icon = (0, _svg.createEndorsementSVG)(endorsement);

    var won = {};
    var lost = {};
    var draw = {};
    var played = {};
    var time = {};

    var compRank = void 0;
    var compRankImg = void 0;
    var star = '';

    var quickplayWonEl = $('#quickplay td:contains("Games Won")').next().html();
    var quickplayPlayedEl = $('#quickplay td:contains("Games Played")').next().html();
    var quickplayTimePlayedEl = $('#quickplay td:contains("Time Played")').next().html();

    var compWonEl = $('#competitive td:contains("Games Won")').next().html();
    var compPlayedEl = $('#competitive td:contains("Games Played")').next().html();
    var compLostEl = $('#competitive td:contains("Games Lost")').next().html();
    var compDrawEl = $('#competitive td:contains("Games Tied")').next().html();
    var compTimePlayedEl = $('#competitive td:contains("Time Played")').next().html();
    var compRankEl = $('.competitive-rank');

    var levelFrame = $('.player-level').attr('style').slice(21, -1);
    var starEl = $('.player-level .player-rank').html();

    if (compRankEl !== null) {
      compRankImg = $('.competitive-rank img').attr('src') || null;
      compRank = $('.competitive-rank div').html();
    }

    if (quickplayWonEl !== null) {
      won.quickplay = quickplayWonEl.trim().replace(/,/g, '');
    }

    if (quickplayPlayedEl !== null) {
      played.quickplay = quickplayPlayedEl.trim().replace(/,/g, '');
    }

    if (quickplayTimePlayedEl !== null) {
      time.quickplay = quickplayTimePlayedEl.trim().replace(/,/g, '');
    }

    if (compWonEl !== null) {
      won.competitive = compWonEl.trim().replace(/,/g, '');
    }

    if (compLostEl !== null) {
      lost.competitive = compLostEl.trim().replace(/,/g, '');
    }

    if (compDrawEl !== null) {
      draw.competitive = compDrawEl.trim().replace(/,/g, '');
    }

    if (compPlayedEl !== null) {
      played.competitive = compPlayedEl.trim().replace(/,/g, '');
    }

    if (compTimePlayedEl !== null) {
      time.competitive = compTimePlayedEl.trim().replace(/,/g, '');
    }

    if (starEl !== null) {
      star = $('.player-level .player-rank').attr('style').slice(21, -1);
    }

    var json = {
      username: user,
      level: parseInt(level) + prestigeLevel,
      portrait: portrait,
      endorsement: endorsement,
      private: permission === 'Private Profile',
      games: {
        quickplay: {
          won: parseInt(won.quickplay),
          played: parseInt(played.quickplay) || undefined
        },
        competitive: {
          won: parseInt(won.competitive),
          lost: parseInt(lost.competitive),
          draw: parseInt(draw.competitive) || 0,
          played: parseInt(played.competitive),
          win_rate: parseFloat((parseInt(won.competitive) / parseInt(played.competitive - parseInt(draw.competitive)) * 100).toFixed(2))
        }
      },
      playtime: { quickplay: time.quickplay, competitive: time.competitive },
      competitive: { rank: parseInt(compRank), rank_img: compRankImg },
      levelFrame: levelFrame,
      star: star
    };

    cb(null, json);
  }).catch(function (err) {
    cb(err);
  });
};

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _utils = require('./utils');

var _svg = require('./svg');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }