import { tool } from "langchain";
import z from "zod";

export const getCurrentDate = tool(
  async (_, { context }) => {
    try {
      const region = context.region || "Asia/Kolkata";
      const date = new Date().toLocaleString("en-US", {
        timeZone: region,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });
      return `Current Date and Time in ${region}: ${date}`;
    } catch (error) {
      console.error("Error getting date:", error);
      return "Sorry, I could not determine the current date and time.";
    }
  },
  {
    name: "getCurrentDate",
    description:
      "Get the current date and time for the user's region. Use this when the user asks 'what is the date today?', 'what time is it?', or needs temporal context.",
    schema: z.object({}),
  },
);
