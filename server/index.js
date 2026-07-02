import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/chat",(req,res)=>{
    res.json({
        reply:"Hello from the backend!",
    });
});
app.listen(5000,()=>{
    console.log("server is running on port 5000")
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});