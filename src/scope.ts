import { IScope, IVariable, Kind, ScopeType, EmptyObj } from './types';

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
  public readonly variables: EmptyObj = Object.create(null);

  constructor(
    private readonly scopeType: ScopeType,
    private parent: Scope = null,
    public readonly shared = false,
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
    if (Reflect.has(this.variables, varName)) {
      return Reflect.get(this.variables, varName);
    }
    if (this.parent) {
      return this.parent.$find(varName);
    }
    return null;
  }
}

// 默认全局对象
const defaultApis: EmptyObj = {
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

const proxyThis = (target: any) => {
  return new Proxy(target, {
    set(t, key, value) {
      const v = t[key];
      if (v) {
        return v.$set(value);
      }
      t[key] = new Variable('let', value);
      return true;
    },

    get(t, key) {
      const v = t[key];
      if (v) {
        return v.$get();
      }
      return void 0;
    },
  })
}

export const createGlobalScope = (injectorApis: EmptyObj = Object.create(null)) => {
  const scope = new Scope('block');
  const apis = { ...defaultApis, ...injectorApis };

  Object.keys(apis).forEach(apiName => {
    scope.$const(apiName, apis[apiName]);
  });

  const $exports = Object.create(null);
  const $module = { 'exports': $exports };
  scope.$const('module', $module);
  scope.$const('exports', $exports);
  scope.$const('this', proxyThis(scope.variables));

  return scope;
}
