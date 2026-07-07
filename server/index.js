import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const client = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Backend is running");
})

app.post("/api/chat",async(req,res)=>{
   try{
    const {message} = req.body;

    const response  = await client.responses.create({
        model:"gpt-4.1-mini",
        input:message,
    });

    res.json({
        reply: response.output_text,
    });
   } catch(error){
    console.error(error);
    res.status(500).json({
        error:"Something went wrong while generating AI response.",
    });
   }
});
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
