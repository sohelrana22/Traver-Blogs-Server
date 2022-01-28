const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bdjvz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const userDb = client.db("Travel-Blogs");
    const usersCollection = userDb.collection("users");
    const usersBlogs = userDb.collection("userBlog");
    app.post("/saveusers", async (req, res) => {
      const user = req.body;
      const savetodb = await usersCollection.insertOne(user);
      res.send(savetodb);
    });
    app.put("/makeadmin", async (req, res) => {
      const email = req.body.email;
      const options = { upsert: true };
      const user = await usersCollection.findOne({ email });
      if (user) {
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const update = await usersCollection.updateOne(
          { email },
          updateDoc,
          options
        );
        res.send(update);
      }
    });
    app.get("/getadmin/:email", async (req, res) => {
      const userEmail = req.params.email;
      const user = await usersCollection.findOne({ email: userEmail });
      if (user) {
        if (user.role === "admin") {
          res.send({ admin: true });
        }
      } else {
        res.send({ admin: false });
      }
    });
    app.post("/newblog", async (req, res) => {
      const data = req.body;
      const result = await usersBlogs.insertOne(data);
      res.send(result);
    });
    app.put("/editblog/:id", async (req, res) => {
      const updatedata = req.body;
      const id = ObjectId(req.params.id);
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          ...updatedata,
        },
      };
      console.log(updateDoc);

      const updateBlog = await usersBlogs.updateOne(
        { _id: id },
        updateDoc,
        options
      );
      res.send(updateBlog);
    });

    app.delete("/blogdelete/:id", async (req, res) => {
      const id = ObjectId(req.params.id);
      const deleted = await usersBlogs.deleteOne({ _id: id });
      res.send(deleted);
    });
    app.get("/getblog/:id", async (req, res) => {
      const id = ObjectId(req.params.id);
      const findBlog = await usersBlogs.findOne({ _id: id });
      res.send(findBlog);
    });
    app.get("/blogs_collection", async (req, res) => {
      const cursor = usersBlogs.find({ status: "approved" });
      const blogsCount = await usersBlogs.find({ status: "approved" }).count();
      const page = req.query.page;
      let allblogs;
      if (page) {
        allblogs = await cursor
          .skip(page * 10)
          .limit(10)
          .toArray();
      } else {
        allblogs = await cursor.toArray();
      }

      res.send({
        allblogs,
        blogsCount,
      });
    });
    app.get("/getblogs", async (req, res) => {
      const allcarts = await usersBlogs.find({}).toArray();
      res.send(allcarts);
    });
    app.put("/approveblog/:id", async (req, res) => {
      const id = ObjectId(req.params.id);
      const options = { upsert: true };
      // create a document that sets the plot of the movie
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const update = await usersBlogs.updateOne(
        { _id: id },
        updateDoc,
        options
      );
      res.send(update);
    });
  } finally {
  }
}

run().catch((error) => console.log(error));
app.get("/", (req, res) => {
  res.send("Server Running Succesfully");
});
app.listen(port, () => {
  console.log(`Server Running On http://localhost:${port}/`);
});
