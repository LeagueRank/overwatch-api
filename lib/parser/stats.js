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

    var stats = {};

    //
    // Top Heroes.
    //
    var topHeroCategories = {
      quickplay: {
        'played': '0x0860000000000021',
        'games_won': '0x0860000000000039',
        'weapon_accuracy': '0x086000000000002F',
        'eliminations_per_life': '0x08600000000003D2',
        'multikill_best': '0x0860000000000346',
        'objective_kills_average': '0x086000000000039C'
      },
      competitive: {
        'played': '0x0860000000000021',
        'games_won': '0x0860000000000039',
        'win_rate': '0x08600000000003D1',
        'weapon_accuracy': '0x086000000000002F',
        'eliminations_per_life': '0x08600000000003D2',
        'multikill_best': '0x0860000000000346',
        'objective_kills_average': '0x086000000000039C'
      }
    };

    // Quickplay.
    stats['top_heroes'] = { quickplay: {} };
    Object.keys(topHeroCategories.quickplay).forEach(function (k) {
      var topHeroesEls = $('#quickplay [data-category-id="overwatch.guid.' + topHeroCategories.quickplay[k] + '"]').find('.progress-category-item');
      var topHeroes = [];
      topHeroesEls.each(function (i, el) {
        var stat = {};
        stat.hero = $(this).find('.title').text();
        stat.img = $(this).find('img').attr('src');
        stat[k] = $(this).find('.description').text();
        topHeroes.push(stat);
      });
      stats['top_heroes']['quickplay'][k] = topHeroes;
    });

    // Competitive.
    stats['top_heroes']['competitive'] = {};
    Object.keys(topHeroCategories.competitive).forEach(function (k) {
      var topHeroesEls = $('#competitive [data-category-id="overwatch.guid.' + topHeroCategories.competitive[k] + '"]').find('.progress-category-item');
      var topHeroes = [];
      topHeroesEls.each(function (i, el) {
        var stat = {};
        stat.hero = $(this).find('.title').text();
        stat.img = $(this).find('img').attr('src');
        stat[k] = $(this).find('.description').text();
        topHeroes.push(stat);
      });
      stats['top_heroes']['competitive'][k] = topHeroes;
    });

    //
    // Career Stats
    //
    var statCategories = ['Combat', 'Match Awards', 'Assists', 'Average', 'Miscellaneous', 'Best', 'Game'];
    var heroCategories = {
      '0x02E00000FFFFFFFF': 'all',
      '0x02E000000000013B': 'ana',
      '0x02E0000000000015': 'bastion',
      '0x02E0000000000195': 'brigitte',
      '0x02E000000000007A': 'dva',
      '0x02E000000000012F': 'doomfist',
      '0x02E0000000000029': 'genji',
      '0x02E0000000000005': 'hanzo',
      '0x02E0000000000065': 'junkrat',
      '0x02E0000000000079': 'lucio',
      '0x02E0000000000042': 'mccree',
      '0x02E00000000000DD': 'mei',
      '0x02E0000000000004': 'mercy',
      '0x02E00000000001A2': 'moira',
      '0x02E000000000013E': 'orisa',
      '0x02E0000000000008': 'pharah',
      '0x02E0000000000002': 'reaper',
      '0x02E0000000000007': 'reinhardt',
      '0x02E0000000000040': 'roadhog',
      '0x02E000000000006E': 'soldier-76',
      '0x02E000000000012E': 'sombra',
      '0x02E0000000000016': 'symmetra',
      '0x02E0000000000006': 'torbjorn',
      '0x02E0000000000003': 'tracer',
      '0x02E000000000000A': 'widowmaker',
      '0x02E0000000000009': 'winston',
      '0x02E00000000001CA': 'wrecking-ball',
      '0x02E0000000000068': 'zarya',
      '0x02E0000000000020': 'zenyatta'
    };

    Object.keys(heroCategories).forEach(function (hero_category) {
      var hero_slug = heroCategories[hero_category];
      stats[hero_slug] = {};
      // Quickplay Stats.
      statCategories.forEach(function (item) {
        var els = $('#quickplay [data-category-id="' + hero_category + '"] h5:contains("' + item + '")').closest('table').find('tbody tr');
        var statsArr = [];
        els.each(function (i, el) {
          var stat = {};
          stat.title = $(this).find('td').first().text();
          stat.value = $(this).find('td').next().text();
          statsArr.push(stat);
        });
        item = item.replace(' ', '_').toLowerCase();
        stats[hero_slug][item] = { quickplay: [] };
        stats[hero_slug][item]['quickplay'] = statsArr;
      });

      // Competitive Stats.
      statCategories.forEach(function (item) {
        var els = $('#competitive [data-category-id="' + hero_category + '"] h5:contains("' + item + '")').closest('table').find('tbody tr');
        var statsArr = [];
        els.each(function (i, el) {
          var stat = {};
          stat.title = $(this).find('td').first().text();
          stat.value = $(this).find('td').next().text();
          statsArr.push(stat);
        });
        item = item.replace(' ', '_').toLowerCase();
        stats[hero_slug][item]['competitive'] = [];
        stats[hero_slug][item]['competitive'] = statsArr;
      });
    });

    var json = {
      username: user,
      level: parseInt(level) + prestigeLevel,
      portrait: portrait,
      endorsement: endorsement,
      private: permission === 'Private Profile',
      stats: stats
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