import { toggleFavourite } from '@/app/(app)/actions';

export function FavouriteButton({ table, id, current, name }: { table: 'universities' | 'professors' | 'research_groups'; id: string; current: boolean | null | undefined; name: string }) {
  const on = Boolean(current);
  return (
    <form action={toggleFavourite}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="current" value={String(on)} />
      <button type="submit" className={`btn btn-sm ${on ? 'btn-primary' : ''}`} aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${name} ${on ? 'from' : 'to'} favourites`}>
        {on ? '★ Remove from favourites' : '☆ Add to favourites'}
      </button>
    </form>
  );
}

export function SelectForm({
  action,
  id,
  options,
  current,
  field = 'status',
  label,
  button = 'Update',
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  options: readonly string[];
  current: string | null | undefined;
  field?: string;
  label: string;
  button?: string;
}) {
  return (
    <form action={action} className="row" style={{ flexWrap: 'nowrap' }}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`${field}-${id}`} className="sr-only">
        {label}
      </label>
      <select id={`${field}-${id}`} name={field} defaultValue={current ?? options[0]} style={{ minWidth: 130 }}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-sm">
        {button}
      </button>
    </form>
  );
}
