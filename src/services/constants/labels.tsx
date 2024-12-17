import { roleSchema } from '@services/types/Role';
import { selectionSchema } from '@services/types/tables/FilterExtension';

export const roles = [
  {
    id: roleSchema.Enum.ADMIN,
    label: 'Administrador',
  },
  {
    id: roleSchema.Enum.OPERATOR,
    label: 'Operador',
  },
];

export const selectionOptions = [
  {
    id: selectionSchema.Enum.SELECTED,
    label: 'Selecionados',
  },
  {
    id: selectionSchema.Enum.NOT_SELECTED,
    label: 'Não selecionados',
  },
];
