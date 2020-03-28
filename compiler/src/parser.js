const TOKEN_TYPES = require('./tokenTypes');
const PARSER_TYPES = require('./parserTypes');
const ACTIONS = require('./actions');

const isUndefined = o => typeof o === 'undefined';

const getNextToken = tokens => tokens.length > 1 ? tokens[1] : undefined;
const getNextTokens = (tokens, amount = 1) => tokens.length > 1 ? tokens.slice(1, Math.min(amount + 1, tokens.length)) : [];
const getShiftehTokens = (tokens, shiftBy = 1) => tokens.length > shiftBy ? tokens.slice(shiftBy) : [];

const parseTokens = (astBody, tokens = [], actions) => {
  if (tokens.length === 0) return [];

  const token = tokens[0];
  const tokenType = token.type;
  const tokenValue = token.value;
  const action = actions[tokenValue]

  if (isUndefined(action) || action.tokenType !== tokenType) {
    console.log(`ParserError: ${tokenValue} doesn't exist`);
    return;
  }

  const arguments = getNextTokens(tokens, action.arguments.length);
  const areValidArguments = arguments.every((argument, index) => argument.type === action.arguments[index]);

  if (!areValidArguments) {
    console.log(`ParserError: ${tokenValue} arguments are not valid`);
    return;
  }

  const parsedNextTokens = parseTokens(astBody, getShiftehTokens(tokens, 1 + arguments.length), actions);

  if (isUndefined(parsedNextTokens)) return undefined;

  return astBody.concat({
    type: action.parserType,
    name: tokenValue,
    arguments: arguments.map(argument => argument.value)
  }).concat(parsedNextTokens);
};

const parser = (actions = ACTIONS) => (tokens) => {
  const parsedTokens = parseTokens([], tokens, actions);

  if (isUndefined(parsedTokens)) return;

  return {
    type: PARSER_TYPES.TREE,
    body: parsedTokens
  };
};

module.exports = parser;