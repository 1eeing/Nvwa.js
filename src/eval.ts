import * as t from '@babel/types';
import { EvaluateMap, IVariable } from './types';
import { Scope } from './scope';

const BREAK = Object.create(null);
const CONTINUE = Object.create(null);
const RETURN: { result: any } = { result: void 0 };

const evaluateMap: EvaluateMap = {
  File(node: t.File, scope) {
    evaluate(node.program, scope);
  },

  Program(node: t.Program, scope) {
    for (const n of node.body) {
      evaluate(n, scope);
    }
  },

  Identifier(node: t.Identifier, scope) {
    const $var = scope.$find(node.name);
    if (!$var) {
      throw `[Error] ${node.loc}, '${node.name}' 未定义`;
    }
    return $var.$get();
  },

  StringLiteral(node: t.StringLiteral, scope) {
    return node.value;
  },

  NumericLiteral(node: t.NumericLiteral, scope) {
    return node.value;
  },

  BooleanLiteral(node: t.BooleanLiteral, scope) {
    return node.value;
  },

  NullLiteral(node: t.NullLiteral, scope) {
    return null;
  },

  BlockStatement(block: t.BlockStatement, scope) {
    const blockScope = scope.shared ? scope : new Scope('block', scope);
    for (const node of block.body) {
      const res = evaluate(node, blockScope);
      if (res === BREAK || res === CONTINUE || res === RETURN) {
        return res;
      }
    }
  },

  DebuggerStatement(node: t.DebuggerStatement, scope) {
    debugger;
  },

  ExpressionStatement(node: t.ExpressionStatement, scope) {
    evaluate(node.expression, scope);
  },

  ReturnStatement(node: t.ReturnStatement, scope) {
    RETURN.result = (node.argument ? evaluate(node.argument, scope) : void 0);
    return RETURN;
  },

  BreakStatement(node: t.BreakStatement, scope) {
    return BREAK;
  },

  ContinueStatement(node: t.ContinueStatement, scope) {
    return CONTINUE;
  },

  IfStatement(node: t.IfStatement, scope) {
    if (evaluate(node.test, scope)) {
      return evaluate(node.consequent, scope);
    }

    if (evaluate(node.alternate, scope)) {
      const ifScope = new Scope('block', scope, true);
      return evaluate(node.alternate, ifScope)
    }
  },

  SwitchStatement(node: t.SwitchStatement, scope) {
    const discriminant = evaluate(node.discriminant, scope);
    const switchScope = new Scope('switch', scope);
    for (const ca of node.cases){
      if (ca.test === null || evaluate(ca.test, switchScope) === discriminant) {
        const res = evaluate(ca, switchScope);
        if (res === BREAK) {
          break;
        } else if (res === RETURN) {
          return res;
        }
      }
    }
  },

  SwitchCase(node: t.SwitchCase, scope) {
    for (const item of node.consequent) {
      const res = evaluate(item, scope);
      if (res === BREAK || res === RETURN) {
        return res;
      }
    }
  },

  ThrowStatement(node: t.ThrowStatement, scope) {
    throw evaluate(node.argument, scope);
  },

  TryStatement(node: t.TryStatement, scope) {
    try {
      return evaluate(node.block, scope);
    } catch (error) {
      if (node.handler) {
        const catchScope = new Scope('block', scope, true);
        catchScope.$let((<t.Identifier>node.handler.param).name, error);
        return evaluate(node.handler, catchScope);
      } else {
        throw error;
      }
    } finally {
      if (node.finalizer) {
        return evaluate(node.finalizer, scope);
      }
    }
  },

  CatchClause(node: t.CatchClause, scope) {
    return evaluate(node.body, scope);
  },

  WhileStatement(node: t.WhileStatement, scope) {
    while (evaluate(node.test, scope)) {
      const whileScope = new Scope('loop', scope, true);
      const res = evaluate(node.body, whileScope);
      if (res === CONTINUE) continue;
      if (res === BREAK) break;
      if (res === RETURN) return res;
    }
  },

  ForStatement(node: t.ForStatement, scope) {
    for (
      const forScope = new Scope('loop', scope),
      initVal = evaluate(node.init, forScope);
      evaluate(node.test, forScope);
      evaluate(node.update, forScope)
    ) {
      const res = evaluate(node.body, forScope);
      if (res === CONTINUE) continue;
      if (res === BREAK) break;
      if (res === RETURN) return res;
    }
  },

  ForInStatement(node: t.ForInStatement, scope) {
    const kind = (<t.VariableDeclaration>node.left).kind;
    const decl = (<t.VariableDeclaration>node.left).declarations[0];
    const name = (<t.Identifier>decl.id).name;

    for (const value in evaluate(node.right, scope)) {
      const forScope = new Scope('loop', scope, true);
      scope.$define(kind, name, value);
      const res = evaluate(node.body, forScope);
      if (res === CONTINUE) continue;
      if (res === BREAK) break;
      if (res === RETURN) return res;
    }
  },

  ForOfStatement(node: t.ForOfStatement, scope) {
    const kind = (<t.VariableDeclaration>node.left).kind;
    const decl = (<t.VariableDeclaration>node.left).declarations[0];
    const name = (<t.Identifier>decl.id).name;

    for (const value of evaluate(node.right, scope)) {
      const forScope = new Scope('loop', scope, true);
      scope.$define(kind, name, value);
      const res = evaluate(node.body, forScope);
      if (res === CONTINUE) continue;
      if (res === BREAK) break;
      if (res === RETURN) return res;
    }
  },

  FunctionDeclaration(node: t.FunctionDeclaration, scope) {
    const func = evaluateMap.FunctionExpression(node, scope);
    scope.$var(node.id.name, func);
  },

  VariableDeclaration(node: t.VariableDeclaration, scope) {
    const { kind, declarations } = node;
    for (const decl of declarations) {
      const varName = (<t.Identifier>decl.id).name;
      const value = decl.init ? evaluate(decl.init, scope) : void 0;
      if (!scope.$define(kind, varName, value)) {
        throw `[Error] ${name} 重复定义`
      }
    }
  },

  ThisExpression(node: t.ThisExpression, scope) {
    const _this = scope.$find('this');
    return _this ? _this.$get() : null;
  },

  ArrayExpression(node: t.ArrayExpression, scope) {
    return node.elements.map(item => evaluate(item, scope));
  },

  ObjectExpression(node: t.ObjectExpression, scope) {
    let res = Object.create(null);
    node.properties.forEach((prop) => {
      let key;
      let value;
      if(prop.type === 'ObjectProperty'){
        key = prop.key.name;
        value = evaluate(prop.value, scope);
        res[key] = value;
      }else if (prop.type === 'ObjectMethod'){
        const kind = prop.kind;
        key = prop.key.name;
        value = evaluate(prop.body, scope);
        if(kind === 'method') {
          res[key] = value;
        }else if(kind === 'get') {
          Object.defineProperty(res, key, { get: value });
        }else if(kind === 'set') {
          Object.defineProperty(res, key, { set: value });
        }
      }else if(prop.type === 'SpreadElement'){
        const arg = evaluate(prop.argument, scope);
        res = Object.assign(res, arg);
      }
    });
    return res;
  },

  FunctionExpression(node: t.FunctionExpression, scope) {
    return function (...args: any) {
      const funcScope = new Scope('function', scope, true);
      node.params.forEach((param: t.Identifier, idx) => {
        const { name: paramName } = param;
        funcScope.$let(paramName, args[idx]);
      });
      funcScope.$const('this', this);
      funcScope.$const('arguments', arguments);
      const res = evaluate(node.body, funcScope);
      if (res === RETURN) {
        return res.result;
      }
    }
  },

  UnaryExpression(node: t.UnaryExpression, scope) {
    const expressionMap = {
      '~': () => ~evaluate(node.argument, scope),
      '+': () => +evaluate(node.argument, scope),
      '-': () => -evaluate(node.argument, scope),
      '!': () => !evaluate(node.argument, scope),
      'void': () => void evaluate(node.argument, scope),
      'typeof': () => {
        if (node.argument.type === 'Identifier') {
          const $var = scope.$find(node.argument.name);
          const value = $var ? $var.$get() : void 0;
          return typeof value;
        }
        return typeof evaluate(node.argument, scope);
      },
      'delete': () => {
        if (node.argument.type === 'MemberExpression') {
          const { object, property } = node.argument;
          const obj = evaluate(object, scope);
          let prop;
          if (property.type === 'Identifier') {
            prop = property.name;
          } else {
            prop = evaluate(property, scope);
          }
          return delete obj[prop];
        } else {
          throw '[Error] 出现错误'
        }
      },
    }
    return expressionMap[node.operator]();
  },

  UpdateExpression(node: t.UpdateExpression, scope) {
    const { prefix, argument, operator } = node;
    let $var: IVariable;
    if (argument.type === 'Identifier') {
      $var = scope.$find(argument.name);
      if (!$var) throw `${argument.name} 未定义`;
    } else if (argument.type === 'MemberExpression') {
      const obj = evaluate(argument.object, scope);
      let prop;
      if (argument.property.type === 'Identifier') {
        prop = argument.property.name;
      } else {
        prop = evaluate(argument.property, scope);
      }
      $var = {
        $set(value: any) {
          obj[prop] = value;
          return true;
        },
        $get() {
          return obj[prop];
        }
      }
    } else {
      throw '[Error] 出现错误'
    }

    const expressionMap = {
      '++': v => {
        $var.$set(v + 1);
        return prefix ? ++v : v++
      },
      '--': v => {
        $var.$set(v - 1);
        return prefix ? --v : v--
      },
    }

    return expressionMap[operator]($var.$get());
  },

  BinaryExpression(node: t.BinaryExpression, scope) {
    const { left, operator, right } = node;
    const expressionMap = {
      '==': (a, b) => a == b,
      '===': (a, b) => a === b,
      '>': (a, b) => a > b,
      '<': (a, b) => a < b,
      '!=': (a, b) => a != b,
      '!==': (a, b) => a !== b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
      '<<': (a, b) => a << b,
      '>>': (a, b) => a >> b,
      '>>>': (a, b) => a >>> b,
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
      '&': (a, b) => a & b,
      '%': (a, b) => a % b,
      '|': (a, b) => a | b,
      '^': (a, b) => a ^ b,
      'in': (a, b) => a in b,
      'instanceof': (a, b) => a instanceof b,
    }
    return expressionMap[operator](evaluate(left, scope), evaluate(right, scope));
  },

  AssignmentExpression(node: t.AssignmentExpression, scope) {
    const { left, right, operator } = node;
    let $var: IVariable;

    if (left.type === 'Identifier') {
      $var = scope.$find(left.name);
      if(!$var) throw `${left.name} 未定义`;
    } else if (left.type === 'MemberExpression') {
      const obj = evaluate(left.object, scope);
      let prop;
      if (left.property.type === 'Identifier') {
        prop = left.property.name;
      } else {
        prop = evaluate(left.property, scope);
      }
      $var = {
        $set(value: any) {
          obj[prop] = value;
          return true;
        },
        $get() {
          return obj[prop];
        }
      }
    } else {
      throw '[Error] 出现错误'
    }

    const expressionMap = {
      '=': v => { $var.$set(v); return $var.$get() },
      '+=': v => { $var.$set($var.$get() + v); return $var.$get() },
      '-=': v => { $var.$set($var.$get() - v); return $var.$get() },
      '*=': v => { $var.$set($var.$get() * v); return $var.$get() },
      '/=': v => { $var.$set($var.$get() / v); return $var.$get() },
      '%=': v => { $var.$set($var.$get() % v); return $var.$get() },
      '<<=': v => { $var.$set($var.$get() << v); return $var.$get() },
      '>>=': v => { $var.$set($var.$get() >> v); return $var.$get() },
      '>>>=': v => { $var.$set($var.$get() >>> v); return $var.$get() },
      '|=': v => { $var.$set($var.$get() | v); return $var.$get() },
      '&=': v => { $var.$set($var.$get() & v); return $var.$get() },
      '^=': v => { $var.$set($var.$get() ^ v); return $var.$get() },
    }

    return expressionMap[operator](evaluate(right, scope));
  },

  LogicalExpression(node: t.LogicalExpression, scope) {
    const { left, right, operator } = node;
    const expressionMap = {
      '&&': () => evaluate(left, scope) && evaluate(right, scope),
      '||': () => evaluate(left, scope) || evaluate(right, scope),
    }
    return expressionMap[operator]();
  },

  MemberExpression(node: t.MemberExpression, scope) {
    const { object, property } = node;
    const obj = evaluate(object, scope);
    let prop;
    if (property.type === 'Identifier') {
      prop = property.name;
    } else {
      prop = evaluate(property, scope);
    }
    return obj[prop];
  },

  ConditionalExpression(node: t.ConditionalExpression, scope) {
    const { test, consequent, alternate } = node;
    return evaluate(test, scope) ? evaluate(consequent, scope) : evaluate(alternate, scope);
  },

  CallExpression(node: t.CallExpression, scope) {
    const func = evaluate(node.callee, scope);
    const args = node.arguments.map(arg => evaluate(arg, scope));
    let _this;
    if (node.callee.type === 'MemberExpression') {
      _this = evaluate(node.callee.object, scope);
    } else {
      const $var = scope.$find('this');
      _this = $var ? $var.$get() : null;
    }
    return func.apply(_this, args);
  },

  NewExpression(node: t.NewExpression, scope) {
    const func = evaluate(node.callee, scope);
    const args = node.arguments.map(arg => evaluate(arg, scope));
    return new (func.bind(func, ...args));
  },

  SequenceExpression(node: t.SequenceExpression, scope) {
    let last;
    node.expressions.forEach(expr => {
      last = evaluate(expr, scope);
    })
    return last;
  },
}

const evaluate = (node: t.Node, scope) => {
  const evalFunc = evaluateMap[node.type];
  if (!evalFunc) {
    throw `${node.loc} ${node.type} 还未实现`;
  }
  return evalFunc(node, scope);
}

export default evaluate;
