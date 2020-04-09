import * as t from '@babel/types';
import { EvaluateMap } from './types';
import { Scope } from './scope';

const BREAK = {};
const CONTINUE = {};
const RETURN: { result: any } = { result: void 0 };

const evaluateMap: EvaluateMap = {
  Program(program: t.Program, scope) {
    for (const node of program.body) {
      evaluate(node, scope);
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
    const blockScope = scope.bad ? scope : new Scope('block', false, scope);
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
    RETURN.result === node.argument ? evaluate(node.argument, scope) : void 0;
    return RETURN;
  },

  BreakStatement(node: t.BreakStatement, scope) {
    return BREAK;
  },

  ContinueStatement(node: t.ContinueStatement, scope) {
    return CONTINUE;
  },

  IfStatement(node: t.IfStatement, scope) {
    const ifScope = new Scope('block', true, scope);
    if (evaluate(node.test, scope)) {
      return evaluate(node.consequent, ifScope);
    }
    if (evaluate(node.alternate, scope)) {
      return evaluate(node.alternate, ifScope)
    }
  },

  SwitchStatement(node: t.SwitchStatement, scope) {
    const discriminant = evaluate(node.discriminant, scope);
    const switchScope = new Scope('switch', false, scope);
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
        const catchScope = new Scope('block', true, scope);
        catchScope.$let((node.handler.param as t.Identifier).name, error);
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
      const whileScope = new Scope('loop', true, scope);
      const res = evaluate(node.body, whileScope);
      if (res === CONTINUE) continue;
      if (res === BREAK) break;
      if (res === RETURN) return res;
    }
  },

  ForStatement(node: t.ForStatement, scope) {
    for (
      const forScope = new Scope('loop', false, scope),
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
      const forScope = new Scope('loop', true, scope);
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
      const forScope = new Scope('loop', true, scope);
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
    const kind = node.kind;
    for (const decl of node.declarations) {
      const varName = (<t.Identifier>decl.id).name;
      const value = decl.init;
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
    let res = {};
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
    return (...args) => {

    }
  },

  UnaryExpression(node: t.UnaryExpression, scope) {

  },

  UpdateExpression(node: t.UpdateExpression, scope) {

  },

  BinaryExpression(node: t.BinaryExpression, scope) {

  },

  AssignmentExpression(node: t.AssignmentExpression, scope) {

  },

  LogicalExpression(node: t.LogicalExpression, scope) {

  },

  MemberExpression(node: t.MemberExpression, scope) {

  },

  ConditionalExpression(node: t.ConditionalExpression, scope) {

  },

  CallExpression(node: t.CallExpression, scope) {

  },

  NewExpression(node: t.NewExpression, scope) {

  },

  SequenceExpression(node: t.SequenceExpression, scope) {

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
