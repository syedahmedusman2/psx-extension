import express from 'express'

const app = express();
import fetch from 'node-fetch';

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;