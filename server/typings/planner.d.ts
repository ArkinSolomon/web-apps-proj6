import type { Accomplishment } from '../src/models/accomplishmentModel';
import type { Course } from '../src/models/courseModel';
import type { PlannedCourse } from '../src/models/planModel';
import type { TermSeason } from './enum';
import type { AccomplishmentId, CourseId, PlanId, UserId } from './id';

export type SentAccomplishmentData = Omit<Accomplishment, 'yearsOffered' | 'type' | 'requirements'>;
export type DataResponse = {
  loggedInId: UserId;
  loggedInName: string;
  studentId: UserId;
  studentName: string;
  currentYear: number;
  currentTerm: TermSeason;
  availableCatalogs: number[];
  plan?: {
    planId: PlanId;
    planName: string;
    majors: string[]; // Accomplishment names, for convenience
    minors: string[];
    catalogYear: number;
    yearCount: number;
    studentNotes: string;
    advisorNotes?: string;
    courses: Record<CourseId, PlannedCourse>;
  };
  plans: Record<PlanId, {
    planId: PlanId;
    planName: string;
    majors: Record<AccomplishmentId, string>;
    minors: Record<AccomplishmentId, string>;
    catalogYear: number;
  }>;
  catalog?: {
    catalogYear: number;
    courses: Record<CourseId, Omit<Course, 'isGenEd' | 'yearsOffered'>>;
    accomplishments: {
      majors: Record<AccomplishmentId, SentAccomplishmentData>;
      minors: Record<AccomplishmentId, SentAccomplishmentData>;
    };
  };
  requirements?: {
    core: CourseId[];
    electives: CourseId[];
    cognates: CourseId[];
    genEds: CourseId[];
  };
};