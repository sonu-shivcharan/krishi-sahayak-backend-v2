import { isValidObjectId } from "mongoose";
import { User } from "../models";
import logger from "../utils/logger";

async function getUserById({ userId }: { userId: string }) {
  try {
    if (!isValidObjectId(userId)) {
      throw new Error("Invalid user Id");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    logger.error("getUserbyId : ", error);
    throw error;
  }
}

export { getUserById };
