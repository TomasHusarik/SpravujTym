import { addSquad, addSquadMembers, deleteSquadMember, getSquad, getSquadMembers, getSquads, updateSquadMemberRoles } from '@controllers/squad.controller';
import express from 'express';

const router = express.Router();

// GET /squad/get-squads - Get all squads
router.get('/get-squads', getSquads);

// GET /squad/get-squad/:_id - Get squad by id
router.get('/get-squad/:_id', getSquad);

// POST /user/login - User login
router.post('/add-squad', addSquad);

// GET /squad/get-squad-members/:_id - Get squad roster by squad id
router.get('/get-squad-members/:_id', getSquadMembers);

// POST /squad/add-squad-member - Add user to squad roster with role
router.post('/add-squad-members/:squadId', addSquadMembers);

// PUT /squad/update-squad-member-roles/:membershipId - Update roles of squad member
router.put('/update-squad-member-roles/:membershipId', updateSquadMemberRoles);

// DELETE /squad/delete-squad-member/:membershipId - Remove user from squad roster
router.delete('/delete-squad-member/:membershipId', deleteSquadMember);

export default router;