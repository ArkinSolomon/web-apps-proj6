type Distinct<T, DistinctName> = T & { __TYPE__: DistinctName; };

export type CourseId = Distinct<string, 'CourseId'>;
export type UserId = Distinct<string, 'UserId'>;
export type PlanId = Distinct<string, 'PlanId'>;
export type AccomplishmentId = Distinct<string, 'AccomplishmentId'>;