import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';
import type { PlanId, UserId } from '../../typings/id.js';
import { TermSeason, UserRole } from '../../typings/enum.js';

export type PlannerUser = {
  userId: UserId;
  name: string;
  email: string;
  passwordHash: string;
  activePlanId?: PlanId;
  currentYear: number;
  currentTerm: TermSeason;
  role: UserRole;
  advisor?: UserId;
  advisees: UserId[];
};

const plannerUserSchema = new Schema<PlannerUser>({
  userId: {
    type: String,
    required: true,
    default: () => nanoid(32),
    index: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  activePlanId: {
    type: String,
    required: false
  },
  currentYear: {
    type: Number,
    required: true,
    default: 2024
  },
  currentTerm: {
    type: String,
    required: true,
    default: TermSeason.Spring
  },
  role: {
    type: String,
    required: true,
    default: UserRole.Student
  },
  advisor: {
    type: String,
    required: false
  },
  advisees: {
    type: [String],
    required: true
  }
}, {
  collection: 'users'
});

const plannerDb = mongoose.connection.useDb('planner');
const PlannerUserModel = plannerDb.model('version', plannerUserSchema);
export default PlannerUserModel;