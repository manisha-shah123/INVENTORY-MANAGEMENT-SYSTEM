const Client = require("../models/Client");

const VALID_TYPES = ["customer", "supplier"];

const getClients = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be 'customer' or 'supplier'.",
        });
      }
      filter.type = type;
    }

    const clients = await Client.find(filter).sort({ name: 1 });

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch clients" });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch client" });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, type, address, email, phone, vatNumber } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'customer' or 'supplier'",
      });
    }

    const client = await Client.create({
      name: name.trim(),
      type,
      address,
      email,
      phone,
      vatNumber,
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: client,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message =
        Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A client with this value already exists",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create client" });
  }
};

const updateClient = async (req, res) => {
  try {
    const { name, type, address, email, phone, vatNumber } = req.body;

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'customer' or 'supplier'",
      });
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, type, address, email, phone, vatNumber },
      { new: true, runValidators: true },
    );

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: client,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message =
        Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A client with this value already exists",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update client" });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete client" });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
