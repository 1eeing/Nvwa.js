const assert = require('assert');
const createContext = require('../lib/index').default;
const run = createContext();

describe('test BinaryExpression', function () {
  it('should be equal', function () {
    const res = run(`
      const a = 'global A';
      const add = function() {
        this.c = 1;
        console.log(this.a, this.c);
        console.log(this);
        return 1 + 1
      };
      const b = {
        a: 'hello',
        add: add
      }
      exports.res = b.add();
    `);
    // console.log(res);
    assert.equal(2, res.res);
  });
})
