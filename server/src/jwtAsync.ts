import jwt, { type Secret, type SignOptions, type VerifyOptions } from 'jsonwebtoken';

export function signAsync(payload: string | Buffer | object, secretOrPrivateKey: Secret, options: SignOptions = {}) {
  return new Promise((resolve, reject) => jwt.sign(payload, secretOrPrivateKey, options, (err, res) => {
    if (err) {
      reject(err);
    } else {
      resolve(res);
    }
  }));
}

export function verifyAsync(token: string, secretOrPrivateKey: Secret, options: VerifyOptions & { complete: true; } = { complete: true }) {
  return new Promise((resolve, reject) => jwt.verify(token, secretOrPrivateKey, options, (err, decoded) => {
    if (err) {
      reject(err);
    } else {
      resolve(decoded!.payload);
    }
  }));
}