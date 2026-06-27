import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { OrgMember } from '../../../types/auth.types';

interface Props {
  members: OrgMember[];
  isLoading: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const ParticipantPicker: React.FC<Props> = ({ members, isLoading, selectedIds, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.includes(m._id)),
    [members, selectedIds]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !selectedIds.includes(m._id))
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, selectedIds, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addMember = (id: string) => {
    onChange([...selectedIds, id]);
    setQuery('');
  };

  const removeMember = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Participants</label>

      <div ref={containerRef} className="relative">
        <div
          className="min-h-[42px] w-full border border-gray-300 rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 items-center
                     focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150 bg-white cursor-text"
          onClick={() => setOpen(true)}
        >
          {selectedMembers.map((m) => (
            <span
              key={m._id}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium pl-1 pr-2 py-1 rounded-full"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] flex-shrink-0">
                {initialsOf(m.name)}
              </span>
              {m.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMember(m._id);
                }}
                className="text-blue-400 hover:text-blue-700 flex-shrink-0"
                aria-label={`Remove ${m.name}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selectedMembers.length ? '' : 'Search people to invite'}
            className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 placeholder-gray-400 py-0.5 bg-transparent"
          />
        </div>

        {open && (
          <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            {isLoading ? (
              <p className="px-3 py-2 text-sm text-gray-400">Loading organization members…</p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">
                {members.length === 0 ? 'No organization members found' : 'No matches'}
              </p>
            ) : (
              filteredOptions.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => addMember(m._id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {initialsOf(m.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-800 truncate">{m.name}</span>
                    <span className="block text-xs text-gray-400 truncate">{m.email}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantPicker;