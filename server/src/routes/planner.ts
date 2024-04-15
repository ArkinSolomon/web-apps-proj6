import { Router } from 'express';
import { header, matchedData, query, validationResult } from 'express-validator';
import * as jwt from '../jwtAsync';
import type { HydratedDocument } from 'mongoose';
import type { PlannerUser } from '../models/userModel';
import PlannerUserModel from '../models/userModel';
import type { DataResponse } from '../../typings/planner';
import PlanModel from '../models/planModel';
import AccomplishmentModel from '../models/accomplishmentModel';
import { AccomplishmentType, UserRole } from '../../typings/enum';
import type { PlanId, UserId } from '../../typings/id';
import { JsonWebTokenError } from 'jsonwebtoken';
import CourseModel from '../models/courseModel';
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

  let user: HydratedDocument<PlannerUser> | null = null;
  let loggedInUser: HydratedDocument<PlannerUser> | null = null;
  try {
    const { userId } = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

    if (!userId) 
      return res.sendStatus(401);

    const loginData = await getUsers(userId, studentId);
    if (!loginData)
      return res.sendStatus(401);
    [user, loggedInUser] = loginData;
  } catch (e) {
    if (e instanceof JsonWebTokenError)
      return res.sendStatus(401);
    console.error(e);
    return res.sendStatus(500);
  }

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
      planId: {
        $in: plan.accomplishments
      }
    })
      .select('-_id -__v -requirements')
      .lean()
      .exec();
    
    type SinglePlan = Required<DataResponse>['plans'][PlanId];
    data.plans[plan.planId] = {
      planId: plan.planId,
      // There is 100% a bug in TS that needs these reductions to be so verbose, like the one below for data.plan.courses works but if you do the same thing here it breaks
      majors: planAccomplishments.filter(a => a.type === AccomplishmentType.Major).reduce((majors: unknown, accomplishment) => (majors as SinglePlan['majors'])[accomplishment.accomplishmentId] = accomplishment.name, {}) as SinglePlan['majors'],
      minors: planAccomplishments.filter(a => a.type === AccomplishmentType.Major).reduce((minors: unknown, accomplishment) => (minors as SinglePlan['minors'])[accomplishment.accomplishmentId] = accomplishment.name, {}) as SinglePlan['minors'],
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
      planId: {
        $in: plan.accomplishments
      }
    })
      .select('-_id -__v')
      .lean()
      .exec();

    data.plan = {
      planId: plan.planId,
      majors: planAccomplishments.filter(a => a.type === AccomplishmentType.Major).map(a => a.name),
      minors: planAccomplishments.filter(a => a.type === AccomplishmentType.Minor).map(a => a.name),
      courses: plan.courses.reduce((pcs, pc) => pcs[pc.plannedCourse] = pc, {} as Required<DataResponse>['plan']['courses']),
      catalogYear: plan.catalogYear,
      yearCount: plan.yearCount
    };

    // const requirements = await AccomplishmentModel.aggregate([
    //   {
    //     $match: {
    //       accomplishmentId: {
    //         $in: plan.accomplishments
    //       }
    //     }
    //   }
    // ]);
  }

  res.json(data);
});

route.post('/newPlan', header('authorization').isJWT(), query('studentId').optional().isLength({
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

    const newPlan = new PlanModel({
      studentId: user.userId
    });
    await newPlan.save();
    user.activePlanId = newPlan.planId;
    await user.save();
  
    res.sendStatus(204);
  } catch (e) {
    if (e instanceof JsonWebTokenError)
      return res.sendStatus(401);
    console.error(e);
    return res.sendStatus(500);
  }
});

export default route;

async function getUsers(userId: UserId, studentId?: UserId): Promise<[HydratedDocument<PlannerUser>, HydratedDocument<PlannerUser>] | null> {
  let loggedInUser: HydratedDocument<PlannerUser> | null = null;
  let user = await PlannerUserModel.findOne({
    userId
  })
    .exec();
  
  if (!user) 
    return null;
  loggedInUser = user;

  // This could totally be simplified but it won't be clear if it is
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
  } else if (user.role === UserRole.Faculty)
    return null;
  
  return [user, loggedInUser];
}