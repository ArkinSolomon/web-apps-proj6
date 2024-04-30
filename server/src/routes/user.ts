import { Router } from 'express';
import { body, header, matchedData, validationResult } from 'express-validator';
import PlannerUserModel from '../models/userModel.js';
import * as jwt from '../jwtAsync.js';
import type { LoginResponse, RegisterResponse } from '../../typings/user.js';
import jwtPkg from 'jsonwebtoken';
import type { UserId } from '../../typings/id.js';
import { UserRole } from '../../typings/enum.js';
import bcrypt from 'bcrypt';

const route = Router();

route.post('/register',
  body('email').isEmail().withMessage('Invalid email').trim(),
  body('password').isString().isLength({
    min: 8,
    max: 32
  }).withMessage('Invalid password length'),
  body('name').matches(/^\w{2,}\s\w{2,}$/i).withMessage('Invalid name'),
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.json(result.array());
      }

      const { email, password, name } = matchedData(req) as {
        email: string;
        password: string;
        name: string;
      };

      const existingCount = await PlannerUserModel.countDocuments({
        email
      })
        .exec();
      if (existingCount) {
        return res.json({
          'errors': [
            {
              location: 'body',
              msg: 'Email in use',
              path: 'email',
              type: 'field'
            }
          ]
        });
      }
    
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = new PlannerUserModel({
        email,
        name,
        passwordHash
      });
      await newUser.save();
    
      const token = await jwt.signAsync({
        userId: newUser.userId
      }, process.env.JWT_SECRET!, {
        expiresIn: '30d' // lol security whats that
      });

      res
        .status(200)
        .json({
          token
        } as RegisterResponse);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

route.post('/login',
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isString().isLength({
    min: 8,
    max: 32
  }).withMessage('Invalid password length'),
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.json(result.array());
      }

      const { email, password } = matchedData(req) as {
      email: string;
      password: string;
    };

      const user = await PlannerUserModel.findOne({
        email
      })
        .select('-_id -__v')
        .exec();
      if (!user) {
        return res.sendStatus(401);
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.sendStatus(401);
      }

      const token = await jwt.signAsync({
        userId: user.userId
      }, process.env.JWT_SECRET!, {
        expiresIn: '30d'
      });
  
      res
        .status(200)
        .json({
          token
        } as LoginResponse);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
  
route.get('/isTokenValid', header('authorization').isJWT(), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.sendStatus(400);
  }

  const { authorization } = matchedData(req) as {
    authorization: string;
  };

  try {
    const tokenData = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

    if (!tokenData) {
      return res.sendStatus(401);
    }
    
    const userExists = await PlannerUserModel.exists({
      userId: tokenData.userId
    })
      .exec();

    res.sendStatus(userExists ? 204 : 401);
  } catch (e) {
    if (e instanceof jwtPkg.JsonWebTokenError) {
      return res.sendStatus(401);
    }
    console.error(e);
    res.sendStatus(500);
  }
});

route.get('/getAdvisees', header('authorization').isJWT(), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.sendStatus(400);
  }

  const { authorization } = matchedData(req) as {
    authorization: string;
  };

  try {
    const tokenData = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!) as {
      userId?: UserId;
    };

    if (!tokenData) {
      return res.sendStatus(401);
    }

    const user = await PlannerUserModel.findOne({
      userId: tokenData.userId
    })
      .exec();
    
    if (!user || user.role !== UserRole.Faculty) {
      return res.sendStatus(401);
    }
    
    const result = await PlannerUserModel.aggregate([
      {
        $match: {
          userId: {
            $in: user.advisees
          }
        }
      },
      {
        $project: {
          userId: 1,
          name: 1,
          email: 1,
          _id: 0
        }
      }
    ])
      .exec();
    
    return res
      .status(200)
      .json(result);
  } catch (e) {
    if (e instanceof jwtPkg.JsonWebTokenError) {
      return res.sendStatus(401);
    }
    console.error(e);
    res.sendStatus(500);
  }
});

export default route;