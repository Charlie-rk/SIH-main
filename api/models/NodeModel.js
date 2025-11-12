import mongoose from "mongoose";

const NodeSchema = new mongoose.Schema(
  {
    nodeCategory: {
      type: Number,
      required: true,
      default: 2,
      // enum: [1, 2],
    },
    name: {
      type: String,
      required: true,
      unique: true, // Ensures the 'name' is unique across the collection
    }, // Name of the hub
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    }, 
    // transportationModes: {
    //   train: [
    //     {
    //       number: { type: String },
    //       departureTime: { type: Date },
    //       arrivalTime: { type: Date },
    //     },
    //   ],
    //   bus: [
    //     {
    //       number: { type: String },
    //       departureTime: { type: Date },
    //       arrivalTime: { type: Date },
    //     },
    //   ],
    //   ship: [
    //     {
    //       number: { type: String },
    //       departureTime: { type: Date },
    //       arrivalTime: { type: Date },
    //     },
    //   ],
    //   air: [
    //     {
    //       number: { type: String },
    //       departureTime: { type: Date },
    //       arrivalTime: { type: Date },
    //     },
    //   ],
    // },
    storageCapacity: {
      type: Number,
      required: true,
    }, // Max storage capacity
    currentLoad: {
      type: Number,
      default: 0,
    }, // Current used capacity
    postOffices: [{ type: String }], // Associated post offices
    weatherConditions: {
      type: String,
      enum: ["Good", "Moderate", "Severe"],
      default: "Good",
    },
    Alert: {
      type: String,
      default: "No Alert",
    },
    L1Connections: [{ type: String }], // Links to other Level 1 hubs
    L2Connections: [{ type: String }], // Linked Level 2 nodes
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification", // References Notification model
      },
    ],
  },
  { timestamps: true }
);

const Node = mongoose.model("Node", NodeSchema);
export default Node;
