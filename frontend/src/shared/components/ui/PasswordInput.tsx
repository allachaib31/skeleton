import { forwardRef, useState } from 'react';
import { Input } from './Input';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = forwardRef<HTMLInputElement, any>((props, ref) => {
  const [show, setShow] = useState(false);

  return (
    <Input
      {...props}
      ref={ref}
      type={show ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="hover:text-primary transition-colors focus:outline-none"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} /> }
        </button>
      }
    />
  );
});

PasswordInput.displayName = 'PasswordInput';
