// MongoDB Script to Update Vehicle Data
// Run this in MongoDB shell or MongoDB Compass

// Update vehicle with id=1 (ABC123)
db.fleetVehicles.updateOne(
  { id: 1 },
  {
    $set: {
      // Essential fields for dashboard
      odometer: 45000,              // Current mileage in km
      fuelLevel: 75,                // Fuel percentage (0-100)
      year: 2020,                   // Manufacturing year
      
      // Insurance details
      insuranceExpiry: new Date("2026-12-31"),
      insurancePolicyNumber: "POL-2024-001",
      insuranceProvider: "ABC Insurance Company",
      
      // Road tax
      roadTaxExpiry: new Date("2026-06-30"),
      
      // Maintenance
      lastServiceDate: new Date("2026-01-15"),
      nextServiceDate: new Date("2026-07-15"),
      
      // Driver assignment
      assignedDriverId: 50,         // Your driver's employee ID
      assignedDriverName: "John Driver",
      
      // Status (use AVAILABLE instead of ACTIVE)
      status: "AVAILABLE",
      
      // Update timestamp
      updatedAt: new Date()
    }
  }
);

// Verify the update
print("Vehicle updated. Verifying...");
var vehicle = db.fleetVehicles.findOne({ id: 1 });
printjson(vehicle);

// Check if all required fields are present
print("\n=== Verification ===");
print("Odometer: " + vehicle.odometer);
print("Fuel Level: " + vehicle.fuelLevel + "%");
print("Year: " + vehicle.year);
print("Status: " + vehicle.status);
print("Insurance Expiry: " + vehicle.insuranceExpiry);
print("Assigned Driver: " + vehicle.assignedDriverName);
