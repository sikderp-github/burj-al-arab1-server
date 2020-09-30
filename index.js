const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
console.log(process.env.DB_USER)

const app = express()
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./burj-al-arab7-firebase-adminsdk-t2qrj-1cb41aa50b.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gjdo1.gcp.mongodb.net/burjAlArab1?retryWrites=true&w=majority`;

const password = 'SCQryWkFfxOXorA1'

const port = 4000;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
    const bookingCollection = client.db("burjAlArab1").collection("booking");
    console.log('database connected');

    //to add data to backend server from server
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookingCollection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    //to read data from backend server to show in client site individually
    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let tokenEmail = decodedToken.email; //if two token id is same, then go next
                    let queryEmail = req.query.email;
                    if (tokenEmail == req.query.email) {
                        bookingCollection.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents);
                            })
                    }
                    else {
                        res.status(401).send('unauthorized access');
                    }

                }).catch(function (error) {
                    // Handle error
                });
        }
        else {
            res.status(401).send('unauthorized access');
        }





    })

});

app.listen(port)