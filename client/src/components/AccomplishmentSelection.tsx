import { DataResponse } from '../../../server/typings/planner';
import { AccomplishmentId, PlanId } from '../../../server/typings/id';
import '../css/AccomplishmentSelection.css';

export default function AccomplishmentSelection({ selectedAccomplishments, allAccomplishments, onChange }: {
  selectedAccomplishments: Required<DataResponse>['plans'][PlanId]['majors'];
  allAccomplishments: Required<DataResponse>['catalog']['accomplishments']['majors'];
  onChange: (newSelection: Required<DataResponse>['plans'][PlanId]['majors']) => void;
}) {
  const selectionElems = Object.keys(selectedAccomplishments).map(acc => {
    const accomplishmentData = allAccomplishments[acc as AccomplishmentId];
    return <div className='selected-accomplishment' key={acc}>
      <p>{accomplishmentData.name}</p>
      <p className='acc-remove-button' role='button' onClick={() => {
        const dataCp = { ...selectedAccomplishments };
        delete dataCp[acc as AccomplishmentId];
        onChange(dataCp);
      }}
      >X</p>
    </div>;
  });

  const availableAccomplishmments = Object.values(allAccomplishments).filter(acc => !Object.keys(selectedAccomplishments).includes(acc.accomplishmentId));
  const availableAccomplishmentElem = availableAccomplishmments.map(acc => <option value={acc.accomplishmentId} key={acc.accomplishmentId}>{acc.name}</option>);
  return (
    <>
      <div className='acc-sel-section'>{selectionElems}</div>
      <select onChange={e => onChange({ ...selectedAccomplishments, [e.target.value]: allAccomplishments[e.target.value as AccomplishmentId].name })}>
        {availableAccomplishmentElem}
      </select>
    </>
  );
}