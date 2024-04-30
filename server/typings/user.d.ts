import { UserRole } from './enum.ts';
import type { UserId } from './id';

type TokenData = {
  token: string;
};

export type RegisterResponse = TokenData;
export type LoginResponse = TokenData;

export type GetAdviseesResponse = {
  studentName: string;
  studentEmail: string;
  studentId: UserId;
}[];

export type BasicDataResponse = {
  name: string;
  userId: string;
  role: UserRole;
};