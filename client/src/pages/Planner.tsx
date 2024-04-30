enum DialogMode {
  Hidden,
  StudentNotes,
  FacultyNotes,
  PlanManager
}

type PlannerState = {
  loaded: boolean;
  error?: string;
  data?: DataResponse;
  isFaculty?: boolean;
  courseSearch: string;
  dialogMode: DialogMode;
};

import { Component, createRef, ReactNode, RefObject } from 'react';
import userApi from '../api/userApi';
import '../css/Planner.css';
import plannerApi from '../api/plannerApi';
import Year from '../components/Year';
import { DataResponse } from '../../../server/typings/planner';
import CourseTable from '../components/CourseTable';
import Requirements from '../components/Requirements';
import PlanManager from '../components/PlanManager';
import $ from 'jquery';
import { TermSeason, UserRole } from '../enum';
import { CourseId } from '../../../server/typings/id';
import Notes from '../components/Notes';

export default class Planner extends Component<Record<string, never>, PlannerState> {
  
  state: PlannerState = {
    loaded: false,
    courseSearch: '',
    dialogMode: DialogMode.Hidden
  };

  private _dialogRef: RefObject<HTMLDialogElement>;

  constructor(props: Record<string, never> = {}) {
    super(props);

    this._dialogRef = createRef<HTMLDialogElement>();

    (async () => {
      try {
        if (!(await userApi.isLoggedIn())) {
          window.location.href = '/login';
        }
         
        const [data, basicData] = await Promise.allSettled([plannerApi.data(), userApi.basicData()]);

        if (basicData.status === 'fulfilled' && basicData.value.role === UserRole.Faculty && !window.location.search.includes('studentId')) {
          window.location.href = '/faculty';
        }

        if (data.status === 'rejected') {
          throw new Error('Could not retreive data');
        }

        this.setState({
          loaded: true,
          data: data.status === 'fulfilled' ? data.value : void 0,
          isFaculty: basicData.status === 'fulfilled' && basicData.value.role === UserRole.Faculty
        });
      } catch (e) {
        let message = e;
        if (e instanceof Object && 'message' in e && typeof e.message === 'string') {
          message = e.message;
        }
        this.setState({
          error: typeof message === 'string' ? message : 'An unknown error occured'
        });
      }
    })();
  } 

  componentDidUpdate(_: Record<string, never>, prevState: PlannerState) {
    if (prevState.dialogMode !== this.state.dialogMode) {
      if (this.state.dialogMode === DialogMode.Hidden) {
        this._dialogRef.current?.close();
      } else {
        this._dialogRef.current?.showModal();
        $(this._dialogRef.current!).on('close', () => {
          console.log('close');
          this.setState({
            dialogMode: DialogMode.Hidden
          });
        });
      }
    }
  }

  private _dialogSelector() {
    let dialogContent;
    switch (this.state.dialogMode) {
    case DialogMode.FacultyNotes:
      dialogContent = <Notes title='Advisor Notes' value={this.state.data!.plan!.advisorNotes ?? ''} onChange={notes => {
        const dataCp = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];
        const oldData = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];

        dataCp.plan!.advisorNotes = notes;
        plannerApi
          .updateAdvisorNotes(this.state.data!.plan!.planId, notes)
          .then(result => {
            if (!result) {
              this.setState({
                data: oldData
              });
            }
          });

        this.setState({
          data: dataCp,
          dialogMode: DialogMode.Hidden
        });
      }}
      />;
      break;
    case DialogMode.StudentNotes:
      dialogContent = <Notes title='Student Notes' value={this.state.data!.plan!.studentNotes} onChange={notes => {
        const dataCp = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];
        const oldData = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];

        dataCp.plan!.studentNotes = notes;
        plannerApi
          .updateStudentNotes(this.state.data!.plan!.planId, notes)
          .then(result => {
            if (!result) {
              this.setState({
                data: oldData
              });
            }
          });

        this.setState({
          data: dataCp,
          dialogMode: DialogMode.Hidden
        });
      }}
      />;
      break;
    case DialogMode.PlanManager:
      dialogContent = <PlanManager plans={this.state.data?.plans ?? {}} currentPlan={this.state.data?.plan} availableCatalogs={this.state.data?.availableCatalogs ?? []} accomplishments={this.state.data?.catalog?.accomplishments} />;
      break;
    default:
      return void 0;
    }

    return (
      <dialog key='main-dialog' id='main-dialog' ref={this._dialogRef}>{dialogContent}</dialog>
    );
  }

  private _majorsStr(): string {
    if (!this.state.data?.plan || !this.state.data!.plan!.majors.length) {
      return 'N/A';
    }

    if (this.state.data!.plan!.majors.length === 1) {
      return this.state.data!.plan!.majors[0];
    } else {
      return `${this.state.data!.plan!.majors[0]} and ${this.state.data!.plan!.majors.length - 1} more`;
    }
  }

  private _genYears() {
    const years = [];

    const { catalogYear, yearCount, courses } = this.state.data!.plan!;
    for (let i = 0; i < yearCount; ++i) {
      const year = catalogYear + i;
      years.push(<Year allCourses={this.state.data!.catalog!.courses} courses={courses} year={year} key={'year-' + year} onCourseAdded={(year, termSeason, courseId) => {
        const dataCp = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];
        const oldData = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];

        dataCp.plan!.courses[courseId] = {
          plannedCourse: courseId,
          plannedTerm: termSeason,
          plannedYear: year
        };

        $(`.requirement-${courseId}`).addClass('course-fullfilled');

        plannerApi.planCourse(this.state.data!.plan!.planId, courseId, termSeason, year)
          .then(result => {
            if (!result) {
              $(`.requirement-${courseId}`).removeClass('course-fullfilled');
              this.setState({
                data: oldData
              });
            }
          });

        this.setState({
          data: dataCp
        });
      }}
      onCourseRemoved={(courseId) => {
        const dataCp = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];
        const oldData = JSON.parse(JSON.stringify(this.state.data)) as Required<typeof this.state>['data'];
  
        delete dataCp.plan!.courses[courseId];
        $(`.requirement-${courseId}`).removeClass('course-fullfilled');
        plannerApi.deletePlannedCourse(this.state.data!.plan!.planId, courseId)
          .then(result => {
            if (!result) {
              $(`.requirement-${courseId}`).addClass('course-fullfilled');
              this.setState({
                data: oldData
              });
            }
          });
  
        this.setState({
          data: dataCp
        });
      }}
      />);
    }

    return years;
  }

  private _updateYearCount(delta: number) {
    const { yearCount: originalYearCount } = this.state.data!.plan!;
    const newYearCount = originalYearCount + delta;

    plannerApi.updateYearCount(this.state.data!.plan!.planId, newYearCount)
      .then(didUpdate => {
        if (!didUpdate) {
          const revertData = JSON.parse(JSON.stringify(this.state.data)) as DataResponse;
          revertData.plan!.yearCount = originalYearCount;
          this.setState({
            data: revertData
          });
        }
      });
    const newData = JSON.parse(JSON.stringify(this.state.data)) as DataResponse;
    newData.plan!.yearCount = newYearCount;
    this.setState({
      data: newData
    });
  }

  render(): ReactNode {
    if (this.state.error) {
      return <div id='error-wrapper'>
        <h1>An error occured</h1>
        <p className='error'>{this.state.error}</p>
      </div>;
    }
    
    if (!this.state.loaded) {
      return <h1 id='loading-header'>Loading</h1>;
    }

    let totalCredits = null;
    if (this.state.data?.plan) {
      totalCredits = Object.values(this.state.data!.plan!.courses).reduce((total, { plannedCourse }) => {
        const courseData = this.state.data!.catalog!.courses[plannedCourse];
        return total + courseData.credits;
      }, 0);
    }

    return (
      <>
        {this._dialogSelector()}
        <header>
          <h1>Student Planning</h1>
          <div className='spacer' />
          <div id='header-info-box'>
            <p>Student: <span>{this.state.data?.studentName}</span></p>
            <p>Major: <span>{this._majorsStr()}</span></p>
            <p>Catalog: <span>{this.state.data?.plan?.catalogYear?.toString() ?? 'N/A'}</span></p>
            <p>Plan: <a onClick={() => this.setState({
              dialogMode: DialogMode.PlanManager
            })}
            >{this.state.data?.plan?.planName ?? 'N/A'}</a> (<span>{totalCredits ?? 'N/A'}</span> Credits)</p>
          </div>
        </header>
        <main>
          <div id='upper-left'>
            {this.state.data?.plan && <Requirements catalogCourses={this.state.data!.catalog!.courses} requirements={this.state.data!.requirements!} plannedCourses={this.state.data!.plan!.courses} key={null} />}
          </div>
          <div id='upper-right'>
            {
              this.state.data?.plan && <>
                {this._genYears()}
                <div id='ur-utils'>
                  <button onClick={() => this.setState({
                    dialogMode: DialogMode.StudentNotes
                  })}
                  >Student Notes</button>
                  {this.state.isFaculty && <button onClick={() => this.setState({
                    dialogMode: DialogMode.FacultyNotes
                  })}
                  >Advisor Notes</button>}
                  <div className='spacer' />
                  <button id='add-year-button' disabled={this.state.data!.plan!.yearCount >= 8} onClick={() => this._updateYearCount(1)}>+ Add Year</button>
                  <button disabled={this.state.data!.plan!.yearCount <= 4} onClick={() => {
                    const dataCopy = JSON.parse(JSON.stringify(this.state.data!)) as DataResponse;
                    
                    for (const [courseId, course] of Object.entries(this.state.data!.plan!.courses)) {
                      if ((course.plannedYear >= this.state.data!.plan!.catalogYear + this.state.data!.plan!.yearCount - 1 &&
                          course.plannedTerm === TermSeason.Fall) ||
                        (course.plannedYear >= this.state.data!.plan!.catalogYear + this.state.data!.plan!.yearCount &&
                          (course.plannedTerm == TermSeason.Spring || course.plannedTerm == TermSeason.Summer))) {
                        delete dataCopy.plan!.courses[courseId as CourseId];
                        $(`.requirement-${courseId}`).removeClass('course-fullfilled');
                      }
                    }

                    this.setState({
                      data: dataCopy
                    }, () => this._updateYearCount(-1));
                  }}
                  >- Remove Year</button>
                </div>
              </>
            }
            {
              !this.state.data?.plan && <div id='no-plan'>
                <h1>No plan exists</h1>
                <a onClick={() => this.setState({
                  dialogMode: DialogMode.PlanManager
                })}
                >Create a new plan.</a>
              </div>
            }
          </div>
          <div id='lower-left'>
            <p>Hello, <span>{this.state.data?.loggedInName}</span>!</p>
            <hr />
            { this.state.isFaculty && <a href='/faculty'>All students</a> }
            <a id='logout-button' onClick={() => {
              userApi.logout();
              window.location.href = '/login';
            }}
            >Logout</a>
          </div>
          <div id='lower-right'>
            {this.state.data!.plan && <>
              <h2>Course Finder</h2>
              <div id='course-search-container'>
                <label htmlFor='course-search'>Search: </label>
                <input id='course-search' name='course-search' type='text' placeholder='Search...' value={this.state.courseSearch} onChange={e => this.setState({
                  courseSearch: e.target.value
                })}
                />
              </div>
              <CourseTable courses={this.state.data!.catalog!.courses} filter={this.state.courseSearch.toLowerCase()} key='course-table' />
            </>}
          </div>
        </main>
      </>
    );
  }
}