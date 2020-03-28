const DEFAULT_EVENT_LOOP = next => next();

const execute = (commands, eventLoop) => {
  if (commands.length === 0) return;

  const [command, ...nextCommands]= commands;
  
  command();

  if (commands.length > 1) {
    eventLoop(() => execute(nextCommands, eventLoop));
  }
};

const executer = (commands, eventLoop = DEFAULT_EVENT_LOOP) => {
  execute(commands, eventLoop);
};

module.exports = executer;