import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';

interface SearchInputProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  debounceMs?: number;
}

export function SearchInput({ 
  onSearch, 
  placeholder, 
  defaultValue = "",
  debounceMs = 300 
}: SearchInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, onSearch, debounceMs]);

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder ?? t('common.search')}
      leftIcon={<Search size={18} />}
      rightIcon={
        value ? (
          <button onClick={() => setValue('')} className="hover:text-primary">
            <X size={18} />
          </button>
        ) : undefined
      }
    />
  );
}
