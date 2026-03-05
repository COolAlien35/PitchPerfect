const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const axios = require('axios');
const FormData = require('form-data');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const facialApiUrl = 'http://127.0.0.1:8002/analyze';
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
        const response = await axios.post(facialApiUrl, { image: frame }, { timeout: 5000 });
        socket.emit('analysis-result', response.data);
      } catch (error) {
        // Only log once per connection rather than spamming
        if (!socket._facialApiWarned) {
          console.warn('Facial analysis service unavailable (port 8002). Returning neutral fallback.');
          socket._facialApiWarned = true;
        }
        // Return neutral fallback so the UI still works
        socket.emit('analysis-result', {
          emotion: { happy: 0, sad: 0, angry: 0, surprised: 0, neutral: 100, disgusted: 0, fearful: 0 },
          dominant_emotion: 'neutral'
        });
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