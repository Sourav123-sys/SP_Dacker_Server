
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
        console.log({token});
        jwt.verify(token,process.env.ACCESS_JWT_TOKEN, (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(403).send({ message: 'forbidden access' })
            }
            console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
    console.log(hederAuth, 'inside chckjwt');
   
}


//connect to db

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eowzq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const uri = "mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eowzq.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log(process.env.ACCESS_JWT_TOKEN);
function checkJwt(req, res, next) {
    const hederAuth = req.headers.authorization
    if (!hederAuth) {
        return res.status(401).send({ message: 'unauthorized access.try again' })
    }
    else {
        const token = hederAuth.split(' ')[1]
        console.log({token});
        jwt.verify(token,process.env.ACCESS_JWT_TOKEN, (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(403).send({ message: 'forbidden access' })
            }
            console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
    console.log(hederAuth, 'inside chckjwt');
   
}
async function run() {
    try {

        await client.connect();
        const itemsCollection = client.db('SP-Menufecture').collection('parts')
        console.log("sp db connected")

        




        //token

        app.post('/signin', async (req, res) => {
          const user = req.body;
          console.log(req.body,'user')
          
          const getToken = jwt.sign(user, process.env.ACCESS_JWT_TOKEN, {
              expiresIn: '1d'
          });
         
          res.send({ getToken });

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