
//import
const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const port = process.env.PORT || 4000
const jwt = require('jsonwebtoken');

//middleware
app.use(bodyParser.json())
//app.use(cors())
const corsConfig = {
    origin: true,
    credentials: true,
  }
  app.use(cors(corsConfig))
  app.options('*', cors(corsConfig))


  function checkJwt(req, res, next) {
    const hederAuth = req.headers.authorization
    if (!hederAuth) {
        return res.status(401).send({ message: 'unauthorized access.try again' })
    }
    else {
        const token = hederAuth.split(' ')[1]
     //   console.log({token});
        jwt.verify(token,process.env.ACCESS_JWT_TOKEN, (err, decoded) => {
            if (err) {
               // console.log(err);
                return res.status(403).send({ message: 'forbidden access' })
            }
         //   console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
  //  console.log(hederAuth, 'inside chckjwt');
   
}


//connect to db


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eowzq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//console.log(process.env.ACCESS_JWT_TOKEN);
function checkJwt(req, res, next) {
    const hederAuth = req.headers.authorization
    if (!hederAuth) {
        return res.status(401).send({ message: 'unauthorized access.try again' })
    }
    else {
        const token = hederAuth.split(' ')[1]
        //console.log({token});
        jwt.verify(token,process.env.ACCESS_JWT_TOKEN, (err, decoded) => {
            if (err) {
              //  console.log(err);
                return res.status(403).send({ message: 'forbidden access' })
            }
            //console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
   // console.log(hederAuth, 'inside chckjwt');
   
}
async function run() {
    try {

        await client.connect();
        const partsCollection = client.db('SP-Menufecture').collection('parts')
        const usersCollection = client.db('SP-Menufecture').collection('users')
        console.log("sp db connected")
        const ordersCollection = client.db('SP-Menufecture').collection("ordersCollection");
       
        const reviewsCollection = client.db('SP-Menufecture').collection("reviewsCollection");

        
   //create user

   app.put('/user/:email', async (req, res) => {
    const email = req.params.email;
    const user = req.body
    const filter = { email: email }
    const options = { upsert: true }
    const updateDoc = {
        $set: user,
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options)
  const getToken = jwt.sign({email:email},process.env.ACCESS_JWT_TOKEN,{expiresIn:'1h'})
    res.send({result,getToken})
})
   //Verify Admin Role 
   const verifyAdmin = async (req, res, next) => {
    const requester = req.decoded.email;
    const requesterAccount = await usersCollection.findOne({
        email: requester,
    });
    if (requesterAccount.role === "admin") {
        next();
    } else {
        res.status(403).send({ message: "Forbidden" });
    }
        };
                // //API to make Admin by verifyAdmin,
                // app.put("/user/admin/:email", checkJwt,verifyAdmin,  async (req, res) => {
                //     const email = req.params.email;
                //     const filter = { email: email };
                //     const updateDoc = {
                //         $set: { role: "admin" },
                //     };
                //     const result = await usersCollection.updateOne(filter, updateDoc);
                //     res.send(result);
                // });
        
                //API to get admin 
                app.get("/admin/:email", async (req, res) => {
                    const email = req.params.email;
                    const user = await usersCollection.findOne({ email: email });
                    const isAdmin = user.role === "admin";
                    res.send({ admin: isAdmin });
                });
                //Authentication API 
                app.post("/login", async (req, res) => {
                    const user = req.body;
                    const getToken= jwt.sign(user, process.env.ACCESS_JWT_TOKEN, {
                        expiresIn: "1d",
                    });
                    res.send({ getToken });
                });
        //products add
                app.post('/parts',checkJwt,verifyAdmin, async (req, res) => {
                    const parts = req.body
                    const result =await partsCollection.insertOne(parts)
                    res.send(result)
        })
         ////API to get all orders
         app.get("/orders", async (req, res) => {
            const orders = await ordersCollection.find({}).toArray();
            res.send(orders);
        });
        app.post('/order', async (req, res) => {

            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })
        //API to update a order 
        app.put("/orders/:id", async (req, res) => {
            const orderId = req.params.id;
            const order = req.body;
            const query = { _id: ObjectId(orderId) };
            const options = { upsert: true };
            const updatedOrder = await ordersCollection.findOneAndUpdate(
                query,
                {
                    $set: order,
                },
                options
            );
            res.send(updatedOrder);
        });
        //order delete
        app.delete("/order/:id", checkJwt,verifyAdmin, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const id = req.params.id;
            const email = req.headers.email;
            if ( decodedEmail) {
                
              const result =  await ordersCollection.deleteOne({ _id: ObjectId(id) });
                res.send(result);
            } else {
                res.send("Unauthorized access");
            }
        });
          // get orders by email 
          app.get('/singleOrder', checkJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email: email }
            const cursor = ordersCollection.find(query)
            const items = await cursor.toArray()
            res.send(items)
            }
            else {
                return res.status(403).send({ message: 'forbidden access' })
            }
           })

        //API to get all reviews 
        app.get("/reviews", async (req, res) => {
            const reviews = await reviewsCollection.find({}).toArray();
            res.send(reviews);
        });
        //API to post a review 
        app.post('/review', async (req, res) => {

            const newReview = req.body;
            
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result)
        })
        //API to post a product 
        // app.post("/product", checkJwt, async (req, res) => {
        //     const decodedEmail = req.decoded.email;
        //     const email = req.headers.email;
        //     if (email === decodedEmail) {
        //         const product = req.body;
        //         await partsCollection.insertOne(product);
        //         res.send(product);
        //     } else {
        //         res.send("Unauthorized access");
        //     }
        // });

        //API delete a product 
        app.delete("/parts/:id", checkJwt,verifyAdmin, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.headers.email;
            const id = req.params.id;
            console.log(id,'delete part from client');
            if (decodedEmail) {
               
              const result =  await partsCollection.deleteOne({ _id: ObjectId(id) });
                res.send(result);
            } else {
                res.send("Unauthorized access");
            }
        });

       // API to update a tool 
        app.patch("/parts/:id", checkJwt,verifyAdmin, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.headers.email;
            if ( decodedEmail) {
                const id = req.params.id
                const newTools = req.body
              //  console.log(newTools)
                const query = { _id: ObjectId(id) }
                const product =await partsCollection.findOne(query)
              //  console.log(product,'prd');
                const options = { upsert: true };
                const updateDoc = {
                    $set:newTools
                }
                const result = await partsCollection.updateOne(query, updateDoc, options)
                res.send(result);
            } else {
                res.send("Unauthorized access");
            }
        });

//         app.put('/parts/:id', checkJwt,verifyAdmin, async (req, res) => {
//             const id = req.params.id
//             const newTools = req.body
//    console.log(newTools)
//             const query = { _id: ObjectId(id) }
//             const options = { upsert: true };
//             const updateDoc = {
//                 $set: {
//                     newTools
//                 }
//             }
        
//             const result = await partsCollection.updateOne(query, updateDoc, options)
//             res.send(result);
//         })



   // get parts from db
   app.get('/parts', async (req, res) => {
    const query = {}
    const cursor = partsCollection.find(query)

    const allItems = await cursor.toArray()
    res.send(allItems)
})
     // get by id
     app.get('/parts/:id', async (req, res) => {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const item = await partsCollection.findOne(query)
        res.send(item)
    })


        
          //create user and jwt
          app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {

                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
          const getToken = jwt.sign({email:email},process.env.ACCESS_JWT_TOKEN,{expiresIn:'1d'})
            res.send({result,getToken})
          })
        //
         //make admin
         app.put('/user/admin/:email', checkJwt,verifyAdmin, async (req, res) => {
         
            const email = req.params.email;
          
                const filter = { email: email }
                const updateDoc = {
                    $set: {role:'admin'},
                };
                const result = await usersCollection.updateOne(filter, updateDoc,)
            
                res.send(result)
            
         })
        
        
        //get user information
        
        app.get('/user',checkJwt, async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })
      
    }
    finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('sp-menufecture is connected!')

})

//check 
app.listen(port, () => {
    console.log(`server is running ${port}`)
})