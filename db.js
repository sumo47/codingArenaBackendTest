const mongoose = require('mongoose');
const mongoURl = "mongodb://localhost:27017/"
// this Function will connect to the Mongodb
const ConnectToMongo = async()=>{
	  await mongoose.connect("mongodb+srv://sumit:sumit@cluster0.8dflsuw.mongodb.net/coding_arena")
	  .then(() => { console.log("MongoDb connected sucessfylly") })
	  .catch((err) => { console.log(err) })
}

module.exports = ConnectToMongo; 

