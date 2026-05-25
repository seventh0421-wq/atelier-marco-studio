import React, { useState, useEffect } from 'react';
import { Macro } from '../types';
import { AVAILABLE_MACRO_ICONS, LucideIcon } from './LucideIcon';

interface MacroFormProps {
  macro?: Macro; // If provided, we're in edit mode
  categoryName: string;
  onSave: (macroData: Omit<Macro, 'id'>) => void;
  onCancel: () => void;
}

export const MacroForm: React.FC<MacroFormProps> = ({
  macro,
  categoryName,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('smile');
  const [color, setColor] = useState<'gold' | 'blue' | 'green' | 'purple' | 'rose' | 'slate'>('slate');
  const [isPinned, setIsPinned] = useState(false);

  // Load initial macro data if editing
  useEffect(() => {
    if (macro) {
      setTitle(macro.title);
      setContent(macro.content);
      setDescription(macro.description || '');
      setIcon(macro.icon);
      setColor(macro.color);
      setIsPinned(!!macro.isPinned);
    } else {
      // Defaults for creation
      setTitle('');
      setContent('');
      setDescription('');
      setIcon('smile');
      setColor('slate');
      setIsPinned(false);
    }
  }, [macro]);

  const lines = content.split('\n');
  const totalLines = content === '' ? 0 : lines.length;
  const isLineLimitExceeded = totalLines > 15;

  const analyzedLines = lines.map((text, idx) => ({
    text,
    length: text.length,
    isValid: text.length <= 180,
    lineNum: idx + 1
  }));

  const badLines = analyzedLines.filter((l) => !l.isValid);
  const hasTooLongLines = badLines.length > 0;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      content: content,
      description: description.trim() || undefined,
      icon,
      color,
      isPinned
    });
  };

  const colorOptions: { value: typeof color; bg: string; border: string; label: string }[] = [
    { value: 'slate', bg: 'bg-[#F5F5F3]', border: 'border-[#1A1A1A]', label: '石板灰' },
    { value: 'gold', bg: 'bg-[#FCF9F1]', border: 'border-[#b58e3d]', label: '黃金貴' },
    { value: 'blue', bg: 'bg-[#F2F6F9]', border: 'border-[#426a8c]', label: '星空藍' },
    { value: 'green', bg: 'bg-[#F3F8F5]', border: 'border-[#3f7354]', label: '翡翠綠' },
    { value: 'purple', bg: 'bg-[#FAF6FC]', border: 'border-[#6c4885]', label: '影魔紫' },
    { value: 'rose', bg: 'bg-[#FDF5F6]', border: 'border-[#ab4656]', label: '初戀粉' }
  ];

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        id="macro-form-modal"
        className="bg-[#FDFDFB] border border-[#D1CEC7] rounded-lg w-full max-w-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden animate-scale"
      >
        {/* Header bar */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-b border-[#E6E3DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 rounded-md bg-[#FAF9F5] text-[#1A1A1A] border border-[#D1CEC7] text-[10px] font-mono font-bold">
              FF14 MACRO
            </div>
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] tracking-tight">
              {macro ? '✏️ 編輯巨集資料' : '✨ 新增角色 RP 巨集'}
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-sans">
            收納於：<strong className="text-stone-800 font-semibold">{categoryName}</strong>
          </span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="overflow-y-auto p-6 space-y-5 grow custom-scrollbar bg-[#FDFDFB]">
          
          {/* Title and Short Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <span>📍 巨集標題</span>
                <span className="text-red-650 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：👋 歡迎主人回府 (點擊一鍵複製)"
                className="w-full bg-white border border-[#D1CEC7] focus:border-[#1A1A1A] rounded-md px-3.5 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:ring-1 focus:ring-stone-200 transition outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <span>💬 備註 / 使用場合</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：為踏入咖啡廳的顧客遞上當日鮮沏與招牌甜點甜心動作"
                className="w-full bg-white border border-[#D1CEC7] focus:border-[#1A1A1A] rounded-md px-3.5 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:ring-1 focus:ring-stone-200 transition outline-none"
              />
            </div>
          </div>

          {/* Favorite toggle checkbox Banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-[#FAF6ED]/85 rounded-md border border-[#ebdcb3]/60 focus-within:border-amber-500/80 transition shadow-sm">
            <input
              type="checkbox"
              id="form-is-pinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#8c6717] focus:ring-[#8c6717] border-[#D1CEC7] cursor-pointer"
            />
            <div className="space-y-0.5 select-none">
              <label htmlFor="form-is-pinned" className="text-xs font-bold text-stone-850 cursor-pointer flex items-center gap-1">
                <span className="text-amber-500 text-sm">★</span>
                <span>置頂收藏此劇本巨集 (Pin as Favorite)</span>
              </label>
              <p className="text-[10px] text-stone-500 leading-normal font-sans">
                勾選後，該巨集將被特別儲存為喜好劇本，置頂顯示於頂部欄，以復古燙金飾邊與亮黃星標特別高亮點綴，便於演戲時流暢、一鍵快取。
              </p>
            </div>
          </div>

          {/* Preset Theme Selection (Card color) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#1A1A1A]">
              🎨 卡片套用主題色
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {colorOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setColor(opt.value)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition text-center cursor-pointer ${opt.bg} ${
                    color === opt.value
                      ? `${opt.border} bg-opacity-100 ring-1 ring-stone-900 shadow-sm scale-102`
                      : 'border-[#E6E3DC] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border border-black/15 mb-1 ${
                    opt.value === 'slate' ? 'bg-stone-500' :
                    opt.value === 'gold' ? 'bg-[#b58e3d]' :
                    opt.value === 'blue' ? 'bg-[#426a8c]' :
                    opt.value === 'green' ? 'bg-[#3f7354]' :
                    opt.value === 'purple' ? 'bg-[#6c4885]' : 'bg-[#ab4656]'
                  }`} />
                  <span className="text-[10px] text-[#2D2D2A] font-sans tracking-tight font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Custom Icon list */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#1A1A1A]">
              🎭 選擇巨集代表圖案
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5 p-2 bg-[#FAF9F5] rounded-md border border-[#E6E3DC]">
              {AVAILABLE_MACRO_ICONS.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => setIcon(item.name)}
                  className={`flex items-center justify-center p-2 rounded-md border transition cursor-pointer ${
                    icon === item.name
                      ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm'
                      : 'bg-white border-[#D1CEC7] text-stone-600 hover:text-[#1A1A1A] hover:border-stone-500'
                  }`}
                  title={item.label}
                >
                  <LucideIcon name={item.icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Macro content (Textarea) with Live line counts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <span>⚙️ 巨集內文 (FF14 語法)</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={isLineLimitExceeded ? 'text-red-650 font-bold' : 'text-stone-500'}>
                  {totalLines} / 15 行
                </span>
                <span className={hasTooLongLines ? 'text-red-650 font-bold' : 'text-stone-500'}>
                  {hasTooLongLines ? '🚨 有字數超限行' : '✅ 正常長度'}
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                placeholder="/em 雙手交疊在裙前躬身致意，貓耳輕顫：&#10;/say 「歡迎回來，我親愛的主人！今天女僕組準備了最棒的茶點喵～」&#10;/welcome&#10;/say 請問是要用餐呢？還是先來杯熱騰騰的紅茶呢？"
                className="w-full bg-white border border-[#D1CEC7] focus:border-[#1A1A1A] rounded-md p-3.5 text-xs text-[#1A1A1A] font-mono leading-relaxed placeholder-stone-400 transition outline-none resize-y"
              />
            </div>

            {/* Live editor helper widget */}
            <div className="p-3.5 bg-[#FAF9F5] rounded-md border border-[#E6E3DC] space-y-2">
              <p className="text-[10px] text-stone-500 font-sans tracking-wide">
                ℹ️ <strong>防爆字小教室：</strong> FFXIV 遊戲內聊天框與巨集每行上限為 <strong>180 字元</strong>（1 個中文字約為 1 字元，英文約為 1 字元）。若有行數超出限制，將在此條例中標紅指出：
              </p>

              {content === '' ? (
                <div className="text-[11px] text-stone-400 font-mono text-center py-2 italic font-sans">
                  巨集內容為空，請在上方輸入框中輸入內容...
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {analyzedLines.map((l) => (
                    <div
                      key={l.lineNum}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded flex items-center justify-between ${
                        l.lineNum > 15
                          ? 'bg-red-50 text-red-750 line-through'
                          : !l.isValid
                          ? 'bg-rose-50 border border-rose-200 text-rose-900 font-semibold'
                          : 'text-stone-600 bg-white border border-[#E6E3DC]/40'
                      }`}
                    >
                      <div className="truncate pr-3 max-w-[80%] flex items-center gap-1.5">
                        <span className={`text-[9.5px] font-mono select-none font-bold ${l.lineNum > 15 || !l.isValid ? 'text-rose-600' : 'text-[#8c6717]'}`}>
                          第{String(l.lineNum).padStart(2, '0')}行
                        </span>
                        <span className="truncate">{l.text || '(空白行)'}</span>
                      </div>
                      <span className={`text-[10px] font-mono select-none ${!l.isValid ? 'text-rose-700 font-bold' : l.lineNum > 15 ? 'text-rose-450' : 'text-stone-400'}`}>
                        {l.length} / 180 字
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Action button bar */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-t border-[#E6E3DC] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[#D1CEC7] bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-md transition cursor-pointer"
          >
            取消
          </button>
          
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={!title.trim() || isLineLimitExceeded}
            className={`px-5 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition duration-200 cursor-pointer ${
              !title.trim() || isLineLimitExceeded
                ? 'bg-stone-100 text-stone-400 border border-[#E6E3DC] cursor-not-allowed'
                : 'bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white border border-transparent shadow-sm'
            }`}
          >
            <LucideIcon name="check" size={13} />
            <span>{macro ? '更新儲存' : '確認創建'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
