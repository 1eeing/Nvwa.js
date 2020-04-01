import { parse } from '@babel/parser';
import evaluate from './eval';

const run = (code: string) => {
  const ast = parse(code);
  evaluate(ast);
}

export default run;
