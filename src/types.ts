import * as t from '@babel/types';

export interface NodeTypeMap {
  Identifier: t.Identifier
  Literal: t.Literal
  Program: t.Program
  FunctionDeclaration: t.FunctionDeclaration
  FunctionExpression: t.FunctionExpression
  ArrowFunctionExpression: t.ArrowFunctionExpression
  SwitchCase: t.SwitchCase
  CatchClause: t.CatchClause
  VariableDeclarator: t.VariableDeclarator
  ExpressionStatement: t.ExpressionStatement
  BlockStatement: t.BlockStatement
  EmptyStatement: t.EmptyStatement
  DebuggerStatement: t.DebuggerStatement
  WithStatement: t.WithStatement
  ReturnStatement: t.ReturnStatement
  LabeledStatement: t.LabeledStatement
  BreakStatement: t.BreakStatement
  ContinueStatement: t.ContinueStatement
  IfStatement: t.IfStatement
  SwitchStatement: t.SwitchStatement
  ThrowStatement: t.ThrowStatement
  TryStatement: t.TryStatement
  WhileStatement: t.WhileStatement
  DoWhileStatement: t.DoWhileStatement
  ForStatement: t.ForStatement
  ForInStatement: t.ForInStatement
  ForOfStatement: t.ForOfStatement
  VariableDeclaration: t.VariableDeclaration
  ClassDeclaration: t.ClassDeclaration
  ThisExpression: t.ThisExpression
  ArrayExpression: t.ArrayExpression
  ObjectExpression: t.ObjectExpression
  YieldExpression: t.YieldExpression
  UnaryExpression: t.UnaryExpression
  UpdateExpression: t.UpdateExpression
  BinaryExpression: t.BinaryExpression
  AssignmentExpression: t.AssignmentExpression
  LogicalExpression: t.LogicalExpression
  MemberExpression: t.MemberExpression
  ConditionalExpression: t.ConditionalExpression
  CallExpression: t.CallExpression
  NewExpression: t.NewExpression
  SequenceExpression: t.SequenceExpression
  TemplateLiteral: t.TemplateLiteral
  TaggedTemplateExpression: t.TaggedTemplateExpression
  ClassExpression: t.ClassExpression
  MetaProperty: t.MetaProperty
  AwaitExpression: t.AwaitExpression
  Property: t.Property
  Super: t.Super
  TemplateElement: t.TemplateElement
  SpreadElement: t.SpreadElement
  ObjectPattern: t.ObjectPattern
  ArrayPattern: t.ArrayPattern
  RestElement: t.RestElement
  AssignmentPattern: t.AssignmentPattern
  ClassBody: t.ClassBody
  ImportDeclaration: t.ImportDeclaration
  ExportNamedDeclaration: t.ExportNamedDeclaration
  ExportDefaultDeclaration: t.ExportDefaultDeclaration
  ExportAllDeclaration: t.ExportAllDeclaration
  ImportSpecifier: t.ImportSpecifier
  ImportDefaultSpecifier: t.ImportDefaultSpecifier
  ImportNamespaceSpecifier: t.ImportNamespaceSpecifier
  ExportSpecifier: t.ExportSpecifier
}

export type EvaluateMap = {
  [key in NodeTypeMap]: () => any
}
