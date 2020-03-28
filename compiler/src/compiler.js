const PARSER_TYPES = require('./parserTypes');
const ACTIONS = require('./actions');

const isUndefined = o => typeof o === 'undefined';

const compiler = (actions = ACTIONS) => (ast) => {
  if (isUndefined(ast)) return [];

  return ast.body.map(bodyNode => {
    const nodeType = bodyNode.type;
    const nodeName = bodyNode.name;
    const arguments = bodyNode.arguments || [];
    const action = actions[nodeName];
    
    if (isUndefined(action) || action.parserType !== nodeType) {
      console.error(`CompilerError: no such type ${nodeName} of type ${nodeType}`); 
      return [];
    }

    
    return action.execute.bind(undefined, ...arguments);
  });
};

module.exports = compiler;