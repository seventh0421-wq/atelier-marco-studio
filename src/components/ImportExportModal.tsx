import React, { useState, useRef } from 'react';
import { OrganizerData, CharacterConfig } from '../types';
import { LucideIcon } from './LucideIcon';

interface ImportExportModalProps {
  currentData: OrganizerData;
  onImport: (importedCharacters: CharacterConfig[], merge: boolean) => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  currentData,
  onImport,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [pasteContent, setPasteContent] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<CharacterConfig[] | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse custom base64 or raw JSON string
  const getFullJSONString = (data: OrganizerData) => {
    return JSON.stringify(data.characters, null, 2);
  };

  const getCompressedBase64 = (data: OrganizerData) => {
    try {
      const json = JSON.stringify(data.characters);
      // UTF-8 safe base64 encoding
      const utf8Bytes = new TextEncoder().encode(json);
      const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
      return btoa(binaryString);
    } catch (e) {
      return '';
    }
  };

  const handleDownloadJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData.characters, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "ff14-rp-macros-export.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('無法下載 JSON：' + String(e));
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Safe decoding of UTF-8 Base64 or plain string parsing
  const tryParseImportString = (input: string): CharacterConfig[] => {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('輸入內容為空！');

    // Case 1: Raw JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    }

    // Case 2: Base64 string
    try {
      const binaryString = atob(trimmed);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decodedJson = new TextDecoder().decode(bytes);
      const parsed = JSON.parse(decodedJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      throw new Error('不合法的資料格式。請提供合法的 JSON 或分享代碼！');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPasteContent(text);
      handleValidateImport(text);
    };
    reader.readAsText(file);
  };

  const handleValidateImport = (textStr = pasteContent) => {
    setImportError(null);
    setImportPreview(null);
    try {
      const parsed = tryParseImportString(textStr);
      
      // Basic structure validation
      if (!parsed || parsed.length === 0) {
        throw new Error('未發現任何角色設定！');
      }

      parsed.forEach((char, idx) => {
        if (!char.characterName) {
          throw new Error(`第 ${idx + 1} 個角色缺少 CharacterName 屬性`);
        }
        if (!Array.isArray(char.categories)) {
          throw new Error(`角色 「${char.characterName}」 缺少或格式錯誤的 categories 分類欄位`);
        }
      });

      setImportPreview(parsed);
    } catch (err: any) {
      setImportError(err.message || String(err));
    }
  };

  const executeImport = (merge: boolean) => {
    if (!importPreview) return;
    onImport(importPreview, merge);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        id="import-export-modal"
        className="bg-[#FDFDFB] border border-[#D1CEC7] w-full max-w-2xl max-h-[92vh] flex flex-col rounded-lg overflow-hidden shadow-xl animate-scale"
      >
        {/* Header Tab panel */}
        <div className="bg-[#FAF9F5] border-b border-[#E6E3DC] flex items-center justify-between px-6 py-1 select-none shrink-0">
          <div className="flex items-center gap-1.5 py-3">
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <LucideIcon name="refresh" size={16} className="text-[#8c6717]" />
              <span>共用與備份巨集配置</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-[#2D2D2A] hover:text-[#1A1A1A] transition cursor-pointer"
          >
            <LucideIcon name="x" size={16} />
          </button>
        </div>

        {/* Tab triggers */}
        <div className="bg-[#FAF9F5]/40 border-b border-[#E6E3DC] shrink-0 flex">
          <button
            onClick={() => {
              setActiveTab('export');
              setImportError(null);
              setImportPreview(null);
            }}
            className={`px-6 py-3.5 text-xs font-semibold cursor-pointer border-b-2 transition duration-200 ${
              activeTab === 'export'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-stone-500 hover:text-[#1A1A1A]'
            }`}
          >
            📤 導出數據
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setPasteContent('');
              setImportError(null);
              setImportPreview(null);
            }}
            className={`px-6 py-3.5 text-xs font-semibold cursor-pointer border-b-2 transition duration-200 ${
              activeTab === 'import'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-stone-500 hover:text-[#1A1A1A]'
            }`}
          >
            📥 導入數據 / 分享碼
          </button>
        </div>

        {/* Modal body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-[#FDFDFB]">

          {/* EXPORT VIEW */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9F5] rounded-md border border-[#E6E3DC] text-stone-800">
                <h4 className="text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                  <LucideIcon name="download" size={14} className="text-[#2e6942]" />
                  <span>方法一：一鍵保存為 JSON 備份檔</span>
                </h4>
                <p className="text-[11px] text-stone-500 mb-3.5 leading-relaxed">
                  將目前所有角色、分頁與巨集設定保存為實體檔案，最適合用作異地冷備份或與朋友整套交流。
                </p>
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white text-xs font-medium rounded-md transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <LucideIcon name="download" size={14} />
                  <span>下載角色巨集備份 (.json)</span>
                </button>
              </div>

              <div className="p-4 bg-[#FAF9F5] rounded-md border border-[#E6E3DC] text-stone-800 space-y-3.5">
                <div>
                  <h4 className="text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <LucideIcon name="copy" size={14} className="text-[#8c6717]" />
                    <span>方法二：RP 角色分享代碼 (Base64)</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    將當前配置打包成一串字元長代碼，方便直接在 Discord、討論區或筆記本中一鍵貼上分享！
                  </p>
                </div>

                <div className="space-y-2">
                  <textarea
                    readOnly
                    value={getCompressedBase64(currentData)}
                    rows={4}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full text-[10px] font-mono p-3 bg-white rounded-md border border-[#D1CEC7] outline-none text-[#2D2D2A] cursor-copy focus:border-[#1A1A1A]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      提示：點擊框內文字可自動全選。
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(getCompressedBase64(currentData))}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition border ${
                        copiedText
                          ? 'bg-emerald-600 border-transparent text-white'
                          : 'bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white border-transparent'
                      }`}
                    >
                      <LucideIcon name={copiedText ? 'check' : 'copy'} size={12} className="inline mr-1" />
                      {copiedText ? '已複製到剪貼簿！' : '複製分享代碼'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IMPORT VIEW */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9F5] rounded-md border border-dashed border-[#D1CEC7] text-center space-y-2">
                <p className="text-xs font-semibold text-[#1A1A1A]">
                  📂 上傳備份檔案
                </p>
                <div className="flex justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={fileChange => handleFileChange(fileChange)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-[#D1CEC7] rounded-md text-xs transition cursor-pointer"
                  >
                    選取 .json 檔案
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">
                  或者在下方直接貼上 JSON 格式內容或 Base64 分享代碼：
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  placeholder="請在此黏貼備份 JSON 代碼，或者直接貼上分享代碼..."
                  rows={4}
                  value={pasteContent}
                  onChange={(e) => {
                    setPasteContent(e.target.value);
                    setImportError(null);
                    setImportPreview(null);
                  }}
                  className="w-full text-[11px] font-mono p-3 bg-white rounded-md border border-[#D1CEC7] outline-none text-[#1A1A1A] placeholder-stone-400 focus:border-[#1A1A1A]"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={!pasteContent.trim()}
                    onClick={() => handleValidateImport()}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                      !pasteContent.trim()
                        ? 'bg-stone-100 text-stone-400 border border-[#E6E3DC] cursor-not-allowed'
                        : 'bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white'
                    }`}
                  >
                    <LucideIcon name="eye" size={12} />
                    <span>解析與驗證代碼</span>
                  </button>
                </div>
              </div>

              {/* Error Output */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
                  <LucideIcon name="alert" size={14} className="text-rose-600 shrink-0" />
                  <span><strong>解析失敗：</strong> {importError}</span>
                </div>
              )}

              {/* Success Preview & Import Execution */}
              {importPreview && (
                <div className="p-4 bg-emerald-50/20 border border-emerald-200 rounded-md space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <LucideIcon name="check" size={14} />
                      解析成功！準備匯入以下角色：
                    </span>
                    <span className="text-[10px] text-[#1A1A1A] bg-white px-2.5 py-0.5 rounded border border-[#D1CEC7]">
                      共有 {importPreview.length} 位角色配置
                    </span>
                  </div>

                  {/* Character visual listing preview */}
                  <div className="space-y-2 bg-white rounded-md p-2.5 border border-[#E6E3DC]">
                    {importPreview.map((char, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-stone-100 pb-1.5 last:border-none last:pb-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#8c6717] font-semibold">👤 {char.characterName}</span>
                          <span className="text-[10px] text-stone-500 bg-stone-50 px-1.5 py-0.2 rounded border border-[#E6E3DC]">
                            {char.serverName || '未知伺服器'}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500">
                          {char.categories.length} 個分頁 (
                          {char.categories.reduce((acc, c) => acc + c.macros.length, 0)} 個巨集)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-stone-500 leading-relaxed">
                    ⚠️ <strong>選擇匯入策略：</strong> 合併資料會保留你現有的所有角色，並將解析出來的角色追加進選單；覆蓋資料則會<strong>清空現有全部設定碼</strong>，完全替換為此次匯入的數據！
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => executeImport(true)} // Merge
                      className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold border border-[#D1CEC7] rounded-md transition cursor-pointer"
                    >
                      🤝 合併/追加角色
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('⚠️ 警告：這將會徹底清空並覆寫所有您現有的角色與巨集配置！您確定嗎？')) {
                          executeImport(false); // Overwrite
                        }
                      }}
                      className="px-4 py-2 bg-[#ab4656] hover:bg-[#8c3241] text-white text-xs font-semibold rounded-md transition cursor-pointer shadow-sm"
                    >
                      💥 覆蓋覆寫現有數據
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-t border-[#E6E3DC] flex items-center justify-between shrink-0">
          <p className="text-[10px] text-stone-500 font-sans italic">
            長度在 FFXIV 中受 15 行限，多載具同步最佳拍檔
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-[#D1CEC7] text-xs font-medium rounded-md transition cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
