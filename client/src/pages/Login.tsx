import { useEffect, useState } from 'react';
import userApi from '../api/userApi';

export default function Login() {
  useEffect(() => {
    (async () => {
      if (await userApi.isLoggedIn()) {
        window.location.href = '/planner';
      }
    })();
  }, []);

  const [emailText, setEmailText] = useState('');
  const [passwordText, setPasswordText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  return (
    <>
      <p className='error'>{errorText}</p>
      <input name='email' placeholder='Email' id='email' type='text' value={emailText} onChange={(e) => setEmailText(e.target.value)} disabled={submitting} />
      <input name='password' placeholder='Password' id='password' type='password' value={passwordText} onChange={(e) => setPasswordText(e.target.value)} disabled={submitting} />
      <button disabled={submitting} onClick={async () => {
        try {
          setSubmitting(true);
          await userApi.login(emailText, passwordText);
          window.location.href = '/planner';
        } catch {
          setErrorText('Invalid username or password');
        } finally {
          setSubmitting(false);
        }
      }}
      >Login</button>
    </>
  );
}