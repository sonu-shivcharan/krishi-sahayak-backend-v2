import "dotenv/config";
import { app } from "./app";
import connectDB from "./db/connectDB";
import { initQdrant } from "./utils/qdrantStore";

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "Welcome to KrishiSahayak" });
});

connectDB().then(async ()=>{
  await initQdrant();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch((error) => {
    console.error("Mongo db connection failed", error);
    process.exit(1);
});


