import test from 'ava';
import { getStandings } from '../../src/owl';

var result;

test.before.cb(t => {
  getStandings((json) => {
    result = json;
    t.end();
  });
});

test('get base standings data', t => {
  t.deepEqual(Array.isArray(result.data), true);
  t.deepEqual(result.data.length > 0, true);
});