import { useEffect, useState } from 'react';
import icon from '../../assets/icon.svg';
import './App.css';

export default function App() {
  const [ipcMessage, setIpcMessage] = useState('');

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on('ipc-example', (arg) => {
      setIpcMessage(String(arg));
    });

    window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

    return unsubscribe;
  }, []);

  return (
    <div className="app-shell">
      <img width="200" alt="icon" src={icon} />
      <h1>{'$${name_pretty}'}</h1>
      <p>{'$${description}'}</p>
      <p className="ipc-message">{ipcMessage}</p>
    </div>
  );
}
