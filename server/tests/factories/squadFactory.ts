import { Types } from 'mongoose';
import League, { LeagueCategory } from '@models/League';
import Squad from '@models/Squad';
import SquadMembership, { SquadRole } from '@models/SquadMembership';
import Team from '@models/Team';
import Venue from '@models/Venue';

let squadCounter = 0;

export const createTestSquad = async (name?: string) => {
  squadCounter += 1;

  const venue = await Venue.create({
    name: `Arena ${squadCounter}`,
    city: 'Prague',
    address: `Arena ${squadCounter}`,
    capacity: 500,
  });

  const team = await Team.create({
    name: 'Blue Horses',
    shortName: 'BH',
    city: 'Prague',
    venue: venue._id,
  });

  const league = await League.create({
    name: `League ${squadCounter}`,
    season: '2025',
    category: LeagueCategory.Men,
  });

  const squad = await Squad.create({
    name: name || `Squad ${squadCounter}`,
    league: league._id,
    team: team._id,
  });

  return { venue, team, league, squad };
};

export const addTestMembership = async (userId: Types.ObjectId, squadId: Types.ObjectId, roles: SquadRole[]) => {
  return SquadMembership.create({
    user: userId,
    squad: squadId,
    roles,
    active: true,
  });
};
