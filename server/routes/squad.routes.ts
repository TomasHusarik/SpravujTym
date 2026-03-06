import { addSquadMembers, createSquad, deleteSquad, deleteSquadMember, getSquad, getSquadMembers, getSquads, updateSquad, updateSquadMemberRoles } from '@controllers/squad.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireCoachOfSquad } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);

// GET /squad/get-squads - Get all squads
router.get('/get-squads', getSquads);

// GET /squad/get-squad/:_id - Get squad by id
router.get('/get-squad/:_id', getSquad);

// POST /user/login - User login
router.post('/create-squad', requireAdmin, createSquad);

// PUT /squad/update-squad/:_id - Update squad by id
router.put('/update-squad/:_id', requireAdmin, updateSquad);

// GET /squad/get-squad-members/:_id - Get squad roster by squad id
router.get('/get-squad-members/:_id', getSquadMembers);

// POST /squad/add-squad-member - Add user to squad roster with role
router.post('/add-squad-members/:squadId', requireCoachOfSquad, addSquadMembers);

// PUT /squad/update-squad-member-roles/:membershipId - Update roles of squad member
router.put('/update-squad-member-roles/:membershipId', requireCoachOfSquad, updateSquadMemberRoles);

// DELETE /squad/delete-squad-member/:membershipId - Remove user from squad roster
router.delete('/delete-squad-member/:membershipId', requireCoachOfSquad, deleteSquadMember);

// DELETE /squad/delete-squad/:_id - Delete squad by id
router.delete('/delete-squad/:_id', requireAdmin, deleteSquad);

export default router;