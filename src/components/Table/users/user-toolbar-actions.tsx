import { DataTableToolbarActionsProps } from '@services/types/tables/DataTableComponents';
import { useRouter } from '@tanstack/react-router';
import { ControlToolbar } from '../common/data-table-row-actions';
import { userTableRouteId } from './user-columns';
export function UserToolbarAction<TData>({ className, ...props }: DataTableToolbarActionsProps<TData>) {
  const router = useRouter();
  return (
    <ControlToolbar
      {...props}
      className={className}
      routeId={userTableRouteId}
      fileName="Users"
      actions={[
        {
          label: 'Criar',
          variant: 'default',
          onClick: () => router.navigate({ to: '/shadcnTable' }),
        },
        {
          dialogTitle: 'Deseja remover os registros de usuários?',
        },
        {
          label: 'Voltar',
          variant: 'outline',
          onClick: () => router.navigate({ to: '/' }),
        },
      ]}
    />
  );
}
