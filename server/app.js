const express = require('express');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;

const expressServer = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173']
    }
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

const allSessionsObject = {};

const createWhatsappSession = (id, socket) => {
    const client = new Client({
        puppeteer: {
            headless: false,
        },
        authStrategy: new LocalAuth({
            clientId: id,
        }),
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        socket.emit('qrSend', { qr });
        // qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
    });

    client.on('ready', () => {
        console.log('Client is ready');
        allSessionsObject[id] = client;
        socket.emit('ready', { id, message: 'Client is ready' });
    });

    client.initialize();
}

io.on('connection', (socket) => {
    console.log('User connected', socket?.id);

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('connected', (data) => {
        console.log('Connected to the server', data);
        socket.emit('hello', 'Hello from server');
    });

    socket.on('createSession', (data) => {
        console.log(data);
        const { id } = data;
        createWhatsappSession(id, socket);
    });
});