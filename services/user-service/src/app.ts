const express = require("express");
import { Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import userRouter from "./routes/user.routes";
import swaggerSpec from "./swagger";

const app = express();
const server = http.createServer(app);
dotenv.config();
const port = process.env.PORT;
mongoose
  .connect(process.env.MONGODB_CONNECT)
  .then(() => {
    console.log("MongoDB is ready");

    server.listen(port, () => {
      console.log(`SERVER USER_SERVICE RUNNING : ${port}`);
    });
  })
  .catch((err: any) => {
    console.log(`MongoDB error: ${err}`);
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use("/auth", userRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ status: 200, message: "Welcome to the API UserService!" });
});
