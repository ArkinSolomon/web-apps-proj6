type RequirementsProps = {
  requirements: Required<DataResponse>['requirements'];
  plannedCourses: Required<DataResponse>['plan']['courses'];
  catalogCourses: Required<DataResponse>['catalog']['courses'];
};

type RequirementsState = {
  metRequirements: CourseId[];
};

import $ from 'jquery';
import 'jquery-ui/ui/widgets/accordion';
import 'jquery-ui/themes/base/all.css';
import '../css/Requirements.css';
import { DataResponse } from '../../../server/typings/planner';
import { CourseId } from '../../../server/typings/id';
import { Component, ReactNode } from 'react';

export default class Requirements extends Component<RequirementsProps, RequirementsState> {

  state: RequirementsState;

  constructor(props: RequirementsProps) {
    super(props);

    this.state = {
      metRequirements: props.requirements.core
        .concat(props.requirements.cognates, props.requirements.electives, props.requirements.genEds)
        .filter(r => r in props.plannedCourses)
    };
    this._reqToElem = this._reqToElem.bind(this);
  }

  componentDidMount(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ($('#requirements-accordion') as any).accordion({
      active: null,
      header: 'h4',
      heightStyle: 'autoHeight',
      collapsible: true
    });
  }

  private _reqToElem(prefix: string) {
    return (req: CourseId) => {
      const course = this.props.catalogCourses[req];
      return <p draggable onDragStart={e => e.dataTransfer.setData('courseId', req)} className={`req-course requirement-${course.courseId}` + (this.state.metRequirements.includes(req) ? ' course-fullfilled' : '')} key={`${prefix}-${course.courseId}-${course.name}`}>{course.courseId} {course.name}</p>;
    };
  }

  render(): ReactNode {
    return (
      <div id='requirements-accordion'>
        <h4>Core</h4>
        <div>{this.props.requirements.core.map(this._reqToElem('core'))}</div>
        <h4>Electives</h4>
        <div>{this.props.requirements.electives.map(this._reqToElem('elective'))}</div>
        <h4>Cognates</h4>
        <div>{this.props.requirements.cognates.map(this._reqToElem('cognate'))}</div>
        <h4>Gen-Eds</h4>
        <div>{this.props.requirements.genEds.map(this._reqToElem('ge'))}</div>
      </div>
    );
  }
}