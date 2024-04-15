import { Router } from 'express';
import { body, header, matchedData, validationResult } from 'express-validator';
import PlannerUserModel from '../models/userModel';
import * as jwt from '../jwtAsync';
import type { LoginResponse, RegisterResponse } from '../../typings/user';

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
      if (!result.isEmpty())
        return res.json(result.array());

      const { email, password, name } = matchedData(req) as {
        email: string;
        password: string;
        name: string;
      };

      const existingCount = await PlannerUserModel.countDocuments({
        email
      })
        .exec();
      if (existingCount)
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
    
      const passwordHash = await Bun.password.hash(password, 'bcrypt');
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
      if (!result.isEmpty()) 
        return res.json(result.array());

      const { email, password } = matchedData(req) as {
      email: string;
      password: string;
    };

      const user = await PlannerUserModel.findOne({
        email
      })
        .select('-_id -__v')
        .exec();
      if (!user) 
        return res.sendStatus(401);

      const isValid = await Bun.password.verify(password, user.passwordHash, 'bcrypt');
      if (!isValid)
        return res.sendStatus(401);

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

      res.sendStatus(204);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
  
route.get('/isTokenValid', header('authorization').isJWT(), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty())
    return res.sendStatus(400);

  const { authorization } = matchedData(req) as {
    authorization: string;
  };

  try {
    const tokenData = await jwt.verifyAsync(authorization, process.env.JWT_SECRET!);
    console.log(tokenData);
    res.sendStatus(tokenData ? 204 : 401);
  } catch {
    res.sendStatus(401);
  }
});

export default route;