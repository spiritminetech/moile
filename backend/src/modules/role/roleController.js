import Role from "./RoleModel.js";

/*
 GET /api/roles
*/
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ id: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
 GET /api/roles/:id
*/
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findOne({ id: req.params.id });
    
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
 POST /api/roles
 body → { id, name, level, isSystemRole }
*/
export const createRole = async (req, res) => {
  try {
    const exists = await Role.findOne({ id: req.body.id });
    if (exists) {
      return res.status(400).json({ message: "Role id already exists" });
    }

    const nameExists = await Role.findOne({ name: req.body.name });
    if (nameExists) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    const role = await Role.create(req.body);
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/*
 PUT /api/roles/:id
*/
export const updateRole = async (req, res) => {
  try {
    // Check if trying to update name to an existing one
    if (req.body.name) {
      const nameExists = await Role.findOne({ 
        name: req.body.name,
        id: { $ne: req.params.id }
      });
      if (nameExists) {
        return res.status(400).json({ message: "Role name already exists" });
      }
    }

    const role = await Role.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/*
 DELETE /api/roles/:id
*/
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({ id: req.params.id });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    await Role.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
