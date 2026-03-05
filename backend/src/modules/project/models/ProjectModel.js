import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  companyId: {
    type: Number,
    index: true
  },
  projectCode: {
    type: String,
    unique: true,
  
  },
  projectName: {
    type: String,
    
  },
  quotationId: {
    type: Number,
    ref: 'Quotation',
    index: true
  },
  description: {
    type: String,
 
  },
  jobNature: {
    type: String,
   
  },
  jobSubtype: {
    type: String,
  
  },
  actualCompletion:{
    type: Date,
  },
  startDate: {
    type: Date,
    
  },
  endDate: {
    type: Date,
    index: true
  },
  budgetLabor: {
    type: Number,
    default: 0
  },
  budgetMaterials: {
    type: Number,
    default: 0
  },
  budgetTools: {
    type: Number,
    default: 0
  },
  projectStatus: {  // Add this field
    type: String,
  },

  budgetTransport: {
    type: Number,
    default: 0
  },
  budgetWarranty: {
    type: Number,
    default: 0
  },
  budgetCertification: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Not Started', 'ongoing', 'On Hold', 'Completed', 'Warranty', 'Cancelled'],
    default: 'Not Started',
   
  },
  permitRequired: {
    type: Boolean,
    default: false
  },
  permitStatus: {
    type: String,
    trim: true
  },
  siteGeo: {
    type: Object
  },
  sitePoint: {
    type: Object
  },
  address: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: Object,
    default: {}
  },
  meta: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: Number,
    index: true
  },
  projectType: {
    type: String
  },
  clientId: {
    type: Number
  },
  expectedEndDate: {
    type: Date
  },
  department: {
    type: String
  },
  remarks: {
    type: String
  },
  actualEndDate: {
    type: Date
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  geofenceRadius: {
    type: Number
  },
  projectManagerId: {
    type: Number
  },
  supervisorId: {
    type: Number
  },
  estimatedLaborCost: {
    type: Number
  },
  estimatedMaterialCost: {
    type: Number
  },
  estimatedToolsCost: {
    type: Number
  },
  estimatedTransportCost: {
    type: Number
  },
  
  transportRequired: {
    type: Boolean,
    default: false
  },
  transportDailyWorkers: {
    type: Number
  },
  transportPickupLocation: {
    type: String
  },
  transportDriverId: {
    type: Number,
   
  },
  radius:{
    type: String
  },
  transportPickupTime: {
    type: String
  },
  transportDropTime: {
    type: String
  }
}, {
  timestamps: true
});

projectSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const last = await this.constructor.findOne().sort({ id: -1 });
    this.id = last ? last.id + 1 : 1;
  }
  next();
});



export default mongoose.model('Project', projectSchema);
