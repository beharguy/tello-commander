const TOKEN_TYPES = require('./src/tokenTypes');
const PARSER_TYPES = require('./src/parserTypes');

const lexer = require('./src/lexer');
const parser = require('./src/parser');
const compiler = require('./src/compiler');
const executer = require('./src/executer');

// const code = `takeoff 
// move 10 
// move -10 
// land`;

// const ast = parser(lexer(code))
// const commands = compiler()(ast);
// executer(commands, (next) => {
//   setTimeout(next, 2000);
// });

module.exports = {
  TOKEN_TYPES,
  PARSER_TYPES,

  lexer,
  parser,
  compiler,
  executer
};