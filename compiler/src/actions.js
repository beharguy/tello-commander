const TOKEN_TYPES = require('./tokenTypes');
const PARSER_TYPES = require('./parserTypes');

module.exports = {
  'takeoff': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: () => console.log(`taking off`),
    arguments: []
  },
  'move': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => console.log(`moving by ${x} cm`),
    arguments: [TOKEN_TYPES.NUMBER]
  },
  'land': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: () => console.log(`landing`),
    arguments: []
  }
};