const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const axios = require('axios');
const FormData = require('form-data');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const facialApiUrl = 'http://127.0.0.1:8000/analyze';
const voiceApiUrl = 'http://127.0.0.1:8001/analyze-voice'; // New voice service URL

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('a user connected');

    // Handler for facial analysis
    socket.on('video-frame', async (frame) => {
      try {
        const response = await axios.post(facialApiUrl, { image: frame });
        socket.emit('analysis-result', response.data);
      } catch (error) {
        console.error('Error calling Python Facial API:', error.message);
        socket.emit('analysis-error', { error: 'Failed to analyze frame.' });
      }
    });

    // Handler for voice analysis
    socket.on('audio-chunk', async (chunk) => {
        try {
            const formData = new FormData();
            formData.append('file', chunk, { filename: 'audio.wav', contentType: 'audio/wav' });

            const response = await axios.post(voiceApiUrl, formData, {
                headers: formData.getHeaders(),
            });

            socket.emit('voice-analysis-result', response.data);
        } catch (error) {
            console.error('Error calling Python Voice API:', error.response ? error.response.data : error.message);
            socket.emit('voice-analysis-error', { error: 'Failed to analyze audio.' });
        }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  httpServer.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});