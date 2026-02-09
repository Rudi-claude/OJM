'use client';

import type { MealLog } from '@/types';

interface MealHistoryProps {
  mealLogs: MealLog[];
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDays(): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ...
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7)); // 이번 주 월요일
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

// 카테고리별 이모지
function getCategoryEmoji(category: string): string {
  if (category.includes('한식')) return '🍚';
  if (category.includes('중식') || category.includes('중국')) return '🥟';
  if (category.includes('일식') || category.includes('일본')) return '🍣';
  if (category.includes('양식') || category.includes('이탈리')) return '🍝';
  if (category.includes('분식')) return '🍜';
  if (category.includes('치킨')) return '🍗';
  if (category.includes('피자')) return '🍕';
  if (category.includes('버거') || category.includes('햄버거')) return '🍔';
  if (category.includes('카페') || category.includes('디저트')) return '☕';
  if (category.includes('베트남') || category.includes('아시안')) return '🍜';
  if (category.includes('고기') || category.includes('구이')) return '🥩';
  if (category.includes('해물') || category.includes('해산물')) return '🦐';
  return '🍽️';
}

export default function MealHistory({ mealLogs }: MealHistoryProps) {
  const weekDays = getWeekDays();
  const today = new Date();

  // 요일별 식사 기록 매핑
  const logsByDay = weekDays.map(day => ({
    date: day,
    dayName: DAY_NAMES[day.getDay()],
    logs: mealLogs.filter(log => isSameDay(new Date(log.ateAt), day)),
  }));

  // 이번 주 월~일 범위 텍스트
  const startStr = `${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()}`;
  const endStr = `${weekDays[6].getMonth() + 1}/${weekDays[6].getDate()}`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">이번 주 식사내역</h3>
        <span className="text-xs text-gray-400">{startStr} ~ {endStr}</span>
      </div>

      <div className="space-y-2">
        {logsByDay.map(({ date, dayName, logs }) => {
          const todayFlag = isToday(date);
          const isPast = date < today && !todayFlag;
          const isFuture = date > today && !todayFlag;
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

          return (
            <div
              key={date.toISOString()}
              className={`rounded-xl border p-3 transition-all ${
                todayFlag
                  ? 'bg-[#F5F6FF] border-[#6B77E8]/30 shadow-sm'
                  : isFuture
                  ? 'bg-gray-50/50 border-gray-100'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 요일 */}
                <div className={`w-10 text-center flex-shrink-0 ${
                  todayFlag ? 'text-[#6B77E8]' : dayName === '토' ? 'text-blue-400' : dayName === '일' ? 'text-red-400' : 'text-gray-500'
                }`}>
                  <div className={`text-lg font-bold ${todayFlag ? '' : ''}`}>{dayName}</div>
                  <div className="text-[10px]">{dateStr}</div>
                </div>

                <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

                {/* 식사 기록 */}
                <div className="flex-1 min-w-0">
                  {logs.length > 0 ? (
                    <div className="space-y-1">
                      {logs.map(log => (
                        <div key={log.id} className="flex items-center gap-2">
                          <span className="text-base flex-shrink-0">{getCategoryEmoji(log.category)}</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{log.restaurantName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">
                            {log.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={`text-xs ${isFuture ? 'text-gray-300' : todayFlag ? 'text-[#6B77E8]/50' : 'text-gray-300'}`}>
                      {isFuture ? '-' : todayFlag ? '아직 기록이 없어요' : '기록 없음'}
                    </span>
                  )}
                </div>

                {/* 오늘 표시 */}
                {todayFlag && (
                  <span className="text-[10px] font-bold text-[#6B77E8] bg-[#6B77E8]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    오늘
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 통계 */}
      {mealLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400 mb-2">이번 주 요약</p>
          <div className="flex gap-3">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-[#6B77E8]">
                {logsByDay.filter(d => d.logs.length > 0).length}
              </div>
              <div className="text-[10px] text-gray-400">기록한 날</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-[#6B77E8]">
                {mealLogs.filter(l => {
                  const d = new Date(l.ateAt);
                  return d >= weekDays[0] && d <= new Date(weekDays[6].getTime() + 86400000);
                }).length}
              </div>
              <div className="text-[10px] text-gray-400">총 식사</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-[#6B77E8]">
                {(() => {
                  const cats = new Set(mealLogs
                    .filter(l => {
                      const d = new Date(l.ateAt);
                      return d >= weekDays[0] && d <= new Date(weekDays[6].getTime() + 86400000);
                    })
                    .map(l => l.category));
                  return cats.size;
                })()}
              </div>
              <div className="text-[10px] text-gray-400">메뉴 종류</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
