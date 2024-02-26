import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { io } from 'socket.io-client'
import './App.css'

const socket = io("http://localhost:3000", {})

function App() {
  const [session, setSession] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [number, setNumber] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    socket.emit('connected', 'Hello from client');

    socket.on('createSession', (data) => {
      console.log('CREATE SESSION', data);
      setLoading(true);
    })

    socket.on('qrSend', (data) => {
      const { qr } = data;
      console.log('QR RECEIVED', qr);
      setQrCode(qr);
      setLoading(false);
    })

    socket.on('connectionFailed', () => {
      setQrCode('');
      setLoading(false);
    })

    socket.on('authenticated', (data) => {
      console.log('AUTHENTICATED', data);
    })

    socket.on('ready', (data) => {
      console.log('READY', data);
      setQrCode('');
      setLoading(false);
      setReady(true);
    })

    socket.on('sessionExist', (data) => {
      console.log('SESSION EXIST', data);
      setReady(true);
    })
  }, [])

  const createSessionForWhatsapp = () => {
    socket.emit('createSession', {
      id: session
    });
  }

  const sendMessage = () => {
    socket.emit('sendMessage', { clientId: session, number: number, message: message });
  }

  return (
    <>
      <h1 className='text-3xl font-bold text-center mb-6'>WhatsApp Web Js</h1>

      {ready === false &&
        <div className='text-center max-w-sm mx-auto mb-4'>
          <h2 className='text-xl font-semibold mb-4'>Enter Your ID to start the session</h2>

          <div className='flex items-center space-x-2'>
            <input type="text" value={session} onChange={(e) => setSession(e.target.value)}
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 inline-block w-full p-2' />

            <button onClick={createSessionForWhatsapp}
              className='text-white w-52 bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 font-medium rounded text-sm p-2'>
              Create Session
            </button>
          </div>
        </div>
      }

      {ready &&
        <h2 className='text-center text-xl font-semibold mb-4'>
          Your session ID is {session}
        </h2>
      }

      {loading &&
        <h2 className='text-center text-xl font-semibold mb-4'>Loading...</h2>
      }

      {qrCode &&
        <div className='text-center mb-4'>
          <h2 className='text-xl font-semibold mb-4'>Scan barcode to start the session</h2>

          <QRCode value={qrCode}
            className='inline-block p-5 bg-white rounded' />
        </div>
      }


      {ready &&
        <div className='text-center'>
          <input type="text" value={number} onChange={(e) => setNumber(e.target.value)}
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 inline-block w-full p-2 mb-2' placeholder='Phone number' />

          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 inline-block w-full p-2 mb-2' placeholder='Message' />

          <button onClick={sendMessage}
            className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 font-medium rounded text-sm p-2'>
            Send Message
          </button>
        </div>
      }
    </>
  )
}

export default App
