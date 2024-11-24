import { faker } from '@faker-js/faker';
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@services/constants/tables';
import { roleSchema, RolesType } from '@services/types/Role';
import { Filters, PaginatedData } from '@services/types/tables/FilterExtension';
import { UserTableType } from '@services/types/tables/User';

export type UserFilters = Filters<UserTableType>;

function makeData(amount: number): UserTableType[] {
  return Array(amount)
    .fill(0)
    .map((_, index) => {
      return {
        id: index + 1,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        company: faker.company.name(),
        role: [faker.helpers.enumValue(roleSchema.enum)],
      };
    });
}

export const fakeUserData = makeData(1000);

export async function fetchUsers(filtersAndPagination: UserFilters): Promise<PaginatedData<UserTableType>> {
  const {
    pageIndex = DEFAULT_PAGE_INDEX,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy,
    selection,
    selectedIds,
    ...filters
  } = filtersAndPagination;
  let requestedData = fakeUserData.slice();

  if (selection) {
    requestedData = requestedData.filter((user) => {
      // Check if we need to include both 'SELECTED' and 'NOT_SELECTED'
      const isSelected = selection.includes('SELECTED'); // 'SELECTED' literal
      const isNotSelected = selection.includes('NOT_SELECTED'); // 'NOT_SELECTED' literal

      // Check if the user's ID is in the selectedIds array (which indicates whether the row is selected or not)
      const isUserSelected = user.id && selectedIds?.includes(user.id);

      // Behavior logic based on selection array:
      if (selection.length === 0) {
        // If the selection array is empty, return both selected and not selected rows
        return true;
      }
      if (isSelected && isUserSelected) {
        // If 'SELECTED' is in the selection and the user is selected, include this user
        return true;
      }
      if (isNotSelected && !isUserSelected) {
        // If 'NOT_SELECTED' is in the selection and the user is not selected, include this user
        return true;
      }
      // If none of the above conditions match, exclude this user
      return false;
    });
  }

  if (sortBy) {
    const [field, order] = sortBy.split('.');
    requestedData.sort((a, b) => {
      const aValue = a[field as keyof Omit<UserTableType, 'selectedIds'>];
      const bValue = b[field as keyof Omit<UserTableType, 'selectedIds'>];

      if (aValue === bValue) return 0;
      if (order === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
  }

  const filteredData = requestedData.filter((user) => {
    return Object.keys(filters).every((key) => {
      const filter = filters[key as keyof Omit<UserTableType, 'selectedIds'>];
      if (filter === undefined || filter === '') return true;

      const value = user[key as keyof Omit<UserTableType, 'selectedIds'>];

      if (key === 'role') {
        if (Array.isArray(filter)) {
          if (filter.length === 0) return true;
          return Array.isArray(value) ? value.some((val) => filter.includes(val)) : filter.includes(value as RolesType);
        }
        return false;
      }

      if (typeof value === 'string') return value.toLowerCase().includes(`${filter}`.toLowerCase());
      if (typeof value === 'number') return value === +filter;

      return true;
    });
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    result: filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    rowCount: filteredData.length,
  };
}
