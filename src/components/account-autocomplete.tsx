'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export interface AccountOption {
  code: string;
  label: string;
}

interface AccountAutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options: AccountOption[];
  className?: string;
}

export function AccountAutocomplete({
  value,
  onChange,
  options,
  className,
  ...props
}: AccountAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!value) return options;
    const cleanVal = value.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.code.toLowerCase().includes(cleanVal) ||
        opt.label.toLowerCase().includes(cleanVal)
    );
  }, [value, options]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredOptions.length === 0 ? 0 : (prev + 1) % filteredOptions.length
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredOptions.length === 0
            ? 0
            : (prev - 1 + filteredOptions.length) % filteredOptions.length
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].code);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        if (filteredOptions[highlightedIndex] && value !== filteredOptions[highlightedIndex].code) {
          onChange(filteredOptions[highlightedIndex].code);
        }
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeItem = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn('font-mono', className)}
        {...props}
      />
      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border/40 bg-background/95 backdrop-blur-md shadow-2xl p-1.5 scrollbar-thin scrollbar-thumb-muted"
          >
            {filteredOptions.map((option, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={option.code}
                  onClick={() => {
                    onChange(option.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex flex-col px-3 py-2 text-left rounded-lg cursor-pointer transition-colors select-none',
                    isHighlighted
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <span className="font-mono font-bold text-sm">{option.code}</span>
                  <span className={cn('text-xs font-semibold opacity-80', isHighlighted ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    {option.label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
