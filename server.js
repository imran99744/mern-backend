// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1315739",
  key: "15c9bc416f4b54ad6d96",
  secret: "43f22cc444b8f4a7ce47",
  cluster: "mt1",
  useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());

// db config
// const connection_url =
//   "mongodb+srv://whatsapp:whatsapp123@cluster0.tq4v3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(process.env.connection_url, {
  //   useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change occurred", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

// api end points
app.get("/", (req, res) => res.status(200).send("Everything is working well"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// app lister
app.listen(port, () =>
  console.log(`Server is listening on localhost: ${port}`)
);
