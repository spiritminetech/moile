import ApprovedLocation from './ApprovedLocation.js';

// Get all approved locations for a company
export const getApprovedLocations = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const { active, type } = req.query;

    const filter = { companyId };
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    if (type) {
      filter.type = type;
    }

    const locations = await ApprovedLocation.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      message: `Found ${locations.length} approved locations`,
      data: locations
    });

  } catch (err) {
    console.error('❌ Error fetching approved locations:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approved locations',
      error: err.message
    });
  }
};

// Create new approved location
export const createApprovedLocation = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const userId = Number(req.user.id || req.user.userId);
    const { name, type, address, center, radius, allowedForClockIn, allowedForRouteStart, notes } = req.body;

    // Validate required fields
    if (!name || !type || !center || !center.latitude || !center.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and center coordinates are required'
      });
    }

    // Validate coordinates
    if (center.latitude < -90 || center.latitude > 90 || 
        center.longitude < -180 || center.longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Get next ID
    const lastLocation = await ApprovedLocation.findOne().sort({ id: -1 }).limit(1);
    const nextId = lastLocation ? lastLocation.id + 1 : 1;

    const location = new ApprovedLocation({
      id: nextId,
      companyId,
      name,
      type,
      address: address || '',
      center: {
        latitude: center.latitude,
        longitude: center.longitude
      },
      radius: radius || 100,
      active: true,
      allowedForClockIn: allowedForClockIn !== false,
      allowedForRouteStart: allowedForRouteStart !== false,
      notes: notes || '',
      createdBy: userId
    });

    await location.save();

    console.log(`✅ Created approved location: ${location.name} (ID: ${location.id})`);

    res.status(201).json({
      success: true,
      message: 'Approved location created successfully',
      data: location
    });

  } catch (err) {
    console.error('❌ Error creating approved location:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating approved location',
      error: err.message
    });
  }
};

// Update approved location
export const updateApprovedLocation = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const locationId = Number(req.params.id);
    const updates = req.body;

    const location = await ApprovedLocation.findOne({
      id: locationId,
      companyId
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Approved location not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['name', 'type', 'address', 'center', 'radius', 'active', 
                          'allowedForClockIn', 'allowedForRouteStart', 'notes'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        location[field] = updates[field];
      }
    });

    location.updatedAt = new Date();
    await location.save();

    console.log(`✅ Updated approved location: ${location.name} (ID: ${location.id})`);

    res.json({
      success: true,
      message: 'Approved location updated successfully',
      data: location
    });

  } catch (err) {
    console.error('❌ Error updating approved location:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while updating approved location',
      error: err.message
    });
  }
};

// Delete approved location
export const deleteApprovedLocation = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const locationId = Number(req.params.id);

    const result = await ApprovedLocation.deleteOne({
      id: locationId,
      companyId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Approved location not found'
      });
    }

    console.log(`✅ Deleted approved location ID: ${locationId}`);

    res.json({
      success: true,
      message: 'Approved location deleted successfully'
    });

  } catch (err) {
    console.error('❌ Error deleting approved location:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting approved location',
      error: err.message
    });
  }
};
