import { IScope, IVariable, Kind, ScopeType } from './types';

export class Variable implements IVariable {
  constructor(
    private kind: Kind,
    private value: any
  ){ }

  $get() {
    return this.value
  }

  $set(value: any) {
    if (this.kind === 'const') {
      return false
    }
    this.value = value;
    return true;
  }
}

export class Scope implements IScope {
  public readonly variables: {[key: string]: any} = {}

  constructor(
    private readonly scopeType: ScopeType,
    public readonly bad = false,
    private parent: Scope = null,
  ) { }

  $const(varName: string, value: any) {
    const variable = this.variables[varName];
    if (!variable) {
      this.variables[varName] = new Variable('const', value);
      return true;
    }
    return false;
  }

  $let(varName: string, value: any) {
    const variable = this.variables[varName];
    if (!variable) {
      this.variables[varName] = new Variable('let', value);
      return true;
    }
    return false;
  }

  $var(varName: string, value: any) {
    let scope: Scope = this;
    while (!!scope.parent && scope.scopeType !== 'function') {
      scope = scope.parent;
    }
    const variable = scope.variables[varName];
    if (!variable) {
      scope.variables[varName] = new Variable('var', value);
      return true;
    }
    return false;
  }

  $define(kind: Kind, varName: string, value: any): boolean {
    const funcMap = {
      const: this.$const.bind(this),
      let: this.$let.bind(this),
      var: this.$var.bind(this),
    };
    return funcMap[kind](varName, value);
  }

  $find(varName: string): null | IVariable {
    if (this.variables.hasOwnProperty(varName)) {
      return this.variables[varName];
    }
    if (this.parent) {
      return this.parent.$find(varName);
    }
    return null;
  }
}

// 默认全局对象
const globalApis: { [key: string]: any } = {
  console,

  setTimeout,
  setInterval,

  clearTimeout,
  clearInterval,

  encodeURI,
  encodeURIComponent,
  decodeURI,
  decodeURIComponent,
  escape,
  unescape,

  Infinity,
  NaN,
  isFinite,
  isNaN,
  parseFloat,
  parseInt,
  Object,
  Boolean,
  Error,
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError,
  Number,
  Math,
  Date,
  String,
  RegExp,
  Array,
  JSON,
  Promise
}

export const createGlobalScope = () => {
  const scope = new Scope('block');

  Object.keys(globalApis).forEach(apiName => {
    scope.$const(apiName, globalApis[apiName]);
  });

  scope.$const('this', scope.variables);
  return scope;
}
