type PlannerState = {
  loaded: boolean;
  error?: string;
  data?: DataResponse;
  isFaculty?: boolean;
};

import { Component, ReactNode } from 'react';
import userApi from '../api/userApi';
import '../css/Planner.css';
import plannerApi from '../api/plannerApi';
import Year from '../components/Year';
import { DataResponse } from '../../../server/typings/planner';
import CourseTable from '../components/CourseTable';

export default class Planner extends Component<Record<string, never>, PlannerState> {
  
  state: PlannerState = {
    loaded: false
  };

  constructor(props: Record<string, never> = {}) {
    super(props);

    (async () => {
      try {
        if (!(await userApi.isLoggedIn())) {
          window.location.href = '/login';
        }
         
        const [data, isFaculty] = await Promise.all([plannerApi.data(), new Promise<boolean>(resolve => {
          userApi
            .getAdvisees()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        })]);
        this.setState({
          loaded: true,
          data,
          isFaculty
        });
      } catch {
        this.setState({
          error: 'An error occured.'
        });
      }
    })();
  } 

  private _genYears() {
    const years = [];

    const { catalogYear, yearCount, courses } = this.state.data!.plan!;
    for (let i = 0; i < yearCount; ++i) {
      const year = catalogYear + i;
      years.push(<Year courses={courses} year={year} key={'year-' + year} />);
    }

    return years;
  }

  private _updateYearCount(delta: number) {
    const { yearCount: originalYearCount } = this.state.data!.plan!;
    const newYearCount = originalYearCount + delta;
    plannerApi.updateYearCount(this.state.data!.plan!.planId, newYearCount)
      .then(didUpdate => {
        if (!didUpdate) {
          const newData = { ...this.state.data } as DataResponse;
          newData.plan!.yearCount = originalYearCount;
          this.setState({
            data: newData
          });
        }
      });
    const newData = { ...this.state.data } as DataResponse;
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
      return <h1>Loading</h1>;
    }

    return (
      <>
        <header>
          <h1>Student Planning</h1>
        </header>
        <main>
          <div id='upper-left' />
          <div id='upper-right'>
            {
              this.state.data?.plan && <>
                {this._genYears()}
                <div id='ur-utils'>
                  <button>Student Notes</button>
                  {this.state.isFaculty && <button>Advisor Notes</button>}
                  <div id='ur-util-spacer' />
                  <button disabled={this.state.data!.plan!.yearCount >= 8} onClick={() => this._updateYearCount(1)}>+ Add Year</button>
                  <button disabled={this.state.data!.plan!.yearCount <= 4} onClick={() => this._updateYearCount(-1)}>- Remove Year</button>
                </div>
              </>
            }
            {
              !this.state.data?.plan && <div id='no-plan'>
                <h1>No plan exists :(</h1>
                <a onClick={async () => {
                  await plannerApi.createPlan();
                  window.location.reload();
                }}
                >Create a new plan.</a>
              </div>
            }
          </div>
          <div id='lower-left' />
          <div id='lower-right'>
            {this.state.data!.plan && <CourseTable courses={this.state.data!.catalog!.courses} />}
          </div>
        </main>
      </>
    );
  }
}