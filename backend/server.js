const dgram = require('dgram');
const _ = require('lodash');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const wait = require('./wait');
const createStore = require('./store');
const reducer = require('./reducer');
const commandDelays = require('./commandDelays');
const {TOKEN_TYPES, PARSER_TYPES, lexer, parser, compiler, executer} = require('../compiler/index');

const isUndefined = o => typeof o === 'undefined';
const isFunction = o => typeof o === 'function';

const HTTP_PORT = 6767;
const PORT = 8889;
const PORT_STATE = 8890;
const HOST = '192.168.10.1';

const DRON_STATE_INTERVAL = 100;

const MESSAGES = {
  command: ['command', 0, 'command'.length, PORT, HOST, handleError],
  battery: ['battery?', 0, 'battery?'.length, PORT, HOST, handleError],
  takeoff: ['takeoff', 0, 'takeoff'.length, PORT, HOST, handleError],
  land: ['land', 0, 'land'.length, PORT, HOST, handleError],
  ccw: ['ccw 90', 0, 'ccw 90'.length, PORT, HOST, handleError],
  flip: ['flip b', 0, 'flip b'.length, PORT, HOST, handleError]
};

const COMMANDS = {
  command: () => ['command', 0, 'command'.length, PORT, HOST, handleError],
  battery: () => ['battery?', 0, 'battery?'.length, PORT, HOST, handleError],
  takeoff: () => ['takeoff', 0, 'takeoff'.length, PORT, HOST, handleError],
  land: () => ['land', 0, 'land'.length, PORT, HOST, handleError],
  up: (x) => [`up ${x}`, 0, `up ${x}`.length, PORT, HOST, handleError],
  down: (x) => [`down ${x}`, 0, `down ${x}`.length, PORT, HOST, handleError],
  forward: x => [`forward ${x}`, 0, `forward ${x}`.length, PORT, HOST, handleError],
  back: x => [`back ${x}`, 0, `back ${x}`.length, PORT, HOST, handleError],
  left: x => [`left ${x}`, 0, `left ${x}`.length, PORT, HOST, handleError],
  right: x => [`right ${x}`, 0, `right ${x}`.length, PORT, HOST, handleError],
  cw: x => [`cw ${x}`, 0, `cw ${x}`.length, PORT, HOST, handleError],
  ccw: x => [`ccw ${x}`, 0, `ccw ${x}`.length, PORT, HOST, handleError],
  emergency: () => [`emergency`, 0, `emergency`.length, PORT, HOST, handleError]
};

const store = createStore(reducer, {actionStatus: 'waiting'});

store.subscribe(() => {
  console.log(store.getState().actionStatus);
});

const parseState = state => state.toString()
  .trim()
  .split(';')
  .reduce((stateObject, stateItem) => {
    const [key, value] = stateItem.split(':');
    
    if (key !== '') stateObject[key] = value;
    return stateObject;
  }, {});

let browserSocket = undefined;

const drone = dgram.createSocket('udp4');
const droneState = dgram.createSocket('udp4');

drone.bind(PORT);
droneState.bind(PORT_STATE);

const CODE = `להמריא להסתובב שמאלה 90 לנחות`;

const ACTIONS = {
  'להמריא': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: () => { console.log(`taking off`); drone.send(...COMMANDS.takeoff()) },
    arguments: []
  },

  'למעלה': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => { console.log(`moving up by ${x} cm`); drone.send(...COMMANDS.up(x)); },
    arguments: [TOKEN_TYPES.NUMBER]
  },
  'למטה': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => { console.log(`moving down by ${x} cm`); drone.send(...COMMANDS.down(x)); },
    arguments: [TOKEN_TYPES.NUMBER]
  },

  'ימינה': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => { console.log(`moving right by ${x} cm`); drone.send(...COMMANDS.right(x)); },
    arguments: [TOKEN_TYPES.NUMBER]
  },
  'שמאלה': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => { console.log(`moving left by ${x} cm`); drone.send(...COMMANDS.left(x)); },
    arguments: [TOKEN_TYPES.NUMBER]
  },

  'קדימה': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => { console.log(`moving forward by ${x} cm`); drone.send(...COMMANDS.forward(x)); },
    arguments: [TOKEN_TYPES.NUMBER]
  },
  'אחורה': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: x => { console.log(`moving back by ${x} cm`); drone.send(...COMMANDS.back(x)); },
    arguments: [TOKEN_TYPES.NUMBER]
  },

  'להסתובב': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: (direction, x) => {
      if (direction === 'ימינה') {
        console.log(`turning right by ${x} degrees`); 
        drone.send(...COMMANDS.cw(x)); 
      }
      if (direction === 'שמאלה') {
        console.log(`turning left by ${x} degrees`); 
        drone.send(...COMMANDS.ccw(x)); 
      } 
    },
    arguments: [TOKEN_TYPES.WORD, TOKEN_TYPES.NUMBER]
  },

  'לנחות': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: () => { console.log(`landing`); drone.send(...COMMANDS.land()) },
    arguments: []
  },

  'להמתין': {
    tokenType: TOKEN_TYPES.WORD, 
    parserType: PARSER_TYPES.COMMAND, 
    execute: (x) => { 
      console.log(`pause`);  
      setTimeout(() => {
        store.dispatch({type: 'actionStatus', actionStatus: 'ok'});
      }, x);
    },
    arguments: [TOKEN_TYPES.NUMBER]
  }
};

drone.on('message', (message) => {
  console.log(`🎂: ${message}`);
  if (message.toString().toLowerCase() === 'ok') {
    store.dispatch({type: 'actionStatus', actionStatus: 'ok'});
  } 
  else {
    store.dispatch({type: 'actionStatus', actionStatus: 'error'});
  }
});

droneState.on('message', _.throttle(state => {
  // console.log(state);
  var bb = Buffer.from(state);
  console.log(bb[45], bb[46]);
  
  // console.log(state.readUInt8(37));
  const formattedState = parseState(state);

  // console.log(formattedState);
  if (!isUndefined(browserSocket)) {
    browserSocket.emit('dronestate', formattedState);
  }
}, DRON_STATE_INTERVAL));

function handleError(err) {
  if (err) {
    console.log('ERROR');
    console.log(err);
  }
}

async function execute(code) {
  if (isUndefined(code)) return;

  const ast = parser(ACTIONS)(lexer(code))
  const commands = compiler(ACTIONS)(ast);

  executer(commands, next => {
    const unsubscribe = store.subscribe(() => {
      if (store.getState().actionStatus !== 'waiting') {
        store.dispatch({type: 'actionStatus', actionStatus: 'waiting'});
        unsubscribe();
        next();
      }
    });
  });
}

async function go(code = CODE) {
  // const executeCode = async () => {
  //   const ast = parser(ACTIONS)(lexer(code))
  //   const commands = compiler(ACTIONS)(ast);

  //   executer(commands, next => {
  //     const unsubscribe = store.subscribe(() => {
  //       if (store.getState().actionStatus !== 'waiting') {
  //         store.dispatch({type: 'actionStatus', actionStatus: 'waiting'});
  //         unsubscribe();
  //         next();
  //       }
  //     });
  //   });

  // };

  drone.send(...COMMANDS.command());
  await wait(1000);

  store.dispatch({type: 'actionStatus', actionStatus: 'waiting'});
  // await executeCode();
  await execute(code);
};

io.on('connection', socket => {
  console.log('Client connected');
  browserSocket = socket;
  socket.on('command', command => {
    console.log(command);
    const [commandName, ...commandArgs] = command.split(':');
    if (isFunction(COMMANDS[commandName])) {
      drone.send(...COMMANDS[commandName](...commandArgs));
    }
  });

  socket.on('execute', code => {
    go(code);
  });

  socket.on('disconnect', () => {
    browserSocket = undefined;
  })

  setTimeout(() => socket.emit('status', 'CONNECTED'), 1000);
});

http.listen(HTTP_PORT, () => {
  console.log(`socket io server up and running on port ${HTTP_PORT}`);
});

// go();
