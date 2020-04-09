import parse from './parser';
import evaluate from './eval';
import { createGlobalScope } from './scope';

const run = (code: string) => {
  const scope = createGlobalScope();
  const ast = parse(code);
  evaluate(ast, scope);
}

export default run;
