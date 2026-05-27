import React, { useState } from 'react';
import { Macro } from '../types';
import { LucideIcon } from './LucideIcon';

interface MacroCardProps {
  macro: Macro;
  onEdit: (macro: Macro) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string, newCategoryId: string) => void;
  onTogglePin?: (id: string) => void;
  categories: { id: string; name: string }[];
  currentCategoryId: string;
}

export const MacroCard: React.FC<MacroCardProps> = ({
  macro,
  onEdit,
  onDelete,
  onMove,
  onTogglePin,
  categories,
  currentCategoryId,
}) => {
  const [copiedEntire, setCopiedEntire] = useState(false);
  const [copiedLineIndex, setCopiedLineIndex] = useState<number | null>(null);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  // Directly adjusted font sizes for the optimal contrast and visual feedback
  const bodyTextClass = 'text-[16px]';
  const titleTextClass = 'text-[20px] font-bold';
  const descTextClass = 'text-[16px]';

  const lines = macro.content.split('\n');
  const lineCount = lines.length;
  const isLineCountExceeded = lineCount > 15;

  // Validate each line (max 180 characters)
  const lineValidations = lines.map((line) => {
    return {
      text: line,
      length: line.length,
      isValid: line.length <= 180
    };
  });

  const hasAnyLineExceeded = lineValidations.some((val) => !val.isValid);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyEntire = () => {
    copyToClipboard(macro.content);
    setCopiedEntire(true);
    setTimeout(() => setCopiedEntire(false), 2000);
  };

  const handleCopyLine = (lineText: string, index: number) => {
    copyToClipboard(lineText);
    setCopiedLineIndex(index);
    setTimeout(() => setCopiedLineIndex(null), 1500);
  };

  // Color mappings for macro borders & headers (Editorial Style)
  const colorMap = {
    gold: {
      border: 'border-[#b58e3d] hover:border-[#96742d]',
      headerBg: 'bg-[#FDFBF7] text-[#8c6717] border-[#e2d5bd]',
      badge: 'bg-[#FAF6ED] text-[#96742d] border-[#ebdcb3]'
    },
    blue: {
      border: 'border-[#426a8c] hover:border-[#2f5170]',
      headerBg: 'bg-[#F5F8FA] text-[#2c4e6e] border-[#d8e4ee]',
      badge: 'bg-[#EFF4F8] text-[#345d82] border-[#ccdbe9]'
    },
    green: {
      border: 'border-[#3f7354] hover:border-[#2b543b]',
      headerBg: 'bg-[#F4F9F5] text-[#265737] border-[#d5ebd9]',
      badge: 'bg-[#EEF6F0] text-[#2e6942] border-[#cbe5cf]'
    },
    purple: {
      border: 'border-[#6c4885] hover:border-[#523366]',
      headerBg: 'bg-[#FAF5FB] text-[#552d6e] border-[#ebd4f5]',
      badge: 'bg-[#F5ECF8] text-[#633282] border-[#e3caee]'
    },
    rose: {
      border: 'border-[#ab4656] hover:border-[#8c3241]',
      headerBg: 'bg-[#FCF5F6] text-[#8f2838] border-[#f5d8dc]',
      badge: 'bg-[#F9ECEE] text-[#9c2b3d] border-[#f0cbd0]'
    },
    slate: {
      border: 'border-[#1A1A1A] hover:border-[#2D2D2A]',
      headerBg: 'bg-[#FAF9F5] text-[#1A1A1A] border-[#D1CEC7]',
      badge: 'bg-[#F0EEEA] text-[#2D2D2A] border-[#D1CEC7]'
    }
  };

  const activeColor = colorMap[macro.color] || colorMap.slate;

  return (
    <div
      id={`macro-card-${macro.id}`}
      className={`group relative flex flex-col rounded-lg border bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
        macro.isPinned
          ? 'border-[#cfa752] ring-1 ring-[#ebdcb3]/60 bg-[#FDFBF7] shadow-md'
          : activeColor.border
      }`}
    >
      {/* Top Header Card Panel with metallic background */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        macro.isPinned 
          ? 'bg-[#FAF6ED]/95 text-[#8c6717] border-[#ebdcb3]' 
          : activeColor.headerBg
      }`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`p-1.5 rounded-md border shrink-0 ${
            macro.isPinned 
              ? 'bg-[#FCF9F1] text-[#96742d] border-[#ebdcb3]' 
              : activeColor.badge
          }`}>
            <LucideIcon name={macro.icon} size={16} />
          </div>
          <div className="min-w-0">
            <h4 className={`font-serif text-[#1A1A1A] leading-tight tracking-tight flex items-center gap-1 ${titleTextClass}`}>
              {macro.title}
              {macro.isPinned && (
                <span className="text-[10px] text-[#8c6717] font-mono shrink-0 select-none">
                  ★
                </span>
              )}
            </h4>
            {macro.description && (
              <p className={`text-[#555552] mt-0.5 line-clamp-1 ${descTextClass}`}>
                {macro.description}
              </p>
            )}
          </div>
        </div>

        {/* FF14 Style Limit Counters & Pin/Favorite Button */}
        <div className="flex items-center gap-2 shrink-0">
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(macro.id);
              }}
              className={`p-1 rounded transition-colors duration-155 cursor-pointer ${
                macro.isPinned
                  ? 'text-[#8c6717] hover:bg-stone-100/40 bg-[#FAF2E1]/80 border border-[#ebdcb3]/60'
                  : 'text-stone-300 hover:text-stone-600 hover:bg-stone-100'
              }`}
              title={macro.isPinned ? '取消收藏置頂' : '加入收藏置頂'}
            >
              <LucideIcon
                name="star"
                className={macro.isPinned ? 'fill-amber-400 text-amber-500' : ''}
                size={14}
              />
            </button>
          )}

          <span
            className={`text-[13px] font-mono px-2 py-0.5 rounded border ${
              isLineCountExceeded
                ? 'bg-rose-550/10 text-rose-800 border-rose-300'
                : 'bg-[#F4F2EC] text-stone-600 border-[#D1CEC7]'
            }`}
          >
            {lineCount}/15 行
          </span>
          {hasAnyLineExceeded && (
            <span className="flex items-center gap-1 text-[13px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 border border-amber-300">
              <LucideIcon name="alert" size={11} />
              字數超限
            </span>
          )}
        </div>
      </div>

      {/* Warnings block */}
      {(isLineCountExceeded || hasAnyLineExceeded) && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs flex flex-col gap-1 text-rose-900 font-sans">
          {isLineCountExceeded && (
            <div className="flex items-center gap-1.5">
              <LucideIcon name="alert" size={12} className="text-rose-700" />
              <span>FF14 遊戲內巨集限制最多 15 行，目前有 {lineCount} 行。超出部分將無法執行！</span>
            </div>
          )}
          {hasAnyLineExceeded && (
            <div className="flex items-center gap-1.5">
              <LucideIcon name="alert" size={12} className="text-rose-700" />
              <span>部分行數超過 180 個字元（含空白與中文標點），遊戲內將被截斷！</span>
            </div>
          )}
        </div>
      )}

      {/* Main Body with macro lines */}
      <div className="p-3 bg-white grow flex flex-col">
        {/* Interactive line lists */}
        <div className="space-y-1 grow max-h-[280px] overflow-y-auto custom-scrollbar bg-[#FDFBF7] rounded-md p-2 border border-[#E6E3DC]">
          {lineValidations.map((line, idx) => {
            const lineNum = idx + 1;
            const isLineTooLong = !line.isValid;
            const isPastLimit = lineNum > 15;

            return (
              <div
                key={idx}
                onClick={() => handleCopyLine(line.text, idx)}
                className={`relative group/line flex items-center justify-between font-mono rounded-md px-2 py-1.5 cursor-pointer transition-all ${
                  isPastLimit
                    ? 'bg-rose-50/40 text-rose-900/40 border border-dashed border-rose-205/30 line-through'
                    : isLineTooLong
                    ? 'bg-rose-50 border border-rose-300 text-rose-950 hover:bg-rose-100/60'
                    : 'bg-[#FAF9F5]/80 text-[#2D2D2A] hover:bg-stone-100 border border-[#E6E3DC]/30 hover:border-[#D1CEC7]'
                }`}
                title="點擊單獨複製此行（適合節奏演戲）"
              >
                <div className="flex items-center gap-2 mr-3 truncate grow">
                  <span className={`text-[12px] select-none font-semibold ${
                    isPastLimit ? 'text-rose-300' : isLineTooLong ? 'text-rose-600' : 'text-stone-400'
                  }`}>
                    {String(lineNum).padStart(2, '0')}
                  </span>
                  <span className={`truncate whitespace-pre-wrap font-mono font-medium ${bodyTextClass}`}>{line.text || ' '}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] ${
                      isLineTooLong ? 'text-rose-700 font-bold' : 'text-stone-400 group-hover/line:text-stone-600'
                    }`}
                  >
                    {line.length}/180
                  </span>
                  <div className="w-5 h-5 flex items-center justify-center rounded bg-stone-100 group-hover/line:bg-[#1A1A1A] transition text-stone-500 group-hover/line:text-white">
                    {copiedLineIndex === idx ? (
                      <LucideIcon name="check" size={10} className="text-emerald-600 animate-scale" />
                    ) : (
                      <LucideIcon name="copy" size={10} className="transition" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Copy instructions/tips */}
        <p className="text-[11px] text-stone-500 text-center mt-2.5 flex items-center justify-center gap-1 italic">
          <LucideIcon name="info" size={11} className="text-stone-400" />
          <span>點擊單行即可複製，或使用下方「一鍵複製完整巨集」</span>
        </p>
      </div>

      {/* Bottom Toolbars / Actions Panel */}
      <div className="px-3.5 py-3 border-t border-[#E6E3DC] bg-[#FAF9F5] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Edit button */}
          <button
            onClick={() => onEdit(macro)}
            className="p-1.5 rounded-md bg-white hover:bg-[#FAF9F5] border border-[#D1CEC7] text-[#2D2D2A] hover:text-[#1A1A1A] transition duration-200 cursor-pointer"
            title="編輯巨集內容"
          >
            <LucideIcon name="pencil" size={13} />
          </button>

          {/* Move to another category */}
          {onMove && categories.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                className="p-1.5 rounded-md bg-white hover:bg-[#FAF9F5] border border-[#D1CEC7] text-[#2D2D2A] hover:text-[#1A1A1A] transition duration-200 flex items-center gap-0.5 cursor-pointer"
                title="移至其它分頁"
              >
                <LucideIcon name="sliders" size={13} />
              </button>
              {showMoveDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 rounded-md bg-white border border-[#D1CEC7] shadow-xl overflow-hidden z-20 animate-fade-in">
                  <div className="px-3 py-1.5 border-b border-[#E6E3DC] bg-[#FAF9F5] text-[10px] text-stone-500 font-medium">
                    移動至分頁：
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    {categories
                      .filter((c) => c.id !== currentCategoryId)
                      .map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onMove(macro.id, cat.id);
                            setShowMoveDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-[#2D2D2A] hover:bg-stone-105 transition duration-150 truncate cursor-pointer"
                        >
                          {cat.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete button */}
          <button
            onClick={() => {
              if (confirm(`確定要刪除「${macro.title}」巨集嗎？`)) {
                onDelete(macro.id);
              }
            }}
            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-850 transition duration-200 cursor-pointer"
            title="刪除巨集"
          >
            <LucideIcon name="trash" size={13} />
          </button>
        </div>

        {/* Copy Entire Macro Button */}
        <button
          onClick={handleCopyEntire}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition duration-300 shrink-0 border ${
            copiedEntire
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
              : 'bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white border-transparent'
          }`}
        >
          <LucideIcon name={copiedEntire ? 'check' : 'copy'} size={12} />
          <span>{copiedEntire ? '已複製全部！' : '複製完整巨集'}</span>
        </button>
      </div>
    </div>
  );
};
