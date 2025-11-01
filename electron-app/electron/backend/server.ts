import express from 'express';

const app = express();
const PORT = 5000;

app.get('/ping', (_, res) => {
  res.json({ message: 'Pong from backend 🏓' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
