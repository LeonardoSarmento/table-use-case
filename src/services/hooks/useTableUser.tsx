import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { UserFilters } from '@services/types/tables/User';
import { fetchUsers } from '@/api/shadcn-user';

export const queryOptionsUserTable = (filters: UserFilters) => {
  return queryOptions({
    queryKey: ['user-table', filters],
    queryFn: () => fetchUsers(filters),
    placeholderData: keepPreviousData,
  });
};
