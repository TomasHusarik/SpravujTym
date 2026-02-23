import mongoose, { Types } from "mongoose";

export interface IVenue { 
    _id?: Types.ObjectId;
    name?: string;
    city?: string;
    address?: string;
    capacity?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const venueSchema = new mongoose.Schema<IVenue>({
    name: { type: String, required: true },
    city: { type: String, required: true  },
    address: { type: String, required: true  },
    capacity: { type: Number, required: true  }
}, {
    timestamps: true
});


export default mongoose.model<IVenue>('Venue', venueSchema);