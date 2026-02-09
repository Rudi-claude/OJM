'use client';

import { TeamMember } from '@/types';

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId: string;
}

function getInitial(nickname: string | null): string {
  if (!nickname) return '?';
  return nickname.charAt(0);
}

const AVATAR_COLORS = [
  'from-[#6B77E8] to-[#8B95FF]',
  'from-[#FF6B6B] to-[#FF8E8E]',
  'from-[#4ECDC4] to-[#7EDDD6]',
  'from-[#FFD93D] to-[#FFE580]',
  'from-[#6C5CE7] to-[#A29BFE]',
  'from-[#FF9A9E] to-[#FECFEF]',
  'from-[#00B894] to-[#55EFC4]',
  'from-[#E17055] to-[#FAB1A0]',
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function TeamMemberList({ members, currentUserId }: TeamMemberListProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1">
      {members.map((member, index) => {
        const isMe = member.userId === currentUserId;
        return (
          <div
            key={member.id}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white text-sm font-bold shadow-sm ${isMe ? 'ring-2 ring-[#6B77E8] ring-offset-1' : ''}`}>
              {getInitial(member.nickname)}
            </div>
            <span className={`text-[10px] max-w-[48px] truncate ${isMe ? 'text-[#6B77E8] font-bold' : 'text-gray-500'}`}>
              {member.nickname || '익명'}
              {isMe && ' (나)'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
