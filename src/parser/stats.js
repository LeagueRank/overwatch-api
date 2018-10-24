import cheerio from 'cheerio';
import rp from 'request-promise';
import { getPrestigeLevel } from './utils';
import { createEndorsementSVG } from './svg';

export default function (platform, region, tag, cb) {

  const url = platform === 'pc'
    ? `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag}`
    : `https://playoverwatch.com/en-us/career/${platform}/${tag}`;

  const options = {
    uri: encodeURI(url),
    encoding: 'utf8'
  }

  rp(options).then((htmlString) => {

    // Begin html parsing.
    const $ = cheerio.load(htmlString);
    const user = $('.header-masthead').text();
    const level = $('.player-level div').first().text();
    const portrait = $('.player-portrait').attr('src');
    const permission = $('.masthead-permission-level-text').text();

    // Get prestige level by matching .player-level background url hex.
    const prestigeEl = $('.player-level').first().attr('style');
    const prestigeHex = prestigeEl.match(/0x0*[1-9a-fA-F][0-9a-fA-F]*/);
    const prestigeLevel = prestigeHex ? getPrestigeLevel(prestigeHex[0]) : 0;

    // Endorsements.
    const endorsementLevel = $('.masthead .endorsement-level div').last().text();
    const endorsementFrame = $('.masthead .EndorsementIcon').attr('style').slice(21, -1);

    const sportsmanshipValue = $('.masthead .EndorsementIcon-border--sportsmanship').data('value');
    const shotcallerValue = $('.masthead .EndorsementIcon-border--shotcaller').data('value');
    const teammateValue = $('.masthead .EndorsementIcon-border--teammate').data('value');

    const endorsement = {
      sportsmanship: { value: sportsmanshipValue, rate: parseFloat((sportsmanshipValue * 100).toFixed(2)) },
      shotcaller: { value: shotcallerValue, rate: parseFloat((shotcallerValue * 100).toFixed(2)) },
      teammate: { value: teammateValue, rate: parseFloat((teammateValue * 100).toFixed(2)) },
      level: parseInt(endorsementLevel),
      frame: endorsementFrame,
    };

    endorsement.icon = createEndorsementSVG(endorsement);

    const stats = {};

    //
    // Top Heroes.
    //
    const topHeroCategories = {
      quickplay: {
        // 'played': '0x0860000000000021',
        // 'games_won': '0x0860000000000039',
        // 'weapon_accuracy': '0x086000000000002F',
        // 'eliminations_per_life': '0x08600000000003D2',
        // 'multikill_best': '0x0860000000000346',
        // 'objective_kills_average': '0x086000000000039C',
      },
      competitive: {
        // 'played': '0x0860000000000021',
        // 'games_won': '0x0860000000000039',
        // 'win_rate': '0x08600000000003D1',
        // 'weapon_accuracy': '0x086000000000002F',
        // 'eliminations_per_life': '0x08600000000003D2',
        // 'multikill_best': '0x0860000000000346',
        // 'objective_kills_average': '0x086000000000039C',
      }
    };

    // Quickplay.
    stats['top_heroes'] = { quickplay: {} };
    Object.keys(topHeroCategories.quickplay).forEach((k) => {
      const topHeroesEls = $(`#quickplay [data-category-id="overwatch.guid.${topHeroCategories.quickplay[k]}"]`)
        .find('.progress-category-item');
      let topHeroes = [];
      topHeroesEls.each(function (i, el) {
        const stat = {};
        stat.hero = $(this).find('.title').text();
        stat.img = $(this).find('img').attr('src');
        stat[k] = $(this).find('.description').text();
        topHeroes.push(stat);
      });
      stats['top_heroes']['quickplay'][k] = topHeroes;
    });

    // Competitive.
    stats['top_heroes']['competitive'] = {};
    Object.keys(topHeroCategories.competitive).forEach((k) => {
      const topHeroesEls = $(`#competitive [data-category-id="overwatch.guid.${topHeroCategories.competitive[k]}"]`)
        .find('.progress-category-item');
      let topHeroes = [];
      topHeroesEls.each(function (i, el) {
        const stat = {};
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
    const statCategories = [
      'Combat',
      'Match Awards',
      'Assists',
      // 'Average',
      'Miscellaneous',
      // 'Best',
      'Game'
    ];
    const heroCategories = {
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
    }

    Object.keys(heroCategories).forEach(function (hero_category) {
      const hero_slug = heroCategories[hero_category];
      stats[hero_slug] = {};
      // Quickplay Stats.
      statCategories.forEach(function (item) {
        const els = $(`#quickplay [data-category-id="${hero_category}"] h5:contains("${item}")`).closest('table').find('tbody tr');
        let statsArr = [];
        els.each(function (i, el) {
          let stat = {};
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
        const els = $(`#competitive [data-category-id="${hero_category}"] h5:contains("${item}")`).closest('table').find('tbody tr');
        let statsArr = [];
        els.each(function (i, el) {
          let stat = {};
          stat.title = $(this).find('td').first().text();
          stat.value = $(this).find('td').next().text();
          statsArr.push(stat);
        });
        item = item.replace(' ', '_').toLowerCase();
        stats[hero_slug][item]['competitive'] = [];
        stats[hero_slug][item]['competitive'] = statsArr;
      });
    });

    const json = {
      username: user,
      level: parseInt(level) + prestigeLevel,
      portrait: portrait,
      endorsement: endorsement,
      private: permission === 'Private Profile',
      stats: stats
    }

    cb(null, json);
  }).catch(err => {
    cb(err);
  });
}
