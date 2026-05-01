export const STORAGE_KEY = 'insight-rides-data-v1';
export const QUEUE_KEY = 'insight-rides-offline-queue-v1';

export const emptyData = {
  students: [],
  trips: [],
  expenses: [],
  incomes: [],
  routes: [],
  vehicles: [],
  payments: [],
  meta: {
    lastSync: null,
    businessName: 'Insight Rides',
  },
};

export const expenseCategories = ['Fuel', 'Maintenance', 'Tyres', 'Service costs', 'Fines', 'Miscellaneous'];
export const incomeSources = ['Student fees', 'Extra trips', 'Occasional rides'];
export const paymentStatuses = ['Paid', 'Unpaid', 'Partial'];
export const tripTimes = ['morning', 'afternoon', 'extra trip'];
