import mongoose from 'mongoose';

/**
 * Counter Schema for generating unique sequential IDs
 * Used for auto-incrementing IDs across different collections
 */
const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'counters'
});

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;