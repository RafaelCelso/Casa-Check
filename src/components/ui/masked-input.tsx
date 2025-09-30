"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MaskedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  mask?: string;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onChange, value, ...props }, ref) => {
    const [maskedValue, setMaskedValue] = React.useState(value || "");

    const applyMask = (inputValue: string, maskPattern: string) => {
      if (!maskPattern) return inputValue;

      // Remove todos os caracteres não numéricos
      const numbers = inputValue.replace(/\D/g, "");

      // Aplica a máscara para telefone brasileiro
      if (maskPattern === "(99) 99999-9999") {
        let formatted = numbers;
        if (numbers.length >= 1) {
          formatted = `(${numbers.slice(0, 2)}`;
        }
        if (numbers.length >= 3) {
          formatted += `) ${numbers.slice(2, 7)}`;
        }
        if (numbers.length >= 8) {
          formatted += `-${numbers.slice(7, 11)}`;
        }
        return formatted;
      }

      return inputValue;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (mask) {
        const masked = applyMask(inputValue, mask);
        setMaskedValue(masked);

        // Cria um evento sintético com o valor mascarado
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: masked,
          },
        };
        onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      } else {
        setMaskedValue(inputValue);
        onChange?.(e);
      }
    };

    React.useEffect(() => {
      if (value !== undefined) {
        setMaskedValue(mask ? applyMask(String(value), mask) : String(value));
      }
    }, [value, mask]);

    return (
      <input
        {...props}
        ref={ref}
        value={maskedValue}
        onChange={handleChange}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
