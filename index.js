const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const app = express();
const port = process.env.PORT || 5000;




const serviceAccount = require("./tush-bike-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());

// tush-bike-firebase-adminsdk.json

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];

      try {
          const decodedUser = await admin.auth().verifyIdToken(token);
          req.decodedEmail = decodedUser.email;
      }
      catch {

      }

  }
  next();
}


const uri = "mongodb+srv://tushanafnan:Tushan123@cluster0.lr4x6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("tush-bike").collection("sample");
  console.log("Hitting the database by Tushan");});

  async function run () {
    try {
        await client.connect ();
        const database = client.db('tush-bike');
        const productCollection = database.collection('sample');
        const exploreCollection = database.collection('explore');
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewCollection = database.collection('review');


        app.get('/products', async (req,res)=> {
            const cursor = productCollection.find ({});
            const products = await cursor.toArray();
            res.send(products);
        });
        app.get('/explore', async (req,res)=> {
            const cursor = exploreCollection.find ({});
            const products = await cursor.toArray();
            res.send(products);
        });
        app.get('/orders', async (req,res)=> {
            
            const cursor = ordersCollection.find ({});
            const orders = await cursor.toArray();
            res.send(orders);
        });

        
        //POST API

        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await ordersCollection.insertOne(orders);
            res.json(result);
        })

        app.get("/myBookings/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            console.log(query);
            const result = await ordersCollection.find(query).toArray();
            res.json(result);
          });


          app.get("/manageAllBookings", async (req, res) => {
            const cursor = ordersCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
          });
       
       
        app.delete('/deleteBooking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
       
            res.json(result);
          });

          //USER&ADMIN

          app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }
          });
      
          app.post("/addPackage", async (req, res) => {
            const package = req.body;
            const result = await exploreCollection.insertOne(package);
            res.json(result);
          });

          app.get("/allPackage", async (req, res) => {
            const cursor = exploreCollection.find({});
            const package = await cursor.toArray();
            res.json(package);
          });
          app.post("/review", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.json(result);
          });

          app.get("/review", async (req, res) => {
            const cursor = reviewCollection.find({});
            const review = await cursor.toArray();
            res.json(review);
          });
      
          app.put("/approveBooking/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const Booking = {
              $set: {
                status: "Shipped",
              },
            };
            const result = await ordersCollection.updateOne(query, Booking);
            res.json(result);
          });
      

    }
    finally {
        //client.close ();
    }
}
run().catch(console.dir);


app.get("/", (req, res)=> {
    res.send(" <b> Backend Server for Tush Bike </b>");
});

app.listen(port,()=> {
    console.log("Running Server on port", port);
});

