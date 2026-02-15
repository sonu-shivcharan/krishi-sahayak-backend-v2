import mongoose from "mongoose";
import { User } from "../src/models/user.model";
import { ForwardedQuery } from "../src/models/forwardedQuery.model";
import { Notification } from "../src/models/notification.model";
import { Conversation } from "../src/models/conversation.model";
import { forwardQuery } from "../src/controllers/forwardedQueries.controller";
import { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/krishi-sahayak";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
};

const mockRequest = (body: any, user: any) => ({
    body,
    user,
} as unknown as Request);

// ... (existing mockResponse)
const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    console.log("Starting test...");
    await connectDB();

    try {
        // 1. Create Dummy Data
        console.log("Creating officer...");
        const officer = await User.create({
            clerkId: "test_officer_" + Date.now(),
            name: "Test Officer",
            email: "officer" + Date.now() + "@test.com",
            address: "Test Address",
            role: "officer",
            location: {
                type: "Point",
                coordinates: [73.8567, 18.5204] // Pune coordinates
            }
        });
        console.log("Officer created");

        console.log("Creating farmer...");
        const farmer = await User.create({
            clerkId: "test_farmer_" + Date.now(),
            name: "Test Farmer",
            email: "farmer" + Date.now() + "@test.com",
            address: "Test Farmer Address",
            role: "farmer",
            location: {
                type: "Point",
                coordinates: [73.8567, 18.5204] // Pune coordinates
            }
        });
        console.log("Farmer created");

        console.log("Creating conversation...");
        const conversation = await Conversation.create({
            user: farmer._id,
            title: "Test Conversation"
        });
        console.log("Conversation created");

        console.log("Created dummy data:", { officerId: officer._id, farmerId: farmer._id, conversationId: conversation._id });

        // 2. Test forwardQuery
        const req = mockRequest({
            conversationId: conversation._id,
            // Optional: location provided in body
            // location: { lat: 18.5204, lng: 73.8567 } 
        }, farmer);
        const res = mockResponse();

        console.log("Calling forwardQuery...");
        await forwardQuery(req, res, (err: any) => { if (err) console.error("Next called with error:", err); });
        console.log("Response:", res.data);

        // 3. Verify Database
        const fq = await ForwardedQuery.findOne({ conversation: conversation._id });
        console.log("Forwarded Query:", fq);

        const notifs = await Notification.find({ user: officer._id });
        console.log("Notifications:", notifs);

        // Cleanup
        console.log("Cleaning up...");
        await User.deleteMany({ _id: { $in: [officer._id, farmer._id] } });
        await Conversation.deleteOne({ _id: conversation._id });
        await ForwardedQuery.deleteMany({ conversation: conversation._id });
        await Notification.deleteMany({ user: officer._id });

    } catch (error) {
        console.error("Error in test execution:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
