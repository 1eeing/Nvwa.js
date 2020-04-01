import * as t from '@babel/types';

const evaluateMap = {
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

  Literal(node: t.Literal, scope) {
    if (node.type === 'NullLiteral') {
      return null;
    }
    return (node as any).value;
  },

  BlockStatement(block: t.BlockStatement, scope) {

  },
}

const evaluate = (node: t.Node, scope) => {
  return evaluateMap[node.type](node, scope);
}

export default evaluate;
