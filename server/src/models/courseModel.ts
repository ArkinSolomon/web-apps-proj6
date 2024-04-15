import mongoose, { Schema } from 'mongoose';
import type { CourseId } from '../../typings/id';

export type Course = {
  courseId: CourseId;
  name: string;
  description: string;
  yearsOffered: number[];
  credits: number;
  isGenEd: boolean;
};

const courseSchema = new Schema<Course>({
  courseId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  yearsOffered: {
    type: [Number],
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  isGenEd: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  collection: 'courses'
});

const plannerDb = mongoose.connection.useDb('planner');
const CourseModel = plannerDb.model('course', courseSchema);
export default CourseModel;