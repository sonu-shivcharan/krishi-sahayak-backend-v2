import { tool } from "langchain";
import z from "zod";
import { getUserById } from "../helpers/user.helpers";

export const getUserProfileFromDB = tool(
  async (_, { context }) => {
    const userId = context.userId;
    const user = await getUserById({ userId });
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      address: user.address,
      location: {
        type: user.location.type,
        longitude: user.location.coordinates[0],
        latitude: user.location.coordinates[1],
      },
    };
  },
  {
    name: "getUserProfileFromDB",
    description:
      "Fetches the authenticated user's profile details from the database for personalization. Use this tool when you need the user's name, contact info, or location-based context to provide a personalized response",
    schema: z.object({}),
  },
);
