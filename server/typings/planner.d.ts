import type { Accomplishment } from '../src/models/accomplishmentModel';
import type { Course } from '../src/models/courseModel';
import type { PlannedCourse } from '../src/models/planModel';
import type { TermSeason } from './enum';
import type { AccomplishmentId, CourseId, PlanId, UserId } from './id';

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
    majors: string[]; // Accomplishment names, for convenience
    minors: string[];
    catalogYear: number;
    yearCount: number;
    courses: {
      [key: CourseId]: PlannedCourse;
    };
  };
  plans: {
    [key: PlanId]: {
      planId: PlanId;
      majors: {
        [key: AccomplishmentId]: string;
      };
      minors: {
        [key: AccomplishmentId]: string;
      };
      catalogYear: number;
    };
  };
  catalog?: {
    catalogYear: number;
    courses: {
      [key: CourseId]: Course;
    };
    accomplishments: {
      majors: {
        [key: AccomplishmentId]: Accomplishment;
      };
      minors: {
        [key: AccomplishmentId]: Accomplishment;
      };
    };
  };
  requirements?: {
    core: CourseId[];
    electives: CourseId[];
    cognates: CourseId[];
    geneds: CourseId[];
  };
};