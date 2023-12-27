
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const userServiceUrl = 'http://localhost:3001';
const productServiceUrl = 'http://localhost:3002';

app.post('/users', async (req, res) => {
  const response = await axios.post(`${userServiceUrl}/users`, req.body);
  res.json(response.data);
});

app.get('/users', async (req, res) => {
  const response = await axios.get(`${userServiceUrl}/users`);
  res.json(response.data);
});

app.post('/products', async (req, res) => {
  const response = await axios.post(`${productServiceUrl}/products`, req.body);
  res.json(response.data);
});

app.get('/products', async (req, res) => {
  const response = await axios.get(`${productServiceUrl}/products`);
  res.json(response.data);
});

app.listen(port, () => {
  console.log(`API Gateway listening at http://localhost:${port}`);
});
