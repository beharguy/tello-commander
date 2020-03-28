import React, {useEffect, useState} from 'react';
import socket from './socket';
import Battery from './Battery';
import PositionTracker from './PositionTracker';
import './App.css';

const useSocketStatus = () => {
  const [status, setStatus] = useState('DISCONNECTED');
  
  useEffect(() => {
    socket.on('status', setStatus);
  }, []);

  return status;
};

const useDroneState = () => {
  const [droneState, setDroneState] = useState({state: {}, x: 0, height: 0});
  
  useEffect(() => {
    socket.on('dronestate', (state) => {
      setDroneState({
        state,
        x: droneState.x + (state.vgx | 0),
        height: droneState.height + (state.h | 0)
      });
    });
  }, []);
  
  return droneState;
};

const App = () => {
  const [code, setCode] = useState('');
  const status = useSocketStatus();
  const droneState = useDroneState();
  
  return <div className="app">
    
    <div className="header">
      <Battery progress={droneState.state.bat}/>
      <div className="header-title">Tello drone</div>
      <div>{status}</div>
    </div>
    <br />
    <div>VGX: {droneState.state.vgx}</div>
    <div>VGY: {droneState.state.vgy}</div>
    <div>VGZ: {droneState.state.vgz}</div>
    <div>X: {droneState.x}</div>
    <br />
    <div>
      {Object.keys(droneState.state).map((key, index) => <span key={index}>{key}: {droneState.state[key]}</span>)}
    </div>

    <div className="workspace">
      <PositionTracker height={droneState.height} onClick={(deltaHeight) => {
        const absDeltaHeight = Math.abs(deltaHeight);
        console.log(absDeltaHeight);
        if (absDeltaHeight < 20) return;
        
        if (deltaHeight < 0) socket.emit('command', `up:${absDeltaHeight}`);
        else socket.emit('command', `down:${absDeltaHeight}`);
      }} />

      <div className="code-area">
        <div className="commands">
          <button onClick={() => socket.emit('command', 'land')}>נחיתה</button>
          &nbsp;
          <button onClick={() => socket.emit('command', 'takeoff')}>המראה</button>
          &nbsp;
          <button onClick={() => socket.emit('command', 'command')}>חיבור</button>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <button onClick={() => socket.emit('execute', code)}>הפעלה</button>
        </div>

        <textarea className="code" value={code} onChange={event => setCode(event.target.value)} />
      </div>
    </div>
  </div>;
}

export default App;
