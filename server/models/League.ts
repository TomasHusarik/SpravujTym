import mongoose, { Types } from "mongoose";

export interface ILeague { 
    _id?: Types.ObjectId;
    name?: string;
    season?: string;
    category?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum LeagueCategory {
    Juniors = 'juniors',
    Cadets = 'cadets',
    Men = 'men',
    OlderPupils = 'older_pupils',
    YoungerPupils = 'younger_pupils'
}

const LeagueSchema = new mongoose.Schema<ILeague>(
  {
    name: { type: String, required: true },
    season: { type: String, required: true },
    category: { type: String, enum: Object.values(LeagueCategory), required: true }
  }, {
    timestamps: true
});

const League = mongoose.model<ILeague>("League", LeagueSchema);
export default League;