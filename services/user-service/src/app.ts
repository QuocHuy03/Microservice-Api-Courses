const express = require("express");
import { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import userRouter from "./routes/user.routes";
import swaggerSpec from "./swagger";
import ProjectError from "./utils/error";
import { ReturnResponse } from "./utils/interfaces";

const app = express();
const server = http.createServer(app);
dotenv.config();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use("/v1/user-service", userRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (__: Request, res: Response) => {
  res.json({ status: 200, message: "Welcome to the API UserService!" });
});

app.use(
  (err: ProjectError, req: Request, res: Response, next: NextFunction) => {
    // logger for err
    let message: String;
    let statusCode: number;

    if (!!err.statusCode && err.statusCode < 500) {
      message = err.message;
      statusCode = err.statusCode;
    } else {
      message = "Something went wrong please try after sometime!";
      statusCode = 500;
    }

    let resp: ReturnResponse = { status: false, message, data: {} };
    if (!!err.data) {
      resp.data = err.data;
    }

    console.log(err.statusCode, err.message);
    res.status(statusCode).send(resp);
  }
);

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
