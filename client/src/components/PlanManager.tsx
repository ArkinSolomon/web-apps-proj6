import { useRef, useState } from 'react';
import { DataResponse } from '../../../server/typings/planner';
import plannerApi from '../api/plannerApi';
import { AccomplishmentId, PlanId } from '../../../server/typings/id';
import AccomplishmentSelection from './AccomplishmentSelection';
import '../css/PlanManager.css';

export default function PlanManager({ availableCatalogs, currentPlan, plans, accomplishments }: {
  availableCatalogs: DataResponse['availableCatalogs'];
  currentPlan?: DataResponse['plan'];
  plans: DataResponse['plans'];
  accomplishments?: Required<DataResponse>['catalog']['accomplishments'];
}) {
  availableCatalogs = [...availableCatalogs].sort();

  const [selectedPlanId, setSelectedPlanId] = useState(currentPlan?.planId);
  const [newName, setNewName] = useState(currentPlan?.planName ?? '');

  const currentPlanData = currentPlan ? plans[currentPlan.planId] : { majors: {}, minors: {} };
  const initialMajors = Object.keys(currentPlanData.majors).join();
  const initialMinors = Object.keys(currentPlanData.minors).join();
  const [currentMajors, setCurrentMajors] = useState(currentPlanData.majors);
  const [currentMinors, setCurrentMinors] = useState(currentPlanData.minors);

  const yearSelRef = useRef<HTMLSelectElement>(null);
  const [disableSubmissions, setDisableSubmissions] = useState(false);

  let availableCatalogOpts = availableCatalogs.map(catYear => <option value={catYear} key={catYear}>{catYear}</option>);
  let hasNoYears = false;
  if (!availableCatalogOpts.length) {
    hasNoYears = true;
    availableCatalogOpts = [<option disabled selected key='none'>No catalogs available</option>];
  }

  let userPlans = Object.values(plans).map(plan => <option value={plan.planId} key={plan.planId}>{plan.planName}</option>);
  let hasNoPlans = false;
  if (!userPlans.length) {
    hasNoPlans = true;
    userPlans = [<option disabled selected key='none'>No plans</option>];
  }
    
  return (
    <>
      <h2>Modify current plan ({currentPlan?.planName ?? 'No Plan'})</h2>
      {currentPlan && <p>Catalog year: {currentPlan!.catalogYear}</p>}
      <div>
        <h3>Load Different Plan</h3>
        <select onChange={e => setSelectedPlanId(e.target.value as PlanId)} value={selectedPlanId} disabled={hasNoPlans} id='plan-change' key='plan-change' name='plan-change'>
          {userPlans}
        </select>
        <button
          onClick={async () => {
            try {
              setDisableSubmissions(true);
              await plannerApi.loadPlan(selectedPlanId!); 
              window.location.reload();
            } finally {
              setDisableSubmissions(false);
            }
          }}
          disabled={disableSubmissions || hasNoPlans || selectedPlanId === currentPlan?.planId}
        >Load plan</button>
      </div>
      {
        plans && currentPlan && <div>
          <h3>Add new majors or minors</h3>
          <div id='acc-add-section'>
            <div className='acc-half'>
              <AccomplishmentSelection accomplishmentAddText='Add a major' selectedAccomplishments={currentMajors} allAccomplishments={accomplishments!.majors} onChange={acc => setCurrentMajors(acc)} />
            </div>
            <div className='acc-half'>
              <AccomplishmentSelection accomplishmentAddText='Add a minor' selectedAccomplishments={currentMinors} allAccomplishments={accomplishments!.minors} onChange={acc => setCurrentMinors(acc)} />
            </div>
          </div>
          <label htmlFor='plan-name-change'>Change name: </label>
          <input type='text' name='plan-name-change' placeholder='New Plan Name' value={newName} onChange={e => setNewName(e.target.value)} />
          <button
            onClick={async () => {
              try {
                setDisableSubmissions(true);
                await plannerApi.updatePlanData(currentPlan!.planId, newName, Object.keys(currentMajors) as AccomplishmentId[], Object.keys(currentMinors) as AccomplishmentId[]);
                window.location.reload();
              } finally {
                setDisableSubmissions(false);
              }
            }}
            disabled={disableSubmissions || (newName === currentPlan.planName && Object.keys(currentMajors).join() === initialMajors && Object.keys(currentMinors).join() === initialMinors)}
          >Update plan</button>
        </div>
      }
      <div>
        <h3>Create new plan</h3>
        <select ref={yearSelRef} disabled={hasNoYears} defaultValue={availableCatalogs[availableCatalogs.length - 1]} id='cat-year-sel' key='cat-year-sel' name='cat-year-sel'>
          {availableCatalogOpts}
        </select>
        <button
          onClick={async () => {
            try {
              setDisableSubmissions(true);
              await plannerApi.createPlan(~~(yearSelRef.current?.value ?? 0));
              window.location.reload();
            } finally {
              setDisableSubmissions(false);
            }
          }}
          disabled={disableSubmissions || hasNoYears}
        >Create new plan</button>
      </div>
    </>
  );
}