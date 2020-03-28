const TOKEN_TYPES = require('./tokenTypes');
const DIVIDER = /\s+/;

const lexer = code => {
  return code.split(DIVIDER)
    .filter(function (token) { return token.length > 0 })
    .map(token => {
      return isNaN(token)
              ? {type: TOKEN_TYPES.WORD, value: token}
              : {type: TOKEN_TYPES.NUMBER, value: token}
    })
};

module.exports = lexer;