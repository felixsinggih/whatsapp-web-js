const express = require('express');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;
app.use(bodyParser.json());

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

app.post('/send-message', async (req, res) => {
    console.log(req.body);
    const { clientId, number, message } = req.body;

    try {
        let formatedNumber = ''
        number.startsWith('0') ? formatedNumber = `62${number.slice(1)}@c.us` : formatedNumber = `${number}@c.us`

        const user = await allSessionsObject[clientId].isRegisteredUser(formatedNumber)

        if (!user) {
            console.log('User not registered')
            res.json({ status: 500, message: 'User not registered' });
            return
        }

        await allSessionsObject[clientId].sendMessage(formatedNumber, message)
        res.json({ status: 200, message: 'Message sent' });
    } catch (e) {
        console.log(e)
        res.json({ status: 500, message: 'Failed to send message' });
    }
});

const allSessionsObject = {};

// restore all sessions
const restoreSessions = async () => {
    const devices = [1, 2, 3]

    devices.forEach((session) => {
        console.log('Creating session: ', session);
        const client = new Client({
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process', // <- this one doesn't works in Windows
                    '--disable-gpu'
                ],
            },
            authStrategy: new LocalAuth({
                clientId: session,
            }),
        });

        client.on('ready', () => {
            console.log('Client is ready: ', session);
            allSessionsObject[session] = client;
        });

        client.on('qr', (qr) => {
            console.log('Client destroy: ', session);
            client.destroy();
        });

        client.initialize();
    });

    console.log('Total connected users:', allSessionsObject.length);
};

// resore all closed sessions
restoreSessions();

const createWhatsappSession = (id, socket) => {
    let tryToConnect = 0;

    const client = new Client({
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        },
        authStrategy: new LocalAuth({
            clientId: id,
        }),
    });

    client.on('qr', (qr) => {
        console.log('QR SEND', qr);
        socket.emit('qrSend', { qr });

        tryToConnect++;
        console.log('Try to connect:', tryToConnect);
        if (tryToConnect > 3) {
            client.destroy();
            socket.emit('connectionFailed', { message: 'Failed to connect' })
            console.log('Client destroy: ', id);
            return;
        }

        // qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', () => {
        console.log('AUTHENTICATED');

        socket.emit('authenticated', { message: 'Client is authenticated' });
    });

    client.on('auth_failure', () => {
        console.log('AUTH FAILURE');
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
    });

    client.on('ready', () => {
        console.log('Client is ready');
        allSessionsObject[id] = client;
        socket.emit('ready', { id, message: 'Client is ready' });

        // console.log(allSessionsObject);
    });

    client.initialize();
}

const sendMessage = async (client, number, message) => {
    try {
        let formatedNumber = ''
        number.startsWith('0') ? formatedNumber = `62${number.slice(1)}@c.us` : formatedNumber = `${number}@c.us`

        const user = await client.isRegisteredUser(formatedNumber)

        if (!user) {
            console.log('User not registered')
            return
        }

        await client.sendMessage(formatedNumber, message)
        console.log('number:', formatedNumber, 'message:', message, 'sent!')
    } catch (e) {
        console.log(e)
    }
}

io.on('connection', (socket) => {
    console.log('User connected', socket?.id);
    // console.log('Total connected users:', allSessionsObject.length);

    socket.on('disconnect', () => {
        console.log('User disconnected', socket?.id);
    });

    socket.on('connected', (data) => {
        console.log('Connected to the server', data);
        socket.emit('hello', 'Hello from server');
    });

    socket.on('createSession', (data) => {
        console.log(data);
        const { id } = data;

        const isSessionExist = allSessionsObject[id];

        if (isSessionExist) {
            socket.emit('sessionExist', { id, message: 'Session already exist' });
            return;
        } else {
            socket.emit('createSession', { id, message: 'Creating session' })

            createWhatsappSession(id, socket);
        }
    });

    socket.on('sendMessage', (data) => {
        // console.log(data);
        const { clientId, number, message } = data;
        sendMessage(allSessionsObject[clientId], number, message)
    })
});