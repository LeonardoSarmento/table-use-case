import { faker } from '@faker-js/faker';
import { Filters, PaginatedData } from './types';
import { Task } from '@services/types/task';
import { priorities, statuses } from '@/constants/options';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 10;

export type TaskFilters = Filters<Task>;

function makeData(amount: number): Task[] {
  return Array(amount)
    .fill(0)
    .map((_, index) => {
      return {
        id: index + 1,
        label: faker.word.words(5),
        title: faker.word.words(5),
        priority: [faker.helpers.arrayElement(priorities).value],
        status: [faker.helpers.arrayElement(statuses).value],
      };
    });
}

const data = makeData(1000);

export async function fetchTasks(filtersAndPagination: TaskFilters): Promise<PaginatedData<Task>> {
  const { pageIndex = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, sortBy, ...filters } = filtersAndPagination;
  const requestedData = data.slice();

  if (sortBy) {
    const [field, order] = sortBy.split('.');
    requestedData.sort((a, b) => {
      const aValue = a[field as keyof Task];
      const bValue = b[field as keyof Task];

      if (aValue === bValue) return 0;
      if (order === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
  }

  const filteredData = requestedData.filter((task) => {
    return Object.keys(filters).every((key) => {
      const filter = filters[key as keyof Task];
      if (filter === undefined || filter === '') return true;

      const value = task[key as keyof Task];
      // Handle 'status' and 'priority' which are arrays
      if (key === 'status' || key === 'priority') {
        if (Array.isArray(filter)) {
          if (filter.length === 0) {
            // If filter array is empty, do not apply this filter
            return true;
          }

          // Check if task's value (which could be a single value or an array) is included in the filter array
          if (Array.isArray(value)) {
            return value.some((val) => filter.includes(val));
          }
          return filter.includes(value as string);
        }
        return false;
      }
      if (typeof value === 'string') {
        return value.toLowerCase().includes(`${filter}`.toLowerCase());
      }

      if (typeof value === 'number') {
        return value === +filter;
      }

      // If filter does not apply, return true by default (do not filter)
      return true;
    });
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    result: filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    rowCount: filteredData.length,
  };
}
