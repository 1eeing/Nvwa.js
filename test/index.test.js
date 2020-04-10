const assert = require('assert');
const createContext = require('../lib/index').default;
const run = createContext();

describe('test BinaryExpression', function () {
  it('should be equal', function () {
    const res = run(`
      const add = function(){ return 1 + 1};
      console.log('hello world')
      exports.res = add();
    `);
    // console.log(res);
    assert.equal(2, res.res);
  });
})
