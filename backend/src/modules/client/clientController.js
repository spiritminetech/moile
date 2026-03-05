import Client from "./ClientModel.js";

/*
 GET /api/clients
*/
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ id: 1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
 POST /api/clients
 body → { id, name, registrationNo, ... }
*/
export const createClient = async (req, res) => {
  try {
    const exists = await Client.findOne({ id: req.body.id });
    if (exists) {
      return res.status(400).json({ message: "Client id already exists" });
    }

    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/*
 PUT /api/clients/:id
*/
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/*
 DELETE /api/clients/:id
*/
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ id: req.params.id });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
