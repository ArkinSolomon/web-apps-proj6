import { useEffect, useState } from 'react';
import userApi from '../api/userApi';
import '../css/Auth.css';

export default function Create() {
  useEffect(() => {
    (async () => {
      if (await userApi.isLoggedIn()) {
        window.location.href = '/planner';
      }
    })();
  }, []);

  const [nameText, setNameText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [passwordText, setPasswordText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  return (
    <div id='auth-wrapper'>
      <div id='auth-container'>
        <h1>Create</h1>
        <p className='error'>{errorText}</p>
        <input name='name' placeholder='Student Name' id='name' type='text' value={nameText} onChange={(e) => setNameText(e.target.value)} disabled={submitting} />
        <input name='email' placeholder='Email' id='email' type='text' value={emailText} onChange={(e) => setEmailText(e.target.value)} disabled={submitting} />
        <input name='password' placeholder='Password' id='password' type='password' value={passwordText} onChange={(e) => setPasswordText(e.target.value)} disabled={submitting} />
        <button disabled={submitting} onClick={async () => {
          try {
            setSubmitting(true);
            await userApi.register(emailText, nameText, passwordText);
          } catch {
            setErrorText('Invalid username or password');
          } finally {
            setSubmitting(false);
          }
        }}
        >Create</button>
        <a href='/login'>Login instead</a>
      </div>
    </div>
  );
}