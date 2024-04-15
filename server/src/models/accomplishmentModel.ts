import mongoose, { Schema } from 'mongoose';
import type { AccomplishmentId, CourseId } from '../../typings/id';
import type { AccomplishmentType, RequirementType } from '../../typings/enum';
import { nanoid } from 'nanoid';

export type Accomplishment = {
  accomplishmentId: AccomplishmentId;
  name: string;
  yearsOffered: number[];
  type: AccomplishmentType;
  requirements: CourseId[];
};

export type RequiredCourse = {
  requiredCourseId: CourseId;
  requirementType: RequirementType;
};

const requiredCourseSchema = new Schema<RequiredCourse>({
  requiredCourseId: {
    type: String,
    required: true
  },
  requirementType: {
    type: String,
    required: true
  }
}, {
  _id: false
});

const accomplishmentSchema = new Schema<Accomplishment>({
  accomplishmentId: {
    type: String,
    required: true,
    index: true,
    default: () => nanoid(32)
  },
  name: {
    type: String,
    required: true
  },
  yearsOffered: {
    type: [Number],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  requirements: {
    type: [requiredCourseSchema],
    required: true
  }
}, {
  collection: 'accomplishments'
});

const plannerDb = mongoose.connection.useDb('planner');
const AccomplishmentModel = plannerDb.model('accomplishment', accomplishmentSchema);
export default AccomplishmentModel;