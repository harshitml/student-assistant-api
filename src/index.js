import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { httpServer } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!!", err);
  });

// A way to connect database
// import express from "express"
// const app = express()

// ( async () => {
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error", (error) =>{
//         console.log("ERROR:", error);

//         throw error;
//        })

//        app.listen(process.env.PORT, ()=>{
//         console.log(`APP is listening on port $
//         {process.env.PORT}`);
//        })
//     }catch(error){
//         console.error("ERROR: ", error)
//         throw err
//     }
// })()
