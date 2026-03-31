import { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';

export const useAutosave = (
  value: any,
  save: (value: any) => Promise<any>,
  debounceTime: number = 1000
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useDebounce(
    () => {
      setDebouncedValue(value);
    },
    debounceTime,
    [value]
  );

  useEffect(() => {
    if (debouncedValue) {
      setIsSaving(true);
      save(debouncedValue).finally(() => {
        setIsSaving(false);
      });
    }
  }, [debouncedValue, save]);

  return { isSaving };
};