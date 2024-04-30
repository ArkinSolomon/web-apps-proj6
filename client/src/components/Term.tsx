import { DataResponse } from '../../../server/typings/planner';
import { TermSeason } from '../enum';

export default function Term({ year, termSeason, courses }: {
  year: number;
  termSeason: TermSeason;
  courses: Required<DataResponse>['plan']['courses'];
}) {
  return (
    <div id={`term-${year}-${termSeason}`}>
      {termSeason[0].toUpperCase() + termSeason.slice(1)} {year}
    </div>
  );
}