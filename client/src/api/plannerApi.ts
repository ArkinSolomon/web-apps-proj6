import { DataResponse } from '../../../server/typings/planner';
import userApi from './userApi';
import { BASE_URL, USER_TOKEN_NAME } from './base';
import axios from 'axios';
import Cookies from 'js-cookie';
import { AccomplishmentId, CourseId, PlanId } from '../../../server/typings/id';
import { TermSeason } from '../../../server/typings/enum';

/**
 * Get the data for the currently logged in user, or for the user from the studentId query parameter.
 * 
 * @returns The response from the server for all of the planner's data.
 * @throws {AxiosError} If an error is recieved from the server, or if the user is not logged in.
 */
async function data(): Promise<DataResponse> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  const response = await axios.get<DataResponse>(buildReqUrlWithStudent('/planner/data'), {
    headers: {
      'Authorization': Cookies.get(USER_TOKEN_NAME)
    }
  });

  return response.data;
}

/**
 * Create a new plan and sets it to active.
 * 
 * @throws {AxiosError} If an error is recieved from the server, or if the user is not logged in.
 */
async function createPlan(): Promise<void> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  await axios.post(buildReqUrlWithStudent('/planner/plan'), {}, {
    headers: {
      'Authorization': Cookies.get(USER_TOKEN_NAME)
    }
  });
}

/**
 * Deletes a plan by its id.
 * 
 * @param planId The id of the plan to delete.
 * @throws {AxiosError} If an error is recieved from the server, the plan doesn't exist, or if the user is not logged in.
 */
async function deletePlan(planId: PlanId): Promise<void> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  await axios({
    url: buildReqUrlWithStudent('/planner/plan'),
    method: 'DELETE',
    headers: {
      'Authorization': Cookies.get(USER_TOKEN_NAME)
    },
    data: {
      planId
    }
  });
}

/**
 * Load an existing plan by its id.
 * 
 * @param planId The id of the plan to load.
 * @throws {AxiosError} If an error is recieved from the server, the plan doesn't exist, or if the user is not logged in.
 */
async function loadPlan(planId: PlanId): Promise<void> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  await axios.post(buildReqUrlWithStudent('/planner/loadPlan'), {
    planId
  }, {
    headers: {
      'Authorization': Cookies.get(USER_TOKEN_NAME)
    }
  });
}

/**
 * Add a course to the specified plan.
 * 
 * @param planId The id of the plan to add the course to.
 * @param courseId The id of the course to add.
 * @param season The season of the course to add.
 * @param year The year to add the course to.
 * @returns True if the course was added successfully, or false otherwise.
 * @throws If the user is not logged in. Note that an internal server error will not throw.
 */
async function planCourse(planId: PlanId, courseId: CourseId, season: TermSeason, year: number): Promise<boolean> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  try {
    await axios.post(buildReqUrlWithStudent('/planner/plannedCourse'), {
      planId,
      courseId,
      termSeason: season,
      termYear: year
    }, {
      headers: {
        'Authorization': Cookies.get(USER_TOKEN_NAME)
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a course from a plan.
 * 
 * @param planId The id of the plan to remove the course from.
 * @param courseId The course to remove from the plan.
 * @returns True if the course is no longer in the plan. Note that this means that if the course was never in the plan to begin with, it will still return true.
 * @throws If the user is not logged in. Note that an internal server error will not throw.
 */
async function deletePlannedCourse(planId: PlanId, courseId: CourseId): Promise<boolean> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  try {
    await axios({
      url: buildReqUrlWithStudent('/planner/plannedCourse'),
      method: 'DELETE',
      headers: {
        'Authorization': Cookies.get(USER_TOKEN_NAME)
      },
      data: {
        planId,
        courseId
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Update the notes for a student. Both students and faculty can use this route.
 * 
 * @param planId The id of the plan to update.
 * @param notes The student's updated notes.
 * @returns True if the operation completes successfully, or false otherwise.
 * @throws If the user is not logged in. Note that an internal server error will not throw.
 */
async function updateStudentNotes(planId: PlanId, notes: string): Promise<boolean> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  try {
    await axios.patch(buildReqUrlWithStudent('/planner/studentNotes'), { planId, notes }, {
      headers: {
        'Authorization': Cookies.get(USER_TOKEN_NAME)
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Update the notes for a student. Only faculty can use this route.
 * 
 * @param planId The id of the plan to update.
 * @param notes The advisor's updated notes.
 * @returns True if the operation completes successfully, or false otherwise.
 * @throws If the user is not logged in. Note that an internal server error will not throw, nor will if the user is unauthorized.
 */
async function updateAdvisorNotes(planId: PlanId, notes: string): Promise<boolean> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  try {
    await axios.patch(buildReqUrlWithStudent('/planner/advisorNotes'), { planId, notes }, {
      headers: {
        'Authorization': Cookies.get(USER_TOKEN_NAME)
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Change the number of years in the student's plan. Any courses that are not within the given academic years will be cutoff.
 * 
 * @param planId The id of the plan to update.
 * @param yearCount The number of years in the specified plan.
 * @returns True if the operation completes successfully, or false otherwise.
 * @throws If the user is not logged in. Note that an internal server error will not throw.
 */
async function updateYearCount(planId: PlanId, yearCount: number): Promise<boolean> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  try {
    await axios.patch(buildReqUrlWithStudent('/planner/yearCount'), { planId, years: yearCount }, {
      headers: {
        'Authorization': Cookies.get(USER_TOKEN_NAME)
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Update a plan's information. Note that this will completely overwrite the data in the database, so fields that are not modified should pass in their old values.
 * 
 * @param planId The id of the plan to update.
 * @param planName The new name of the plan.
 * @param majors The plan's new majors.
 * @param minors The plan's new minors.
 * @returns True if the operation completes successfully, or false otherwise.
 * @throws If the user is not logged in. Note that an internal server error will not throw, nor will if the user is unauthorized.
 */
async function updatePlanData(planId: PlanId, planName: string, majors: AccomplishmentId[], minors: AccomplishmentId[]): Promise<boolean> {
  if (!await userApi.isLoggedIn(false)) 
    throw new Error('User not logged in');

  try {
    await axios.patch(buildReqUrlWithStudent('/planner/planData'), {
      planId,
      planName,
      majors: majors.join(),
      minors: minors.join()
    }, {
      headers: {
        'Authorization': Cookies.get(USER_TOKEN_NAME)
      }
    });
    return true;
  } catch {
    return false;
  }
}

function buildReqUrlWithStudent(partialPath: string, required = false) {
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.has('studentId'))
    return BASE_URL + partialPath + '/?' + new URLSearchParams({
      studentId: queryParams.get('studentId')!
    }).toString();
  
  if (required) 
    throw new Error('A student id was required for this route, but it was not provided');
  
  return BASE_URL + partialPath;
}

const plannerApi = {
  data,
  createPlan,
  deletePlan,
  loadPlan,
  planCourse,
  deletePlannedCourse,
  updateStudentNotes,
  updateAdvisorNotes,
  updatePlanData,
  updateYearCount
};
export default plannerApi;