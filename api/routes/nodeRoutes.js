import express from "express";
import Node from "../models/NodeModel.js";

const router = express.Router();

/**
 * Route to create one or multiple nodes
 * @route POST /api/createNodes
 * @param {Object} req - The request object containing Node details
 * @param {Object} res - The response object
 */

router.post("/createNodes", async (req, res) => {
  try {
    const nodes = Array.isArray(req.body) ? req.body : [req.body]; // Check if body is an array, else make it an array with a single node

    const createdNodes = [];

    // Loop through each node in the array (even if it's just one node)
    for (const nodeData of nodes) {
      const {
        nodeCategory,
        name,
        location,
        transportationModes,
        storageCapacity,
        currentLoad,
        weatherConditions,
        L1Connections,
        L2Connections,
      } = nodeData;

      // Validate required fields for each node
      if (
        !nodeCategory ||
        !name ||
        !location?.latitude ||
        !location?.longitude ||
        !transportationModes ||
        !storageCapacity
      ) {
        return res.status(400).json({ message: "Missing required fields for one of the nodes." });
      }

      // Check if a node with the same name already exists
      const existingNode = await Node.findOne({ name });
      if (existingNode) {
        return res.status(400).json({ message: `Node name ${name} must be unique.` });
      }

      // Create a new Node using the provided schema
      const newNode = new Node({
        nodeCategory,
        name,
        location,
        transportationModes,
        storageCapacity,
        currentLoad: currentLoad || 0, // Default to 0 if not provided
        weatherConditions: weatherConditions || "Good", // Default to "Good" if not provided
        L1Connections: L1Connections || [], // Default to an empty array if not provided
        L2Connections: L2Connections || [], // Default to an empty array if not provided
      });

      // Save the Node to the database
      const savedNode = await newNode.save();
      createdNodes.push(savedNode);
    }

    // Return the created nodes as a response
    return res.status(201).json({
      message: "Nodes created successfully.",
      nodes: createdNodes,
    });
  } catch (error) {
    console.error("Error creating nodes:", error);
    return res.status(500).json({ message: "Server error." });
  }
});


export default router;
