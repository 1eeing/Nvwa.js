const fs = require('fs');
const path = require('path');
const assert = require('assert');

const code = fs.readFileSync(path.resolve(__dirname, '../lib/index.js'), 'utf-8');

const createContext = require('../lib/index').default;
const run = createContext({global});

describe('test Bootstrap', function () {
  it('should be success', function () {
    const bootstrap = run(code);
    assert.ok;
  });
})

