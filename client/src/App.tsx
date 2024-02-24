import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { io } from 'socket.io-client'
import './App.css'

const socket = io("http://localhost:3000", {})

function App() {
  const [session, setSession] = useState('');
  const [qrCode, setQrCode] = useState('');
  const createSessionForWhatsapp = () => {
    socket.emit('createSession', {
      id: session
    });
  };

  useEffect(() => {
    socket.emit('connected', 'Hello from client');
    socket.on('qrSend', (data) => {
      const { qr } = data;
      console.log('QR RECEIVED', qr);
      setQrCode(qr);
    })
  }, [])


  return (
    <>
      <h2>WhatsApp Web Js</h2>

      <h2>QR Code</h2>

      <div style={{ marginBottom: 10 }}>
        <input type="text" value={session} onChange={(e) => setSession(e.target.value)} />

        <button onClick={createSessionForWhatsapp}>Create Session</button>
      </div>

      <div style={{ padding: 20, backgroundColor: 'white' }}>
        <QRCode value={qrCode} />
      </div>
    </>
  )
}

export default App
