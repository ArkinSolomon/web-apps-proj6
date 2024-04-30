export enum SortMode {
  CourseId,
  CourseName,
  Credits
}

import { useMemo, useState } from 'react';
import { DataResponse } from '../../../server/typings/planner';
import '../css/CourseTable.css';

export default function CourseTable({ courses }: {
  courses: Required<DataResponse>['catalog']['courses'];
}) {
  const [sortMode, setSortMode] = useState(SortMode.CourseId);

  const courseTableData = useMemo(() => {
    const courseArr = Object.values(courses);
    let comparer: (a: typeof courseArr[0], b: typeof courseArr[1]) => number;
    switch (sortMode) {
    case SortMode.CourseId:
      comparer = (a, b) => a.courseId.localeCompare(b.courseId);
      break;
    case SortMode.CourseName:
      comparer = (a, b) => a.courseId.localeCompare(b.courseId);
      break;
    case SortMode.Credits:
      comparer = (a, b) => b.credits - a.credits;
      break;
    }
    courseArr.sort(comparer);

    const courseElems = [];
    for (const course of courseArr) {
      courseElems.push(
        <tr key={`course-table-${course.courseId}`}>
          <td>{course.courseId}</td>
          <td>{course.name}</td>
          <td>{course.description}</td>
          <td>{course.credits}</td>
        </tr>
      );
    }
    return courseElems;
  }, [sortMode]);

  return (
    <table id='course-table'>
      <colgroup>
        <col span={1} id='col-group-id' />
        <col span={1} id='col-group-name' />
        <col span={1} id='col-group-desc' />
        <col span={1} id='col-group-credits' />
      </colgroup>
      <thead>
        <tr>
          <th className={'sortable-header' + (sortMode === SortMode.CourseId ? ' active-sort' : '')} onClick={() => setSortMode(SortMode.CourseId)}>Course Id</th>
          <th className={'sortable-header' + (sortMode === SortMode.CourseName ? ' active-sort' : '')} onClick={() => setSortMode(SortMode.CourseName)}>Name</th>
          <th>Description</th>
          <th className={'sortable-header' + (sortMode === SortMode.Credits ? ' active-sort' : '')} onClick={() => setSortMode(SortMode.Credits)}>Credits</th>
        </tr>
      </thead>
      <tbody>
        {courseTableData}
      </tbody>
    </table>
  );
}