import * as t from '@babel/types';
import { Scope } from './scope';

export interface EmptyObj { [key: string]: any };

export type Kind = 'const' | 'var' | 'let';

export type ScopeType = 'function' | 'loop' | 'switch' | 'block';

export interface IVariable {
  $get: () => any
  $set: (value: any) => boolean
}

export interface IScope {
  $var: (varName: string, value: any) => boolean
  $let: (varName: string, value: any) => boolean
  $const: (varName: string, value: any) => boolean
  $define: (kind: Kind, varName: string, value: any) => boolean
  $find: (varName: string) => null | IVariable
}

export type EvaluateMap = {
  [key in t.Node['type']]?: (node: t.Node, scope: Scope) => any
}
