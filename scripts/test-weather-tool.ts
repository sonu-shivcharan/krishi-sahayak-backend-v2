import { getWeather } from "../src/tools/getWeather";
import dotenv from "dotenv";

dotenv.config();

const runTest = async () => {
  console.log("Testing weather tool...");
  const location = "Pune";
  console.log(`Getting weather for ${location}...`);
  try {
    const result = await getWeather.invoke({ location });
    console.log("Result (Location):", result);

    console.log(`Getting weather for coordinates (18.52, 73.85)...`);
    const resultCoords = await getWeather.invoke({ lat: 18.52, lng: 73.85 });
    console.log("Result (Coordinates):", resultCoords);

  } catch (error) {
    console.error("Error:", error);
  }
};

runTest();
