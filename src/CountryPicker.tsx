import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type CountryChoice = { readonly id: string; readonly name: string };

const CLEAR_CHOICE: CountryChoice = { id: '', name: 'Clear selection' };

/**
 * Fully themeable select-only combobox for the wide world map.
 * Focus stays on the trigger; keyboard arrows/typeahead explore options.
 * The compact map continues to use a native <select> for touch devices.
 */
export default function CountryPicker({
  options,
  value,
  onChange,
}: {
  options: readonly CountryChoice[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: '', at: 0 });
  const listId = 'lm-choices-' + useId().replace(/:/g, '');
  const choices = [CLEAR_CHOICE, ...options];
  const chosenIndex = Math.max(0, choices.findIndex(choice => choice.id === (value ?? '')));
  const label = value ? options.find(option => option.id === value)?.name ?? 'Explore countries' : 'Explore countries';

  function openMenu() {
    setActiveIndex(chosenIndex);
    setOpen(true);
  }

  function choose(id: string) {
    onChange(id || null);
    setOpen(false);
    typeahead.current.text = '';
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const list = listRef.current;
    const item = list.children.item(activeIndex) as HTMLElement | null;
    if (!item) return;
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [activeIndex, open]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        event.stopPropagation(); // Escape closes the menu without clearing map selection.
        setOpen(false);
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(choices[activeIndex].id);
      else openMenu();
      return;
    }

    const movement: Record<string, number> = {
      ArrowDown: 1, ArrowUp: -1,
      PageDown: 10, PageUp: -10,
    };
    if (event.key in movement || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const start = open ? activeIndex : chosenIndex;
      const next = event.key === 'Home' ? 0
        : event.key === 'End' ? choices.length - 1
        : Math.max(0, Math.min(choices.length - 1, start + movement[event.key]));
      setActiveIndex(next);
      setOpen(true);
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const now = Date.now();
      const term = event.key.toLocaleLowerCase('en');
      const previous = typeahead.current;
      const query = now - previous.at < 700 ? previous.text + term : term;
      let index = choices.findIndex(choice => choice.name.toLocaleLowerCase('en').startsWith(query));
      if (index < 0) index = choices.findIndex(choice => choice.name.toLocaleLowerCase('en').startsWith(term));
      typeahead.current = { text: index < 0 ? '' : query, at: now };
      if (index >= 0) {
        event.preventDefault();
        setActiveIndex(index);
        setOpen(true);
      }
    }
  }

  return (
    <div className="lm-country-picker lm-country-custom" ref={rootRef} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        className="lm-country-trigger"
        type="button"
        role="combobox"
        aria-label="Explore countries"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        title={label}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleKeyDown}
      >
        <span className="lm-country-trigger-label">{label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div ref={listRef} id={listId} className="lm-country-listbox" role="listbox" aria-label="Countries">
          {choices.map((choice, index) => (
            <div
              key={choice.id || '__clear__'}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={choice.id === (value ?? '')}
              className="lm-country-choice"
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(choice.id)}
            >
              <span>{choice.name}</span>
              {choice.id === (value ?? '') && <Check size={14} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
