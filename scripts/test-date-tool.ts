import { getCurrentDate } from "../src/tools/getCurrentDate";
import dotenv from "dotenv";

dotenv.config();

const runTest = async () => {
  console.log("Testing date tool...");

  const contextDefault = {};
  console.log(`Getting date for default region...`);
  try {
    const result = await getCurrentDate.invoke({}, { configurable: { context: contextDefault } } as any);
    console.log("Result (Default):", result);
  } catch (error) {
    console.error("Error:", error);
  }

  const contextUS = { region: "America/New_York" };
  console.log(`Getting date for America/New_York...`);
  try {
    // Mocking context passing for direct tool invocation
    // In LangChain tools, context is usually available via callbacks or bind, 
    // but for simple testing we might need to adjust the tool to accept it or mock the call object.
    // However, the tool definition uses `(_, { context })`, so we need to pass it in the second argument options.
    const result = await getCurrentDate.invoke({}, { configurable: { context: contextUS } } as any);
    
    // Note: The previous invoke call might not pass context correctly depending on LangChain version/setup. 
    // If it fails, we might need a different approach. But let's try this standard way.
    // Actually, checking tool definition: async (_, { context }) => { ... }
    // The second arg to invoke is config. config.configurable is where we usually put things.
    // But `context` in schema is often injected by the agent executor. 
    
    // Let's try to mock the context/config structure more carefully if the above fails.
    // For direct tool call, the second arg is the config object.
    // If the tool expects `context` in the second argument's property `context`, we need to check how it was defined.
    // It was defined as `async (_, { context })`.
    // This implies the second argument IS the object containing context. 
    // Wait, standard tool signature is (input, config). config contains `callbacks`, `signal`, etc.
    // The `context` used in the tool comes from the agent's state passed down.
    
    // Let's try passing it in `configurable`.
    
    console.log("Result (US):", result);
  } catch (error) {
    console.error("Error:", error);
  }
};

runTest();
