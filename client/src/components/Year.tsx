import { DataResponse } from '../../../server/typings/planner';
import '../css/Year.css';
import { TermSeason } from '../enum';
import Term from './Term';

export default function Year({ year, courses, allCourses, onCourseAdded, onCourseRemoved }: {
  year: number;
  courses: Required<DataResponse>['plan']['courses'];
  allCourses: Parameters<typeof Term>[0]['allCourses'];
  onCourseAdded: Parameters<typeof Term>[0]['onCourseAdded'];
  onCourseRemoved: Parameters<typeof Term>[0]['onCourseRemoved'];
}) {

  const passThroughProps = {
    allCourses,
    courses,
    onCourseAdded,
    onCourseRemoved
  };

  return (
    <div className='year-row'> 
      <Term termSeason={TermSeason.Fall} year={year} {...passThroughProps} />
      <Term termSeason={TermSeason.Spring} year={year + 1} {...passThroughProps} />
      <Term termSeason={TermSeason.Summer} year={year + 1} {...passThroughProps} />
    </div>
  );
}