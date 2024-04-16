import { Router } from 'express';
import { body, header, matchedData, query, validationResult } from 'express-validator';
import * as jwt from '../jwtAsync.js';
import type { HydratedDocument } from 'mongoose';
import type { PlannerUser } from '../models/userModel.js';
import PlannerUserModel from '../models/userModel.js';
import type { DataResponse, SentAccomplishmentData } from '../../typings/planner.js';
import PlanModel from '../models/planModel.js';
import AccomplishmentModel, { type RequiredCourse } from '../models/accomplishmentModel.js';
import { AccomplishmentType, RequirementType, TermSeason, UserRole } from '../../typings/enum.js';
import type { AccomplishmentId, CourseId, PlanId, UserId } from '../../typings/id.js';
import jwtPkg from 'jsonwebtoken';
import CourseModel from '../models/courseModel.js';

const route = Router();

route.get('/data', header('authorization').isJWT(), query('studentId').optional().isLength({
  min: 32,
  max: 32
}), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty())
    return res.sendStatus(400);

  const { authorization, studentId } = matchedData(req) as {
    authorization: string;
    studentId?: UserId;
  };

  try {
    const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

    if (!userId) 
      return res.sendStatus(401);

    const loginData = await getUsers(userId, studentId);
    if (!loginData)
      return res.sendStatus(401);
    const [user, loggedInUser] = loginData;

    const availableYears = await CourseModel.aggregate([
      {
        $project:{
          yearsOffered: 1,
          _id: 0
        }
      },
      {
        $unwind:{
          path: '$yearsOffered',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: null,
          uniqueValues: {
            $addToSet: '$yearsOffered'
          }
        }
      }
    ])
      .exec() as [{
      yearsOffered: number[];
    }];
    const data: DataResponse = {
      loggedInId: loggedInUser.userId,
      loggedInName: loggedInUser.name,
      studentId: user.userId,
      studentName: user.name,
      currentTerm: user.currentTerm,
      currentYear: user.currentYear,
      availableCatalogs: availableYears.length ? availableYears[0].yearsOffered : [],
      plans: {}
    };

    const allPlans = await PlanModel.find({
      studentId: user.userId
    })
      .select('-_id -__v')
      .exec();
  
    for (const plan of allPlans) {
      const planAccomplishments = await AccomplishmentModel.find({
        accomplishmentId: {
          $in: plan.accomplishments
        }
      })
        .select('-_id -__v -requirements')
        .lean()
        .exec();
    
      data.plans[plan.planId] = {
        planId: plan.planId,
        planName: plan.name,
        majors: planAccomplishments.filter(a => a.type === AccomplishmentType.Major)
          .reduce((majors, accomplishment) => {
            majors[accomplishment.accomplishmentId] = accomplishment.name;
            return majors;
          }, {} as DataResponse['plans'][PlanId]['majors']),
        minors: planAccomplishments.filter(a => a.type === AccomplishmentType.Minor)
          .reduce((minors, accomplishment) =>{
            minors[accomplishment.accomplishmentId] = accomplishment.name;
            return minors;
          }, {} as DataResponse['plans'][PlanId]['minors']),
        catalogYear: plan.catalogYear
      };
    }

    hasPlan: if (user.activePlanId) {
      const plan = allPlans.find(p => p.planId === user.activePlanId);
      if (!plan) {
        delete user.activePlanId;
        await user.save();
        break hasPlan;
      }

      const planAccomplishments = await AccomplishmentModel.find({
        accomplishmentId: {
          $in: plan.accomplishments
        }
      })
        .select('-_id -__v')
        .lean()
        .exec();

      data.plan = {
        planId: plan.planId,
        planName: plan.name,
        studentNotes: plan.studentNotes ?? '',
        advisorNotes: loggedInUser.role === UserRole.Faculty ? (plan.advisorNotes ?? '') : void 0,
        majors: planAccomplishments.filter(a => a.type === AccomplishmentType.Major)
          .map(a => a.name),
        minors: planAccomplishments.filter(a => a.type === AccomplishmentType.Minor)
          .map(a => a.name),
        courses: plan.courses.reduce((pcs, pc) => {
          pcs[pc.plannedCourse] = pc;
          return pcs;
        }, {} as Required<DataResponse>['plan']['courses']),
        catalogYear: plan.catalogYear,
        yearCount: plan.yearCount
      };

      const genEds = (await CourseModel
        .find({
          isGenEd: true
        })
        .select('+courseId')
        .lean()
        .exec()).map(c => c.courseId);

      const reqResult = await AccomplishmentModel.aggregate([
        {
          $match: {
            accomplishmentId: {
              $in: plan.accomplishments
            },
            requirements: {
              $ne: []
            }
          }
        },
        {
          $project: {
            requirements: 1
          }
        },
        {
          $unwind: {
            path: '$requirements',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $group: {
            _id: null,
            requirements: {
              $addToSet: {
                requiredCourseId:
                '$requirements.requiredCourseId',
                requirementType:
                '$requirements.requirementType'
              }
            }
          }
        }
      ])
        .exec() as [{
        requirements: RequiredCourse[];
        }];
    
      if (!reqResult.length)
        data.requirements = {
          core: [],
          electives: [],
          cognates: [],
          genEds
        };
      else {
        const [requirements] = reqResult.map(res => res.requirements);
        const reqMapper = (r: RequiredCourse) => r.requiredCourseId;

        const uniqueFilter = () => {
          const seen = new Set<CourseId>();
          return (req: CourseId) => {
            if (seen.has(req)) 
              return false;
            seen.add(req);
            return true;
          };
        };  

        const coreReqs = requirements
          .filter(r => r.requirementType === RequirementType.Core)
          .map(reqMapper)
          .filter(uniqueFilter());
        const electiveReqs = requirements
          .filter(r => r.requirementType === RequirementType.Elective)
          .map(reqMapper)
          .filter(uniqueFilter());
        const cognateReqs = requirements
          .filter(r => r.requirementType === RequirementType.Cognate)
          .map(reqMapper)
          .filter(uniqueFilter());
        
        data.requirements = {
          core: coreReqs,
          electives: electiveReqs,
          cognates: cognateReqs,
          genEds
        };
      }

      const offeredCourses = await CourseModel.find({
        yearsOffered: plan.catalogYear
      })
        .lean()
        .select('-_id -__v -yearsOffered -isGenEd')
        .exec();

      const accomplishments = await AccomplishmentModel.find({
        yearsOffered: plan.catalogYear
      })
        .lean()
        .select('-_id -__v -yearsOffered')
        .exec();
    
      type SentAccomplishmentDataDict = { [key: AccomplishmentId]: SentAccomplishmentData; };
      const accReducer = (accomplishments: SentAccomplishmentDataDict,
        a: SentAccomplishmentData & { type?: AccomplishmentType; }) => {
        delete a.type;
        accomplishments[a.accomplishmentId] = a;
        return accomplishments;
      };

      data.catalog = {
        catalogYear: plan.catalogYear,
        courses: offeredCourses.reduce((courses, course) => {
          courses[course.courseId] = course;
          return courses;
        }, {} as Required<DataResponse>['catalog']['courses']),
        accomplishments: {
          majors: accomplishments
            .filter(a => a.type === AccomplishmentType.Major)
            .reduce(accReducer, {} as SentAccomplishmentDataDict),
          minors: accomplishments
            .filter(a => a.type === AccomplishmentType.Minor)
            .reduce(accReducer, {} as SentAccomplishmentDataDict)
        }
      };
    }

    res
      .status(200)
      .json(data);
  } catch (e) {
    if (e instanceof jwtPkg.JsonWebTokenError)
      return res.sendStatus(401);
    console.error(e);
    return res.sendStatus(500);
  }
});

route.post('/plan', header('authorization').isJWT(), query('studentId').optional().isLength({
  min: 32,
  max: 32
}), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty())
    return res.sendStatus(400);

  const { authorization, studentId } = matchedData(req) as {
    authorization: string;
    studentId?: UserId;
  };

  try {
    const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

    if (!userId)
      return res.sendStatus(401);

    const loginData = await getUsers(userId, studentId);
    if (!loginData)
      return res.sendStatus(401);
    const [user] = loginData;

    const bibleMinor = await AccomplishmentModel.findOne({
      name: 'Bible',
      type: AccomplishmentType.Minor,
      yearsOffered: 2024
    })
      .exec();

    const newPlan = new PlanModel({
      studentId: user.userId,
      accomplishments: bibleMinor ? [bibleMinor.accomplishmentId] : []
    });
    await newPlan.save();
    user.activePlanId = newPlan.planId;
    await user.save();
  
    res.sendStatus(204);
  } catch (e) {
    if (e instanceof jwtPkg.JsonWebTokenError)
      return res.sendStatus(401);
    console.error(e);
    return res.sendStatus(500);
  }
});

route.delete('/plan',
  header('authorization').isJWT(),
  query('studentId')
    .optional()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId').isLength({
    min: 32,
    max: 32
  }),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res.sendStatus(400);

    const { authorization, studentId, planId } = matchedData(req) as {
    authorization: string;
    studentId?: UserId;
    planId: string;
  };

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user] = loginData;

      const planToDelete = PlanModel.findOne({
        studentId: user.userId,
        planId
      });

      if (!planToDelete) 
        return res.sendStatus(404);

      await planToDelete.deleteOne();

      if (user.activePlanId === planId) {
        user.activePlanId = void 0;
        await user.save();
      }
  
      res.sendStatus(204);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

route.post('/loadPlan',
  header('authorization').isJWT(),
  query('studentId')
    .optional()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId').isLength({
    min: 32,
    max: 32
  }),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res.sendStatus(400);

    const { authorization, studentId, planId } = matchedData(req) as {
      authorization: string;
      studentId?: UserId;
      planId: PlanId;
    };

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
        userId?: UserId;
      };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user] = loginData;

      const planExists = await PlanModel.exists({
        studentId: user.userId,
        planId
      })
        .exec();

      if (!planExists) 
        return res.sendStatus(404);

      user.activePlanId = planId;
      await user.save();
  
      res.sendStatus(204);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

route.post('/plannedCourse',
  header('authorization').isJWT(),
  query('studentId')
    .optional()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId').isLength({
    min: 32,
    max: 32
  }),
  body('courseId')
    .isString()
    .notEmpty(),
  body('termSeason')
    .isString()
    .custom((s) => Object.values(TermSeason).includes(s))
    .withMessage('Invalid term season'),
  body('termYear')
    .isNumeric()
    .custom(y => y > 2000 && y < 2100)
    .withMessage('Invalid year'),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res
        .status(400)
        .send(result.array());

    const { authorization, studentId, planId, courseId, termSeason, termYear } = matchedData(req) as {
      authorization: string;
      studentId?: UserId;
      planId: PlanId;
      courseId: CourseId;
      termSeason: TermSeason;
      termYear: number;
    };

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
        userId?: UserId;
      };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user] = loginData;

      const plan = await PlanModel.findOne({
        studentId: user.userId,
        planId
      })
        .exec();
      if (!plan)
        return res.sendStatus(404);

      if (
        plan.catalogYear > termYear ||
        (plan.catalogYear === termYear && termSeason !== TermSeason.Fall) ||
        (plan.catalogYear + plan.yearCount === termYear && termSeason === TermSeason.Fall) ||
        plan.catalogYear + plan.yearCount < termYear
      ) 
        return res.sendStatus(400);

      plan.courses.splice(plan.courses.findIndex(pc => pc.plannedCourse === courseId), 1);
      plan.courses.push({
        plannedCourse: courseId,
        plannedTerm: termSeason,
        plannedYear: termYear
      });
      plan.markModified('courses');
      await plan.save();
  
      res.sendStatus(204);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

route.delete('/plannedCourse',
  header('authorization').isJWT(),
  query('studentId')
    .optional()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId').isLength({
    min: 32,
    max: 32
  }),
  body('courseId')
    .isString()
    .notEmpty(),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res
        .status(400)
        .send(result.array());

    const { authorization, studentId, planId, courseId } = matchedData(req) as {
      authorization: string;
      studentId?: UserId;
      planId: PlanId;
      courseId: CourseId;
    };

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
        userId?: UserId;
      };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user] = loginData;

      const updateResult = await PlanModel.updateOne({
        studentId: user.userId,
        planId
      }, {
        $pull: {
          courses: {
            plannedCourse: courseId
          }
        }
      })
        .exec();

      return res.sendStatus(updateResult.matchedCount ? 204 : 404);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

route.patch('/studentNotes',
  header('authorization').isJWT(),
  query('studentId')
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId').isLength({
    min: 32,
    max: 32
  }),
  body('notes')
    .isString(),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res
        .status(400)
        .send(result.array());

    const { authorization, studentId, planId, notes } = matchedData(req) as {
      authorization: string;
      studentId?: UserId;
      planId: PlanId;
      notes: string;
    };

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
        userId?: UserId;
      };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user] = loginData;

      const updateResult = await PlanModel.updateOne({
        studentId: user.userId,
        planId
      }, {
        studentNotes: notes
      })
        .exec();

      return res.sendStatus(updateResult.matchedCount ? 204 : 404);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

route.patch('/advisorNotes',
  header('authorization').isJWT(),
  query('studentId')
    .optional()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId').isLength({
    min: 32,
    max: 32
  }),
  body('notes')
    .isString(),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res
        .status(400)
        .send(result.array());

    const { authorization, studentId, planId, notes } = matchedData(req) as {
      authorization: string;
      studentId?: UserId;
      planId: PlanId;
      notes: string;
    };

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
        userId?: UserId;
      };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user, loggedInUser] = loginData;

      if (loggedInUser.role !== UserRole.Faculty) 
        return res.sendStatus(401);

      const updateResult = await PlanModel.updateOne({
        studentId: user.userId,
        planId
      }, {
        advisorNotes: notes
      })
        .exec();

      return res.sendStatus(updateResult.matchedCount ? 204 : 404);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

route.patch('/planData',
  header('authorization').isJWT(),
  query('studentId')
    .optional()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planId')
    .isString()
    .isLength({
      min: 32,
      max: 32
    }),
  body('planName')
    .isLength({
      min: 3,
      max: 32
    })
    .escape(),
  body('majors')
    .isString()
    .bail()
    .customSanitizer(mStr => mStr.split(/\s*,\s*/)),
  body('minors')
    .isString()
    .bail()
    .customSanitizer(mStr => mStr.split(/\s*,\s*/)),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())    
      return res
        .status(400)
        .json(result.array());

    const requestData = matchedData(req) as {
      authorization: string;
      studentId?: UserId;
      planId: PlanId;
      planName: string;
      majors: AccomplishmentId[];
      minors: AccomplishmentId[];
    };
    const { authorization, studentId, planId, planName } = requestData;
    let { majors, minors } = requestData;

    try {
      const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

      if (!userId)
        return res.sendStatus(401);

      const loginData = await getUsers(userId, studentId);
      if (!loginData)
        return res.sendStatus(401);
      const [user] = loginData;

      const plan = await PlanModel.findOne({
        studentId: user.userId,
        planId
      })
        .exec();
      
      if (!plan)
        return res.sendStatus(404);
      
      if (majors.length === 1 && majors[0] === '') 
        majors = [];

      if (minors.length === 1 && minors[0] === '') 
        minors = [];

      const allAccomplishments = majors.concat(minors);
      const count = await AccomplishmentModel.countDocuments({
        accomplishmentId: {
          $in: allAccomplishments
        }
      })
        .exec();
      
      if (allAccomplishments.length !== count)
        return res.sendStatus(400);

      plan.name = planName;
      plan.accomplishments = allAccomplishments;
      plan.markModified('accomplishments');
      await plan.save();
      
      res.sendStatus(204);
    } catch (e) {
      if (e instanceof jwtPkg.JsonWebTokenError)
        return res.sendStatus(401);
      console.error(e);
      return res.sendStatus(500);
    }
  });

export default route;

async function getUsers(userId: UserId, studentId?: UserId):
  Promise<[HydratedDocument<PlannerUser>, HydratedDocument<PlannerUser>] | null> {
  let loggedInUser: HydratedDocument<PlannerUser> | null = null;
  let user = await PlannerUserModel.findOne({
    userId
  })
    .exec();
  
  if (!user) 
    return null;
  loggedInUser = user;

  otherUserCheck: if (studentId) {
    if (user.role === UserRole.Student)
      if (user.userId !== studentId)
        return null;
      else
        break otherUserCheck;
    else if (user.role === UserRole.Faculty && !user.advisees.includes(studentId))
      return null;

    user = await PlannerUserModel.findOne({
      userId: studentId
    })
      .exec();
    
    if (!user) {
      loggedInUser.advisees = loggedInUser!.advisees.filter(a => a !== studentId);
      loggedInUser.markModified('advisees');
      await loggedInUser.save();
      return null;
    }

    if (user.advisor !== loggedInUser.userId)
      return null;
  } else if (user.role === UserRole.Faculty)
    return null;
  
  return [user, loggedInUser];
}