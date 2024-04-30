import { CourseId } from '../../../server/typings/id';
import { DataResponse } from '../../../server/typings/planner';
import { TermSeason } from '../enum';
import '../css/Term.css';

export default function Term({ year, termSeason, allCourses, courses, onCourseAdded, onCourseRemoved }: {
  year: number;
  termSeason: TermSeason;
  allCourses: Required<DataResponse>['catalog']['courses'];
  courses: Required<DataResponse>['plan']['courses'];
  onCourseAdded: (year: number, termSeason: TermSeason, id: CourseId) => void;
  onCourseRemoved: (id: CourseId) => void;
}) {
  const termCourses = Object.values(courses).filter(c => c.plannedYear === year && c.plannedTerm === termSeason);
  let totalCredits = 0;
  const plannedList = termCourses.map(tc => {
    const course = allCourses[tc.plannedCourse];
    totalCredits += course.credits;
    return (
      <div className='planned-course-row' key={`${year}-${termSeason}-${course.courseId}`}>
        <p draggable onDragStart={e => e.dataTransfer.setData('courseId', course.courseId)} className='planned-course'>{course.courseId} {course.name}</p>
        <p role='button' className='planned-course-remove' onClick={() => onCourseRemoved(course.courseId)}>X</p>
      </div>
    );
  });

  return (
    <div className='plan-term' id={`term-${year}-${termSeason}`} onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault(); 
      const courseId = e.dataTransfer.getData('courseId');
      onCourseAdded(year, termSeason, courseId as CourseId);
    }}
    >
      <div className='term-header'>
        <p className='term-title'>{termSeason[0].toUpperCase() + termSeason.slice(1)} {year}</p>
        <p>Credits: <span className='credit-count'>{totalCredits}</span></p>
      </div>
      <hr />
      {plannedList}
    </div>
  );
}