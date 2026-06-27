import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ParticipantPicker from './ParticipantPicker';
import ConflictPanel from './ConflictPanel';
import AvailabilityPanel from './AvailabilityPanel';
import { useOrganizationMembers } from '../../../hooks/useOrganizationMembers';
import { useCreateEvent } from '../../../hooks/useCreateEvent';
import { userService } from '../../../services/user.service';
import { eventService } from '../../../services/event.service';
import {
  datetimeLocalValueToUtcIso,
  utcIsoToDatetimeLocalValue,
} from '../../../utils/timezone';
import type { OrgMember } from '../../../types/auth.types';
import type {
  AvailabilitySlot,
  CreateEventPayload,
  EventType,
  Priority,
  Visibility,
} from '../../../types/event.types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional pre-fill, e.g. when the dialog is opened from clicking a date cell. */
  initialDate?: Date | null;
}

type Step = 'form' | 'conflict' | 'availability';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'personal', label: 'Personal' },
  { value: 'goal', label: 'Goal' },
  { value: 'holiday', label: 'Holiday' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function defaultStartIso(initialDate?: Date | null): string {
  const base = initialDate ? new Date(initialDate) : new Date();
  base.setMinutes(0, 0, 0);
  base.setHours(base.getHours() + 1);
  return base.toISOString();
}

function plusOneHour(isoUtc: string): string {
  return new Date(new Date(isoUtc).getTime() + 60 * 60 * 1000).toISOString();
}

const initialFormState = (initialDate?: Date | null) => {
  const startUtc = defaultStartIso(initialDate);
  const endUtc = plusOneHour(startUtc);
  return {
    title: '',
    description: '',
    location: '',
    eventType: 'meeting' as EventType,
    priority: 'medium' as Priority,
    visibility: 'private' as Visibility,
    protectedPersonal: false,
    startTime: utcIsoToDatetimeLocalValue(startUtc),
    endTime: utcIsoToDatetimeLocalValue(endUtc),
    participantIds: [] as string[],
  };
};

const CreateEventDialog: React.FC<Props> = ({ open, onClose, initialDate }) => {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState(initialFormState(initialDate));
  const [formError, setFormError] = useState('');

  const [conflictIds, setConflictIds] = useState<string[]>([]);
  const [conflictedUsers, setConflictedUsers] = useState<OrgMember[]>([]);
  const [isResolvingNames, setIsResolvingNames] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers();
  const createEvent = useCreateEvent();

  // Reset the whole dialog state whenever it's freshly opened.
  useEffect(() => {
    if (open) {
      setStep('form');
      setForm(initialFormState(initialDate));
      setFormError('');
      setConflictIds([]);
      setConflictedUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape, matching EventDetailModal/SideDrawer conventions.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const startUtc = useMemo(
    () => (form.startTime ? datetimeLocalValueToUtcIso(form.startTime) : ''),
    [form.startTime]
  );
  const endUtc = useMemo(
    () => (form.endTime ? datetimeLocalValueToUtcIso(form.endTime) : ''),
    [form.endTime]
  );
  const durationMinutes = useMemo(() => {
    if (!startUtc || !endUtc) return 0;
    return Math.round((new Date(endUtc).getTime() - new Date(startUtc).getTime()) / 60000);
  }, [startUtc, endUtc]);

  if (!open) return null;

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (overrideStartUtc?: string, overrideEndUtc?: string): CreateEventPayload => ({
    title: form.title.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    eventType: form.eventType,
    priority: form.priority,
    visibility: form.visibility,
    startTime: overrideStartUtc ?? startUtc,
    endTime: overrideEndUtc ?? endUtc,
    protectedPersonal: form.eventType === 'personal' ? form.protectedPersonal : false,
    participantIds: form.participantIds,
  });

  const validate = (): boolean => {
    if (!form.title.trim()) {
      setFormError('Title is required');
      return false;
    }
    if (!startUtc || !endUtc) {
      setFormError('Start and end time are required');
      return false;
    }
    if (new Date(endUtc).getTime() <= new Date(startUtc).getTime()) {
      setFormError('End time must be after start time');
      return false;
    }
    setFormError('');
    return true;
  };

  const finalizeCreate = async (overrideStartUtc?: string, overrideEndUtc?: string) => {
    try {
      await createEvent.mutateAsync(buildPayload(overrideStartUtc, overrideEndUtc));
      onClose();
    } catch {
      // useCreateEvent already surfaces a toast on error; keep the dialog
      // open (likely on the conflict/availability step) so nothing is lost.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // No participants → nothing to check conflicts against, create directly.
    if (form.participantIds.length === 0) {
      await finalizeCreate();
      return;
    }

    setIsCheckingConflict(true);
    try {
      const { conflicts } = await eventService.checkConflict(form.participantIds, startUtc, endUtc);
      if (conflicts.length === 0) {
        await finalizeCreate();
        return;
      }

      // Conflicts found — resolve names via GET /users/:id and show the panel.
      setConflictIds(conflicts);
      setStep('conflict');
      setIsResolvingNames(true);
      try {
        const resolved = await userService.getUsers(conflicts);
        setConflictedUsers(resolved);
      } finally {
        setIsResolvingNames(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.message || 'Could not check availability');
      } else {
        setFormError('Something went wrong checking availability');
      }
    } finally {
      setIsCheckingConflict(false);
    }
  };

  const handleSelectAvailabilitySlot = async (slot: AvailabilitySlot) => {
    await finalizeCreate(slot.start, slot.end);
  };

  const handleStartPollStub = () => {
    // Meeting Polls are a separate feature (see PRD §5.5) — this is a
    // hand-off stub only. It preserves the title/participants/duration
    // so a future Poll-creation dialog can pre-fill from them.
    onClose();
    // eslint-disable-next-line no-console
    console.log('TODO: open Create Poll dialog, pre-filled with:', {
      title: form.title,
      participantIds: form.participantIds,
      duration: durationMinutes,
    });
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900">
            {step === 'form' && 'Create event'}
            {step === 'conflict' && 'Scheduling conflict'}
            {step === 'availability' && 'Find availability'}
          </h2>
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

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <Input
              label="Title"
              placeholder="Add a title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
              />
              <Input
                label="End"
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 -mt-2">Times shown in IST (Asia/Kolkata)</p>

            <Input
              label="Location"
              placeholder="Add location"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                placeholder="Add description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400
                           outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event type</label>
                <select
                  value={form.eventType}
                  onChange={(e) => setField('eventType', e.target.value as EventType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900
                             outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 bg-white"
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setField('priority', e.target.value as Priority)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900
                             outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 bg-white"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
              <div className="flex gap-2">
                {(['private', 'organization'] as Visibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setField('visibility', v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize
                      ${form.visibility === v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Commitment Protection — only relevant for personal events, per PRD §5.3 */}
            {form.eventType === 'personal' && (
              <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.protectedPersonal}
                  onChange={(e) => setField('protectedPersonal', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    Prioritize this personal commitment
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    This time slot will be marked Busy. Future meeting organizers will see you as
                    unavailable, and professional meetings scheduled over it will trigger a conflict warning.
                  </span>
                </span>
              </label>
            )}

            <ParticipantPicker
              members={members}
              isLoading={membersLoading}
              selectedIds={form.participantIds}
              onChange={(ids) => setField('participantIds', ids)}
            />

            {formError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={isCheckingConflict || createEvent.isPending}>
                {isCheckingConflict ? 'Checking availability…' : 'Add event'}
              </Button>
            </div>
          </form>
        )}

        {step === 'conflict' && (
          <ConflictPanel
            conflictedUsers={conflictedUsers}
            conflictedCount={conflictIds.length}
            isResolvingNames={isResolvingNames}
            isSubmitting={createEvent.isPending}
            onSendAnyway={() => finalizeCreate()}
            onFindAvailability={() => setStep('availability')}
            onStartPoll={handleStartPollStub}
            onBack={() => setStep('form')}
          />
        )}

        {step === 'availability' && (
          <AvailabilityPanel
            participantIds={form.participantIds}
            initialWindowStartUtc={startUtc}
            initialWindowEndUtc={endUtc}
            durationMinutes={durationMinutes}
            onSelectSlot={handleSelectAvailabilitySlot}
            onBack={() => setStep('conflict')}
          />
        )}
      </div>
    </div>
  );
};

export default CreateEventDialog;