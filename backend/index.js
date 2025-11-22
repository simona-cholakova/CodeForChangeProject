const express = require("express");
const cors = require("cors");
const app = express();
import ttsRoutes from './routes/ttsRoutes.js';
const port = 5000;

app.use(cors());

app.use('/api', ttsRoutes);

app.get("/api/items", (req, res) => {
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});