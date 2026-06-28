import React, { useEffect, useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ParticipantPicker from '../create-event/ParticipantPicker';
import { useOrganizationMembers } from '../../../hooks/useOrganizationMembers';
import { useCreatePoll } from '../../../hooks/usePollMutations';
import {
  datetimeLocalValueToUtcIso,
  utcIsoToDatetimeLocalValue,
} from '../../../utils/timezone';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional hand-off from CreateEventDialog's "Start a poll instead" action. */
  prefill?: {
    title?: string;
    participantIds?: string[];
    durationMinutes?: number;
  } | null;
}

interface OptionRow {
  key: string;
  startLocal: string; // datetime-local value, IST wall-clock
  endLocal: string;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

function defaultOptionRow(offsetHours = 1): OptionRow {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + offsetHours);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    key: Math.random().toString(36).slice(2),
    startLocal: utcIsoToDatetimeLocalValue(start.toISOString()),
    endLocal: utcIsoToDatetimeLocalValue(end.toISOString()),
  };
}

const CreatePollDialog: React.FC<Props> = ({ open, onClose, prefill }) => {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [duration, setDuration] = useState(30);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [options, setOptions] = useState<OptionRow[]>([defaultOptionRow(1), defaultOptionRow(25)]);
  const [error, setError] = useState('');

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers();
  const createPoll = useCreatePoll();

  useEffect(() => {
    if (open) {
      setTitle(prefill?.title ?? '');
      setAgenda('');
      setDuration(prefill?.durationMinutes ?? 30);
      setParticipantIds(prefill?.participantIds ?? []);
      setOptions([defaultOptionRow(1), defaultOptionRow(25)]);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const updateOption = (key: string, field: 'startLocal' | 'endLocal', value: string) => {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, [field]: value } : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    const last = options[options.length - 1];
    const lastStartUtc = last?.startLocal ? datetimeLocalValueToUtcIso(last.startLocal) : new Date().toISOString();
    const nextStart = new Date(new Date(lastStartUtc).getTime() + 24 * 60 * 60 * 1000);
    const nextEnd = new Date(nextStart.getTime() + duration * 60 * 1000);
    setOptions((prev) => [
      ...prev,
      {
        key: Math.random().toString(36).slice(2),
        startLocal: utcIsoToDatetimeLocalValue(nextStart.toISOString()),
        endLocal: utcIsoToDatetimeLocalValue(nextEnd.toISOString()),
      },
    ]);
  };

  const removeOption = (key: string) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((o) => o.key !== key));
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!duration || duration <= 0) {
      setError('Duration must be greater than 0');
      return false;
    }
    if (options.length < MIN_OPTIONS) {
      setError(`Provide at least ${MIN_OPTIONS} time options`);
      return false;
    }
    for (const opt of options) {
      if (!opt.startLocal || !opt.endLocal) {
        setError('Every option needs a start and end time');
        return false;
      }
      const startUtc = datetimeLocalValueToUtcIso(opt.startLocal);
      const endUtc = datetimeLocalValueToUtcIso(opt.endLocal);
      if (new Date(endUtc).getTime() <= new Date(startUtc).getTime()) {
        setError("Each option's end time must be after its start time");
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createPoll.mutateAsync({
        title: title.trim(),
        agenda: agenda.trim(),
        duration,
        participantIds,
        options: options.map((o) => ({
          startTime: datetimeLocalValueToUtcIso(o.startLocal),
          endTime: datetimeLocalValueToUtcIso(o.endLocal),
        })),
      });
      onClose();
    } catch {
      // useCreatePoll already toasts the error; keep the dialog open so
      // nothing entered is lost.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900">Create a meeting poll</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Sprint planning"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Agenda</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={2}
              placeholder="What's this meeting about?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400
                         outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 resize-none"
            />
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900
                         outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
            />
          </div>

          <ParticipantPicker
            members={members}
            isLoading={membersLoading}
            selectedIds={participantIds}
            onChange={setParticipantIds}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Proposed times <span className="text-gray-400 font-normal">(2–4 options)</span>
              </label>
              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  + Add option
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2">Times shown in IST (Asia/Kolkata)</p>

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={opt.key} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50/50">
                  <span className="text-xs font-medium text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                  <input
                    type="datetime-local"
                    value={opt.startLocal}
                    onChange={(e) => updateOption(opt.key, 'startLocal', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-900
                               outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  />
                  <span className="text-gray-400 text-xs flex-shrink-0">to</span>
                  <input
                    type="datetime-local"
                    value={opt.endLocal}
                    onChange={(e) => updateOption(opt.key, 'endLocal', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-900
                               outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  />
                  {options.length > MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.key)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      aria-label="Remove option"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createPoll.isPending}>
              Create poll
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollDialog;