import { useEffect, useState } from 'react';
import userApi from '../api/userApi';
import '../css/Faculty.css';
import { BasicDataResponse, GetAdviseesResponse } from '../../../server/typings/user';
import { UserRole } from '../enum';

export default function Faculty() {
  const [advisees, setAdvisees] = useState<GetAdviseesResponse | null > (null);
  const [basicData, setBasicData] = useState<BasicDataResponse | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    (async () => {
      try {

        const basicData = await userApi.basicData();
        if (basicData.role !== UserRole.Faculty) {
          window.location.href = '/planner';
        }
        setBasicData(basicData);
        setAdvisees(await userApi.getAdvisees());
      } catch {
        setHasError(true);
      } finally {
        setHasLoaded(true);
      }
    })();
  }, []);

  if (hasError) {
    return <h1 id='loading-header'>An error occured</h1>;
  } else if (!hasLoaded) {
    return <h1 id='loading-header'>Loading</h1>;
  }

  const tableBody = advisees!.map(a => 
    <tr key={a.studentId}>
      <td>{a.studentName}</td>
      <td>{a.studentEmail}</td>
      <td><a className='modify-plan-button' href={`/planner/?studentId=${a.studentId}`}>Modify Plan</a></td>
    </tr>
  );

  return (
    <>
      <header id='faculty-header'>
        <h1>Advisors</h1>
        <p id='faculty-greeting'>Hello <span>{basicData?.name}</span>! <a role='button' onClick={() => {
          userApi.logout();
          window.location.href = '/login';
        }}
        >Logout</a></p>
      </header>
      <table id='advisee-table'>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Email</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tableBody}
        </tbody>
      </table>
    </>
  );
}