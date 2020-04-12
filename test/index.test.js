const assert = require('assert');
const createContext = require('../lib/index').default;
const run = createContext();

describe('test BinaryExpression', function () {
  it('should be equal', function () {
    const res = run(`
      let a = 'global A';
      if(false){
        a = 'xixi';
      }
      const add = () => {
        this.c = 1;
        console.log(this.a, this.c);
        return 1 + 1
      };
      const b = {
        a: 'hello',
        add: add
      }
      const varAdd = 'add';
      exports.res = b[varAdd]();
    `);
    assert.equal(2, res.res);
  });
})
