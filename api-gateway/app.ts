const express = require("express");
const bodyParser = require("body-parser");
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const port = 3000;

app.use(bodyParser.json());

const routes: any = {
  "/users": "http://localhost:8002",
  "/products": "http://localhost:8001",
  "/orders": "http://localhost:8003",
};

for (const route in routes) {
  const target = routes[route];
  app.use(route, createProxyMiddleware({ target }));
}
app.listen(port, () => {
  console.log(`API Gateway listening at http://localhost:${port}`);
});
