const mongo = require('mongoose');

async function connectDB(){
  await mongo.connect(process.env.MONGO_URI)
  .then(()=>{
    console.log('Connected To DB')
  })
}

module.exports = connectDB;