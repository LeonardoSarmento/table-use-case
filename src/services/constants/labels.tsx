import { roleSchema } from '@services/types/Role';
import { selectionSchema } from '@services/types/tables/FilterExtension';

export const roles = [
  {
    value: roleSchema.Enum.ADMIN,
    label: 'Administrador',
  },
  {
    value: roleSchema.Enum.OPERATOR,
    label: 'Operador',
  },
];

export const selection = [
  {
    value: selectionSchema.Enum.SELECTED,
    label: 'Selecionados',
  },
  {
    value: selectionSchema.Enum.NOT_SELECTED,
    label: 'Não selecionados',
  },
];
