import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useJoinOrganization, useLeaveOrganization } from '../../hooks/useJoinOrganization';

const OrganizationSection: React.FC = () => {
  const { user } = useAuthStore();
  const [orgIdInput, setOrgIdInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const joinOrg = useJoinOrganization();
  const leaveOrg = useLeaveOrganization();

  const isInOrg = Boolean(user?.organizationId);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orgIdInput.trim();
    if (!trimmed) return;
    joinOrg.mutate(trimmed, {
      onSuccess: () => {
        setOrgIdInput('');
        setShowInput(false);
      },
    });
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
        Organization
      </p>

      {isInOrg ? (
        <div className="flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            In an organization
          </span>
          <button
            type="button"
            onClick={() => leaveOrg.mutate()}
            disabled={leaveOrg.isPending}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {leaveOrg.isPending ? 'Leaving…' : 'Leave'}
          </button>
        </div>
      ) : showInput ? (
        <form onSubmit={handleJoin} className="px-1 space-y-2">
          <input
            value={orgIdInput}
            onChange={(e) => setOrgIdInput(e.target.value)}
            placeholder="Paste organization ID"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400
                       outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={joinOrg.isPending || !orgIdInput.trim()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {joinOrg.isPending ? 'Joining…' : 'Join'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setOrgIdInput('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="w-full text-left px-1 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Join an organization
        </button>
      )}
    </div>
  );
};

export default OrganizationSection;