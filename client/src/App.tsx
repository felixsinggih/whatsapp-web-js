import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { io } from 'socket.io-client'
import './App.css'

const socket = io("http://localhost:3000", {})

function App() {
  const [session, setSession] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [number, setNumber] = useState('6285156613166@c.us')
  const [message, setMessage] = useState('Hello, from whatsapp server')

  useEffect(() => {
    socket.emit('connected', 'Hello from client');

    socket.on('qrSend', (data) => {
      const { qr } = data;
      console.log('QR RECEIVED', qr);
      setQrCode(qr);
    })

    socket.on('authenticated', (data) => {
      console.log('AUTHENTICATED', data);
    })

  }, [])

  const createSessionForWhatsapp = () => {
    socket.emit('createSession', {
      id: session
    });
  }

  const sendMessage = () => {
    socket.emit('sendMessage', { number: number, message: message });
  }

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

      <div style={{ marginTop: 10 }}>
        <input type="text" value={number} onChange={(e) => setNumber(e.target.value)} />

        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />

        <button onClick={sendMessage}>Send Message</button>
      </div>
    </>
  )
}

export default App
