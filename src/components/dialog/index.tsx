import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DeleteIcon } from 'lucide-react';

type DialogType = {
  title: string;
  description?: string;
  buttonText?: string;
  mutate?: () => void;
  buttonType?: 'rowAction' | 'button';
} & React.HTMLAttributes<HTMLButtonElement>;
export function DialogComponent({ title, buttonText, mutate, buttonType = 'button', ...props }: DialogType) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonType === 'rowAction' ? 'outline' : 'destructive'} {...props}>
          {buttonType === 'rowAction' ? <DeleteIcon /> : buttonText ? buttonText : 'Deletar'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Após excluir os registros selecionados, não é possível recuperar esses registros.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={mutate} variant="destructive">
            Deletar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
