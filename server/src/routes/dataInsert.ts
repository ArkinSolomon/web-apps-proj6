// This page contains development routes only, that's why there is 0 validation for anything

import { Router } from 'express';
import CourseModel from '../models/courseModel.js';
import AccomplishmentModel from '../models/accomplishmentModel.js';
import { AccomplishmentType } from '../../typings/enum.js';
const route = Router();

// This one doesn't work, and I can't figure out why, so I'll just import it straight into Mongo, which really is what I should've done, but I was originally using similar scripts to how it was done for project 5
route.post('/course', async (req, res) => {
  const newCourse = new CourseModel({
    courseId: req.body.courseId,
    name: req.body.name,
    description: req.body.description,
    credits: req.body.credits,
    isGenEd: req.body.isGenEd,
    yearsOffered: [2020, 2021, 2022, 2023, 2024]
  });
  await newCourse.save();
  res.sendStatus(204);
});

route.post('/major', async (req, res) => {
  const newAcc = new AccomplishmentModel({
    name: req.body.name,
    yearsOffered: [2020, 2021, 2022, 2023, 2024],
    type: AccomplishmentType.Major
  });
  await newAcc.save();
  res.sendStatus(204);
});

route.post('/minor', async (req, res) => {
  const newAcc = new AccomplishmentModel({
    name: req.body.name,
    yearsOffered: [2020, 2021, 2022, 2023, 2024],
    type: AccomplishmentType.Minor
  });
  await newAcc.save();
  res.sendStatus(204);
});

export default route;