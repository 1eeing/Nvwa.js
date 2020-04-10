import parse from './parser';
import evaluate from './eval';
import { createGlobalScope } from './scope';
import { EmptyObj } from './types';

const createContext = (injectorApis?: EmptyObj) => {
  const scope = createGlobalScope(injectorApis);

  const run = (code: string) => {
    const ast = parse(code);
    evaluate(ast, scope);

    const moduleVal = scope.$find('module');
    return moduleVal ? moduleVal.$get().exports : null;
  }

  return run;
}

export default createContext;
