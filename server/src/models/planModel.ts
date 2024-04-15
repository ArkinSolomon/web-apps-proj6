import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';
import type { AccomplishmentId, CourseId, PlanId, UserId } from '../../typings/id';
import type { TermSeason } from '../../typings/enum';

export type PlannedCourse = {
  plannedCourse: CourseId;
  plannedYear: number;
  plannedTerm: TermSeason;
};

export type Plan = {
  planId: PlanId;
  studentId: UserId;
  name: string;
  courses: PlannedCourse[];
  accomplishments: AccomplishmentId[];
  catalogYear: number;
  yearCount: number;
  advisorNotes?: string;
  studentNotes?: string;
};

const plannedCourseSchema = new Schema<PlannedCourse>({
  plannedCourse: {
    type: String,
    required: true
  },
  plannedYear: {
    type: Number,
    required: true
  },
  plannedTerm: {
    type: String,
    required: true
  }
}, {
  _id: false
});

const planSchema = new Schema<Plan>({
  planId: {
    type: String,
    required: true,
    default: () => nanoid(32),
    index: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'New Plan'
  },
  courses: {
    type: [plannedCourseSchema],
    required: true
  },
  accomplishments: {
    type: [String],
    required: true
  },
  catalogYear: {
    type: Number,
    required: true,
    default: 2024
  },
  yearCount: {
    type: Number,
    required: true,
    default: 4
  },
  advisorNotes: {
    type: String,
    required: false,
    default: ''
  },
  studentNotes: {
    type: String,
    required: false,
    default: ''
  }
}, {
  collection: 'plans'
});

const plannerDb = mongoose.connection.useDb('planner');
const PlanModel = plannerDb.model('version', planSchema);
export default PlanModel;