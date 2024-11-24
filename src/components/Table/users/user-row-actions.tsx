import { DialogComponent } from '@components/dialog';
import { Button } from '@components/ui/button';
import { DataTableRowActionsProps } from '@services/types/tables/DataTableComponents';
import { UserTable } from '@services/types/tables/User';
import { useRouter } from '@tanstack/react-router';
import { EditIcon } from 'lucide-react';
export function UserButtonAction<TData>({ row }: DataTableRowActionsProps<TData>) {
  const user = UserTable.parse(row.original);
  const router = useRouter();
  return (
    <div className="flex justify-center gap-3">
      <Button
        onClick={() =>
          router.navigate({
            to: '/shadcnTable',
          })
        }
        variant="outline"
      >
        <EditIcon />
      </Button>
      <DialogComponent buttonType="rowAction" title={`Deseja remover o usuário ${user.name}?`} />
    </div>
  );
}
