import { DataResponse } from '../../../server/typings/planner';
import '../css/Year.css';
import { TermSeason } from '../enum';
import Term from './Term';

export default function Year({ year, courses }: {
  year: number;
  courses: Required<DataResponse>['plan']['courses'];
}) {
  return (
    <div className='year-row'> 
      <Term termSeason={TermSeason.Fall} year={year} courses={courses} />
      <Term termSeason={TermSeason.Spring} year={year + 1} courses={courses} />
      <Term termSeason={TermSeason.Summer} year={year + 1} courses={courses} />
    </div>
  );
}