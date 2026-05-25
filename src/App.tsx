import { useState, useEffect, useMemo } from 'react';
import { OrganizerData, CharacterConfig, TabCategory, Macro } from './types';
import { LucideIcon } from './components/LucideIcon';
import { MacroCard } from './components/MacroCard';
import { MacroForm } from './components/MacroForm';
import { ImportExportModal } from './components/ImportExportModal';
import { DEFAULT_CHARACTERS, SAMPLE_DIALOGUES } from './defaultTemplates';

export default function App() {
  // Load state from localStorage on init
  const [data, setData] = useState<OrganizerData>(() => {
    const saved = localStorage.getItem('ff14-rp-macro-studio-v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.characters && parsed.characters.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
    // Default fallback
    return {
      characters: DEFAULT_CHARACTERS,
      activeCharacterId: DEFAULT_CHARACTERS[0]?.id || ''
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ff14-rp-macro-studio-v4', JSON.stringify(data));
  }, [data]);

  // Find the active character config safely
  const activeChar = useMemo(() => {
    const current = data.characters.find((c) => c.id === data.activeCharacterId);
    return current || data.characters[0] || null;
  }, [data.characters, data.activeCharacterId]);

  // If active character changed, auto select first category if current active category doesn't exist under new character
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    if (activeChar) {
      if (activeCategoryId !== 'favorites' && !activeChar.categories.some((cat) => cat.id === activeCategoryId)) {
        setActiveCategoryId(activeChar.categories[0]?.id || '');
      }
    } else {
      setActiveCategoryId('');
    }
  }, [activeChar, activeCategoryId]);

  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGlobal, setSearchGlobal] = useState(false);

  // Modal open states
  const [isMacroFormOpen, setIsMacroFormOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<Macro | undefined>(undefined);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Tutorial popup modal state
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    const hasViewed = localStorage.getItem('ff14-rp-macro-tutorial-viewed');
    if (!hasViewed) {
      setIsTutorialOpen(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    localStorage.setItem('ff14-rp-macro-tutorial-viewed', 'true');
    setIsTutorialOpen(false);
  };

  // Character inline-edit states
  const [isCharacterEditing, setIsCharacterEditing] = useState(false);
  const [editedCharName, setEditedCharName] = useState('');
  const [editedCharServer, setEditedCharServer] = useState('');

  // Character creation Modal states
  const [isAddCharOpen, setIsAddCharOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharServer, setNewCharServer] = useState('');

  // Rename Category states
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');

  // Copy success toaster
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Safe active category
  const activeCategory = useMemo(() => {
    if (!activeChar) return null;
    if (activeCategoryId === 'favorites') {
      const allPinned = activeChar.categories.flatMap((cat) =>
        cat.macros.filter((m) => m.isPinned).map((m) => ({ ...m, categoryId: cat.id }))
      );
      return {
        id: 'favorites',
        name: '⭐ 常用置頂劇本收藏',
        macros: allPinned
      } as TabCategory;
    }
    return activeChar.categories.find((c) => c.id === activeCategoryId) || activeChar.categories[0] || null;
  }, [activeChar, activeCategoryId]);

  // Total count of pinned/favorited macros under this character
  const pinnedMacrosCount = useMemo(() => {
    if (!activeChar) return 0;
    return activeChar.categories.reduce((acc, cat) => {
      return acc + cat.macros.filter((m) => m.isPinned).length;
    }, 0);
  }, [activeChar]);

  // Filtered Macros list based on Search terms
  const filteredMacros = useMemo(() => {
    if (!activeChar) return [];
    const query = searchQuery.trim().toLowerCase();

    let list: (Macro & { categoryId: string })[] = [];

    // If search is empty, just return the active category's macros
    if (!query) {
      if (searchGlobal) {
        // Show everything of this character
        list = activeChar.categories.flatMap((c) => c.macros.map(m => ({ ...m, categoryId: c.id })));
      } else {
        list = activeCategory ? activeCategory.macros.map(m => ({ ...m, categoryId: m.categoryId || activeCategory.id })) : [];
      }
    } else {
      // Otherwise, perform search (checks title, body, and note)
      const matchMacro = (macro: Macro) => {
        const matchTitle = macro.title.toLowerCase().includes(query);
        const matchContent = macro.content.toLowerCase().includes(query);
        const matchDesc = macro.description?.toLowerCase().includes(query) || false;
        return matchTitle || matchContent || matchDesc;
      };

      if (searchGlobal) {
        // Search all categories under active character
        activeChar.categories.forEach((cat) => {
          cat.macros.forEach((m) => {
            if (matchMacro(m)) {
              list.push({ ...m, categoryId: cat.id });
            }
          });
        });
      } else {
        // Search only in active category
        if (activeCategory) {
          const catId = activeCategory.id;
          activeCategory.macros
            .filter(matchMacro)
            .forEach(m => {
              list.push({ ...m, categoryId: m.categoryId || catId });
            });
        }
      }
    }

    // Always sort so that pinned macros are placed at the very top (sorted with pinned status first)
    return [...list].sort((a, b) => {
      const aPinned = !!a.isPinned;
      const bPinned = !!b.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [activeChar, activeCategory, searchQuery, searchGlobal, activeCategoryId]);

  // CHARACTER CRUD OPERATIONS
  const handleAddNewCharacter = () => {
    if (!newCharName.trim()) return;
    const newId = 'char-' + Date.now();
    const newChar: CharacterConfig = {
      id: newId,
      characterName: newCharName.trim(),
      serverName: newCharServer.trim() || '未設定伺服器',
      categories: [
        {
          id: 'cat-new-' + Date.now(),
          name: '📌 通用日常',
          macros: []
        }
      ]
    };

    setData((prev) => ({
      characters: [...prev.characters, newChar],
      activeCharacterId: newId
    }));

    setNewCharName('');
    setNewCharServer('');
    setIsAddCharOpen(false);
    triggerToast('已成功創建新角色配置檔！');
  };

  const handleStartEditCharacter = () => {
    if (!activeChar) return;
    setEditedCharName(activeChar.characterName);
    setEditedCharServer(activeChar.serverName);
    setIsCharacterEditing(true);
  };

  const handleSaveCharacterEdit = () => {
    if (!editedCharName.trim() || !activeChar) return;

    setData((prev) => ({
      ...prev,
      characters: prev.characters.map((c) =>
        c.id === prev.activeCharacterId
          ? { ...c, characterName: editedCharName.trim(), serverName: editedCharServer.trim() }
          : c
      )
    }));
    setIsCharacterEditing(false);
    triggerToast('已更新角色檔案資訊！');
  };

  const handleDeleteCharacter = () => {
    if (!activeChar) return;
    if (data.characters.length <= 1) {
      alert('⚠️ 無法刪除唯一的角色配置！您可以點擊「編輯」更名，或者新增其他角色後再刪除此帳號。');
      return;
    }
    if (confirm(`⚠️ 警告：這將會永久刪除角色 👤「${activeChar.characterName}」的所有分頁與巨集設定！此操作不可復原，確定要刪除嗎？`)) {
      const remaining = data.characters.filter((c) => c.id !== activeChar.id);
      setData({
        characters: remaining,
        activeCharacterId: remaining[0].id
      });
      triggerToast('角色配置已永久移除。');
    }
  };

  // CATEGORY/TAB CRUD OPERATIONS
  const handleAddCategory = () => {
    const name = prompt('請輸入新分頁分類名稱（例如：🎭 街頭話劇、🍹 櫃檯收銀）：');
    if (!name || !name.trim() || !activeChar) return;

    const newCatId = 'cat-' + Date.now();
    const newCat: TabCategory = {
      id: newCatId,
      name: name.trim(),
      macros: []
    };

    setData((prev) => ({
      ...prev,
      characters: prev.characters.map((c) =>
        c.id === prev.activeCharacterId ? { ...c, categories: [...c.categories, newCat] } : c
      )
    }));
    setActiveCategoryId(newCatId);
    triggerToast(`分頁「${name}」已成功新增！`);
  };

  const handleStartRenameCategory = (cat: TabCategory) => {
    setEditingCategoryId(cat.id);
    setEditedCategoryName(cat.name);
  };

  const handleSaveRenameCategory = (catId: string) => {
    if (!editedCategoryName.trim()) return;
    setData((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => {
        if (c.id === prev.activeCharacterId) {
          return {
            ...c,
            categories: c.categories.map((cat) =>
              cat.id === catId ? { ...cat, name: editedCategoryName.trim() } : cat
            )
          };
        }
        return c;
      })
    }));
    setEditingCategoryId(null);
    triggerToast('分類名稱修改成功！');
  };

  const handleDeleteCategory = (cat: TabCategory) => {
    if (!activeChar) return;
    if (activeChar.categories.length <= 1) {
      alert('⚠️ 無法刪除唯一的分類分頁！');
      return;
    }

    if (
      confirm(
        `⚠️ 確定要刪除分類「${cat.name}」嗎？項目內的 ${cat.macros.length} 個巨集將會被一併刪除！`
      )
    ) {
      const remainingCats = activeChar.categories.filter((c) => c.id !== cat.id);
      setData((prev) => ({
        ...prev,
        characters: prev.characters.map((c) =>
          c.id === prev.activeCharacterId ? { ...c, categories: remainingCats } : c
        )
      }));
      setActiveCategoryId(remainingCats[0].id);
      triggerToast('分頁分類已移除！');
    }
  };

  // MACRO CRUD OPERATIONS
  const handleOpenCreateMacro = () => {
    if (activeCategoryId === 'favorites') {
      alert('⚠️ 目前正在「常用置頂收藏」分類中。若要建立新劇本，請先點擊側邊欄切換至一般分頁索引（如：日常對話）喔！');
      return;
    }
    if (!activeCategory) {
      alert('請先點擊「新增分頁」建立一個分類分類，才能開始加入巨集喔！');
      return;
    }
    setEditingMacro(undefined);
    setIsMacroFormOpen(true);
  };

  const handleOpenEditMacro = (macro: Macro) => {
    setEditingMacro(macro);
    setIsMacroFormOpen(true);
  };

  const handleSaveMacro = (macroData: Omit<Macro, 'id'>) => {
    if (!activeChar || !activeCategory) return;

    setData((prev) => {
      const updatedChars = prev.characters.map((char) => {
        if (char.id === prev.activeCharacterId) {
          const updatedCategories = char.categories.map((cat) => {
            // Find the correct category to place/edit the macro
            // If we are editing, look up where the macro actually lives (might be in a search result)
            let targetCatId = activeCategoryId;
            if (editingMacro) {
              targetCatId = char.categories.find((c) => c.macros.some((m) => m.id === editingMacro.id))?.id || activeCategoryId;
            } else if (activeCategoryId === 'favorites') {
              targetCatId = char.categories[0]?.id || '';
            }

            if (cat.id === targetCatId) {
              if (editingMacro) {
                // Editing existing
                return {
                  ...cat,
                  macros: cat.macros.map((m) =>
                    m.id === editingMacro.id ? { ...m, ...macroData } : m
                  )
                };
              } else {
                // Creating new
                return {
                  ...cat,
                  macros: [...cat.macros, { id: 'macro-' + Date.now(), ...macroData }]
                };
              }
            }
            return cat;
          });
          return { ...char, categories: updatedCategories };
        }
        return char;
      });
      return { ...prev, characters: updatedChars };
    });

    setIsMacroFormOpen(false);
    triggerToast(editingMacro ? '巨集更新成功！' : '巨集創建成功！');
  };

  const handleDeleteMacro = (macroId: string) => {
    if (!activeChar) return;

    setData((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => {
        if (c.id === prev.activeCharacterId) {
          return {
            ...c,
            categories: c.categories.map((cat) => ({
              ...cat,
              macros: cat.macros.filter((m) => m.id !== macroId)
            }))
          };
        }
        return c;
      })
    }));
    triggerToast('已刪除所選之巨集');
  };

  const handleMoveMacro = (macroId: string, destCatId: string) => {
    if (!activeChar) return;

    setData((prev) => {
      const updatedChars = prev.characters.map((char) => {
        if (char.id === prev.activeCharacterId) {
          let foundMacro: Macro | null = null;

          // Remove macro from source category
          const cleanedCategories = char.categories.map((cat) => {
            const index = cat.macros.findIndex((m) => m.id === macroId);
            if (index !== -1) {
              foundMacro = cat.macros[index];
              const nextMacros = [...cat.macros];
              nextMacros.splice(index, 1);
              return { ...cat, macros: nextMacros };
            }
            return cat;
          });

          // Insert into destination category
          if (foundMacro) {
            return {
              ...char,
              categories: cleanedCategories.map((cat) => {
                if (cat.id === destCatId) {
                  return { ...cat, macros: [...cat.macros, foundMacro!] };
                }
                return cat;
              })
            };
          }
        }
        return char;
      });
      return { ...prev, characters: updatedChars };
    });

    triggerToast('巨集移動成功！');
  };

  const handleTogglePin = (macroId: string) => {
    if (!activeChar) return;
    let wasPinned = false;
    setData((prev) => {
      const nextCharacters = prev.characters.map((char) => {
        if (char.id === prev.activeCharacterId) {
          const nextCategories = char.categories.map((cat) => {
            const nextMacros = cat.macros.map((m) => {
              if (m.id === macroId) {
                wasPinned = !!m.isPinned;
                return { ...m, isPinned: !m.isPinned };
              }
              return m;
            });
            return { ...cat, macros: nextMacros };
          });
          return { ...char, categories: nextCategories };
        }
        return char;
      });
      return { ...prev, characters: nextCharacters };
    });
    triggerToast(wasPinned ? '已將劇本移出置頂收藏！' : '精品劇本已放入置頂收藏夾！');
  };

  // FULL STORAGE RESET/REVERT
  const handleResetToPresets = () => {
    if (
      confirm(
        '⚠️ 警告：這將會清空您目前在本機儲存的「所有自定義角色與分頁巨集」並將工作坊重設為初始狀態！您確定要回復出廠設定嗎？'
      )
    ) {
      setData({
        characters: DEFAULT_CHARACTERS,
        activeCharacterId: DEFAULT_CHARACTERS[0].id
      });
      setActiveCategoryId(DEFAULT_CHARACTERS[0].categories[0].id);
      triggerToast('已成功重設為乾淨初始狀態！');
    }
  };

  // IMPORT MERGE/OVERWRITE LOGIC
  const handleImportData = (importedCharacters: CharacterConfig[], merge: boolean) => {
    setData((prev) => {
      const nextCharacters = merge
        ? [...prev.characters, ...importedCharacters]
        : importedCharacters;

      return {
        characters: nextCharacters,
        activeCharacterId: importedCharacters[0]?.id || nextCharacters[0].id
      };
    });
    triggerToast(merge ? '已成功合併導入共享角色檔案！' : '已成功一鍵覆蓋覆寫角色資料庫！');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] flex flex-col relative pb-16 font-sans">
      {/* Editorial top secondary header border */}
      <div className="w-full bg-[#FAF9F5] border-b border-[#D1CEC7] py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[10px] tracking-widest text-[#555552] font-mono select-none">
          <span>ATELIER MACRO SYSTEM VR-2026</span>
          <span className="hidden sm:inline">FINAL FANTASY XIV TC ROLEPLAY COMPASS UNIT</span>
        </div>
      </div>

      {/* Global Toast Message Feedback */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] border border-[#D1CEC7] shadow-xl rounded-md px-5 py-2.5 text-xs font-semibold text-white flex items-center gap-2 animate-scale">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EDITORIAL ESTHETIC HEADER */}
      <header className="border-b border-[#D1CEC7] bg-[#FDFDFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-serif font-light tracking-tight text-[#1A1A1A]">
              Atelier <span className="font-serif italic text-[#8c6717]">Macro Studio</span>
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-stone-500 uppercase mt-1">
              FINAL FANTASY XIV TC ROLEPLAY ACTOR’S PROMPT SUITE
            </p>
          </div>

          {/* Search tool block and config button wrappers */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 md:w-64">
              <input
                type="text"
                placeholder="搜尋巨集關鍵字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D1CEC7] focus:border-[#1A1A1A] rounded-md pr-9 pl-3.5 py-1.5 text-xs text-[#1A1A1A] placeholder-stone-400 focus:ring-1 focus:ring-stone-200 outline-none transition"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <LucideIcon name="x" size={13} />
                </button>
              ) : (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400">
                  <LucideIcon name="search" size={13} />
                </div>
              )}
            </div>

            {/* Global Search Scope Tag Toggle */}
            <button
              onClick={() => setSearchGlobal(!searchGlobal)}
              className={`px-3 py-1.5 rounded-md border text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                searchGlobal
                  ? 'bg-[#1A1A1A] border-transparent text-white'
                  : 'bg-white border-[#D1CEC7] text-stone-600 hover:border-stone-500'
              }`}
              title="切換跨分頁搜尋 / 目前分頁搜尋"
            >
              <LucideIcon name="globe" size={12} />
              <span>{searchGlobal ? '搜尋所有分類' : '僅目前分類'}</span>
            </button>

            {/* Import / Export & Outlets */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsImportExportOpen(true)}
                className="px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-[#D1CEC7] text-[#1A1A1A] text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5"
                title="備份導出 / 導入玩家代碼"
              >
                <LucideIcon name="refresh" size={12} className="text-[#8c6717]" />
                <span>匯入/匯出</span>
              </button>

              <button
                onClick={handleResetToPresets}
                className="p-1.5 bg-white hover:bg-stone-50 border border-[#D1CEC7] text-stone-400 hover:text-red-750 rounded-md transition cursor-pointer"
                title="重設回復系統甜點預設範本"
              >
                <LucideIcon name="trash" size={12} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* TWO PANEL INTEGRATED LAYOUT */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 mt-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* SIDEBAR PANEL (COLUMN 1): PROFILE & TABS */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Character Card Info Panel */}
            <div className="bg-[#FAF9F5] border border-[#D1CEC7] rounded-md p-4 space-y-4">
              <div>
                <span className="text-[10px] text-[#8c6717] font-mono tracking-widest font-bold block mb-1">
                  CHARACTER PORTRAIT
                </span>

                {isCharacterEditing ? (
                  <div className="space-y-2 pt-1.5">
                    <input
                      type="text"
                      required
                      value={editedCharName}
                      onChange={(e) => setEditedCharName(e.target.value)}
                      placeholder="輸入角色姓名..."
                      className="w-full bg-white border border-[#D1CEC7] rounded px-3 py-1.5 text-xs text-[#1A1A1A]"
                    />
                    <input
                      type="text"
                      value={editedCharServer}
                      onChange={(e) => setEditedCharServer(e.target.value)}
                      placeholder="輸入伺服器..."
                      className="w-full bg-white border border-[#D1CEC7] rounded px-3 py-1.5 text-xs text-[#1A1A1A]"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleSaveCharacterEdit}
                        disabled={!editedCharName.trim()}
                        className="px-3 py-1 bg-[#2e6942] text-white rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => setIsCharacterEditing(false)}
                        className="px-3 py-1 bg-white border border-[#D1CEC7] text-stone-600 rounded text-[10px] cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : activeChar ? (
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#1A1A1A] select-all leading-tight">
                      {activeChar.characterName}
                    </h2>
                    <span className="text-[10.5px] font-mono text-[#8c6717] bg-[#FAF6ED] border border-[#ebdcb3] px-2 py-0.5 rounded mt-1.5 inline-block select-all">
                      🎯 {activeChar.serverName}
                    </span>
                    <div className="flex gap-2.5 mt-2">
                      <button onClick={handleStartEditCharacter} className="text-[11px] text-stone-600 hover:text-[#1A1A1A] cursor-pointer">
                        ✏️ 編輯
                      </button>
                      <button onClick={handleDeleteCharacter} className="text-[11px] text-red-750 hover:text-red-900 cursor-pointer">
                        🚨 刪除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-400 italic">無啟用的角色</div>
                )}
              </div>
              
              {/* Dropdown character switcher inside sidebar */}
              <div className="border-t border-[#E6E3DC] pt-3.5 space-y-1.5">
                <label className="text-[10px] text-stone-500 font-mono tracking-wider uppercase block">切換當前角色：</label>
                <select
                  value={data.activeCharacterId}
                  onChange={(e) => setData({ ...data, activeCharacterId: e.target.value })}
                  className="w-full bg-white border border-[#D1CEC7] rounded-md text-xs text-stone-800 px-2.5 py-1.5 outline-none focus:border-[#1A1A1A] cursor-pointer"
                >
                  {data.characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.characterName} ({char.serverName})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsAddCharOpen(true)}
                  className="w-full mt-2.5 px-3 py-1.5 border border-dashed border-[#D1CEC7] hover:border-stone-500 text-stone-700 text-[11px] font-semibold rounded bg-white transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LucideIcon name="plus" size={12} />
                  <span>建立新角色存檔</span>
                </button>

                <button
                  onClick={() => setIsTutorialOpen(true)}
                  className="w-full mt-1.5 px-3 py-1.5 border border-[#D1CEC7] hover:border-stone-500 text-stone-600 text-[11px] font-semibold rounded bg-[#FAF9F5] hover:bg-[#FAF6ED] transition cursor-pointer flex items-center justify-center gap-1.5"
                  title="閱讀詳細的使用說明與巨集技巧"
                >
                  <LucideIcon name="info" size={12} className="text-[#8c6717]" />
                  <span>🎓 讀取使用教學指南</span>
                </button>
              </div>
            </div>

            {/* Sidebar Folder Directory list */}
            {activeChar && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#D1CEC7] pb-1.5">
                  <span className="text-[11px] font-mono tracking-widest text-[#1A1A1A] font-bold uppercase">
                    分頁索引 / PALETTE
                  </span>
                </div>

                <div className="space-y-1.5">
                  {/* Virtual Favorites Tab */}
                  <div
                    className={`group/favorites flex items-center justify-between p-2.5 px-3 rounded-md border transition-all duration-155 ${
                      activeCategoryId === 'favorites'
                        ? 'bg-[#8c6717] border-[#8c6717] text-white shadow-sm ring-1 ring-[#ebdcb3]/30'
                        : 'bg-[#FCFBF8] border-[#ebdcb3]/70 text-[#8c6717] hover:bg-[#FAF6ED] hover:border-[#ebdcb3]/100'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveCategoryId('favorites');
                      }}
                      className="text-xs font-serif font-bold text-left flex-1 truncate pr-2 cursor-pointer outline-none flex items-center gap-1.5"
                    >
                      <span className={`${activeCategoryId === 'favorites' ? 'text-amber-200' : 'text-amber-500'} text-sm`}>★</span>
                      <span>常用置頂收藏</span>
                    </button>

                    <span className={`text-[10px] font-mono font-bold select-none px-2 py-0.2 rounded shrink-0 ${
                      activeCategoryId === 'favorites'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FAF2E1] text-[#8c6717] border border-[#ebdcb3]/60'
                    }`}>
                      {pinnedMacrosCount}
                    </span>
                  </div>

                  {activeChar.categories.map((cat, idx) => {
                    const isActive = cat.id === activeCategoryId;
                    const isRenaming = editingCategoryId === cat.id;

                    if (isRenaming) {
                      return (
                        <div key={cat.id} className="flex items-center gap-1.5 bg-[#FAF9F5] border border-[#D1CEC7] p-2 rounded shrink-0">
                          <input
                            type="text"
                            required
                            value={editedCategoryName}
                            onChange={(e) => setEditedCategoryName(e.target.value)}
                            className="bg-white border border-[#D1CEC7] rounded px-1.5 py-0.5 text-xs text-[#1A1A1A] outline-none w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRenameCategory(cat.id)}
                            className="p-1 hover:bg-stone-100 text-[#2e6942] rounded transition"
                          >
                            <LucideIcon name="check" size={12} />
                          </button>
                          <button
                            onClick={() => setEditingCategoryId(null)}
                            className="p-1 hover:bg-stone-100 text-stone-400 rounded transition"
                          >
                            <LucideIcon name="x" size={12} />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cat.id}
                        className={`group/tab flex items-center justify-between p-2.5 px-3 rounded-md border transition-all duration-150 ${
                          isActive
                            ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm'
                            : 'bg-white border-[#E6E3DC] hover:border-[#D1CEC7] text-[#2D2D2A]'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setActiveCategoryId(cat.id);
                          }}
                          className="text-xs font-semibold text-left flex-1 truncate pr-2 cursor-pointer outline-none"
                        >
                          <span className="font-mono text-[10px] opacity-65 mr-1.5">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          {cat.name}
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] font-mono select-none px-1.5 py-0.2 rounded ${
                            isActive ? 'bg-white/20 text-white' : 'bg-stone-50 text-stone-600 border border-stone-200'
                          }`}>
                            {cat.macros.length}
                          </span>

                          <div className="hidden group-hover/tab:flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleStartRenameCategory(cat)}
                              className={`p-0.5 rounded hover:bg-stone-100 ${isActive ? 'text-white hover:text-[#1A1A1A]' : 'text-stone-500'}`}
                              title="重新命名此分頁"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-0.5 rounded hover:bg-rose-50 text-rose-700"
                              title="刪除此分頁"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddCategory}
                    className="w-full mt-2 px-3 py-2 border border-dashed border-[#D1CEC7] hover:border-stone-500 hover:bg-[#FAF9F5] text-stone-600 text-xs font-semibold rounded transition cursor-pointer flex items-center justify-center gap-1 bg-white"
                  >
                    <LucideIcon name="plus" size={12} />
                    <span>新增分頁分類</span>
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* WORKSPACE CONTENT MAIN STREAM (COLUMN 2,3,4): MACROS PALETTE */}
          <section className="lg:col-span-3 space-y-6">
            
            {activeChar ? (
              <>
                {/* HORIZONTAL WORKPLACE HEADER CONTROL BAR */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#D1CEC7] pb-4">
                  <div>
                    <span className="text-[10px] text-[#8c6717] font-mono tracking-widest uppercase block mb-1">
                      CURRENT STAGE
                    </span>
                    <h2 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                      {activeCategory?.name || '請新增或選取分頁'}
                      {activeCategory && (
                        <span className="text-xs font-mono font-normal text-stone-500 italic block sm:inline sm:ml-2.5">
                          (包含 {activeCategory.macros.length} 段巨集)
                        </span>
                      )}
                    </h2>
                  </div>

                  <button
                    onClick={handleOpenCreateMacro}
                    className="px-4.5 py-2 bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white text-xs font-bold rounded shadow-sm transition flex items-center justify-center gap-1.5 select-none shrink-0 cursor-pointer"
                  >
                    <LucideIcon name="plus" size={13} />
                    <span>新增 RP 巨集</span>
                  </button>
                </div>

                {/* SEARCH REPORT BANNER */}
                {searchQuery && (
                  <div className="p-3 bg-white border border-[#D1CEC7] rounded flex items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-2">
                      <LucideIcon name="search" size={14} className="text-[#8c6717]" />
                      <span>
                        關鍵字搜尋：找到符合 「<strong className="text-[#1A1A1A] font-semibold">{searchQuery}</strong>」 的結果共{' '}
                        <strong className="text-[#1A1A1A] font-mono">{filteredMacros.length}</strong> 個{' '}
                        {searchGlobal ? '（跨全分頁）' : '（僅限當前分頁）'}
                      </span>
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#8c6717] hover:underline cursor-pointer font-semibold"
                    >
                      清除搜尋結果
                    </button>
                  </div>
                )}

                {/* GRID OF MACROS */}
                {filteredMacros.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMacros.map((macro) => (
                      <MacroCard
                        key={macro.id}
                        macro={macro}
                        onEdit={handleOpenEditMacro}
                        onDelete={handleDeleteMacro}
                        onMove={handleMoveMacro}
                        onTogglePin={handleTogglePin}
                        categories={activeChar.categories.map((c) => ({ id: c.id, name: c.name }))}
                        currentCategoryId={macro.categoryId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border border-dashed border-[#D1CEC7] rounded bg-[#FAF9F5]/40 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto text-stone-400 border border-[#D1CEC7]">
                      <LucideIcon name="book" size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-850">
                        {searchQuery ? '未找到匹配的巨集' : '巨集目錄尚無內容'}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        {searchQuery
                          ? '請試試不同的關鍵字，或切換上方搜尋機制至「搜尋跨所有分類」'
                          : `目前在 「${activeCategory?.name || '這個分類'}」 下尚未存有任何巨集演劇劇本。`}
                      </p>
                    </div>

                    {!searchQuery && activeCategory && (
                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={handleOpenCreateMacro}
                          className="px-4.5 py-1.8 bg-white hover:bg-stone-50 border border-[#D1CEC7] text-[#1A1A1A] text-xs font-bold rounded shadow-sm hover:shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <LucideIcon name="plus" size={12} />
                          <span>建立您的第一條巨集</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-16 border border-dashed border-[#D1CEC7] rounded bg-[#FAF9F5] text-center space-y-4">
                <p className="text-stone-500">目前沒有角色，請先新增一位角色吧！</p>
                <button
                  onClick={() => setIsAddCharOpen(true)}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white text-xs font-bold rounded cursor-pointer transition select-none"
                >
                  新增第一個角色
                </button>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* FOOTER LORE DISCUSSIONS */}
      <footer className="mt-20 text-center text-[11px] text-stone-500 max-w-4xl mx-auto px-4 py-6 border-t border-[#D1CEC7] space-y-2 select-none italic">
        <p className="font-sans not-italic text-stone-700 font-bold mb-1">
          設計製作：閻羅＠奧汀
        </p>
        <p>Atelier FF14 RP Macro Studio © 2026. Designed for Final Fantasy XIV Roleplay Drama Actors.</p>
        <p className="leading-relaxed text-[10.5px]">
          ⚠️ <strong>免責聲明：</strong> 本站為第三方玩家同人性質之輔助工具網體，與《FINAL FANTASY XIV》官方團隊（SQUARE ENIX）無任何商業合作或官方向屬關係。本工具完全採用純前端網頁快取儲存，絕不收集或上傳您的個人隱私、對話與帳號資料。所有資料均存於您當前的瀏覽器中，如有更換瀏覽器或清除緩存需求，請務必定期使用「匯出」備份存檔。
        </p>
        <p className="leading-relaxed text-[10.5px]">
          💡 <strong>巨集使用技巧：</strong> 在遊戲中按 Esc 選單選「巨集管理」，隨後在這裡挑選您需要的段子點擊「複製完整巨集」並在遊戲中貼上，即可一鍵演戲！使用「單行點擊複製」功能，您可以完美掌控跟群眾、客人間一言一行的精緻語音速率噢喵。
        </p>
      </footer>

      {/* MODAL 1: MACRO FORM (CREATE/EDIT) */}
      {isMacroFormOpen && (
        <MacroForm
          macro={editingMacro}
          categoryName={activeCategory?.name || '目前分頁'}
          onSave={handleSaveMacro}
          onCancel={() => setIsMacroFormOpen(false)}
        />
      )}

      {/* MODAL 2: IMPORT EXPORT BACKUPS */}
      {isImportExportOpen && (
        <ImportExportModal
          currentData={data}
          onImport={handleImportData}
          onClose={() => setIsImportExportOpen(false)}
        />
      )}

      {/* MODAL 3: ADD NEW CHARACTER */}
      {isAddCharOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFDFB] border border-[#D1CEC7] max-w-md w-full rounded-lg p-6 space-y-4 shadow-xl animate-scale animate-scale">
            <div className="flex items-center justify-between border-b border-[#E6E3DC] pb-3">
              <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                👥 建立新角色配置檔
              </h3>
              <button
                onClick={() => setIsAddCharOpen(false)}
                className="text-stone-400 hover:text-[#1A1A1A]"
              >
                <LucideIcon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold block">角色暱稱（Actor / Character Name）</label>
                <input
                  type="text"
                  required
                  placeholder="例如：提亞拉·阿露露 / 雷恩少爺"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full bg-white border border-[#D1CEC7] focus:border-[#1A1A1A] rounded-md px-3 py-2 text-xs text-[#1A1A1A] placeholder-stone-400 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold block">所屬伺服器 / 大區 (Server / DC)</label>
                <input
                  type="text"
                  placeholder="例如：Mana - Chocobo 或 艾奧傑亞 - 狗區"
                  value={newCharServer}
                  onChange={(e) => setNewCharServer(e.target.value)}
                  className="w-full bg-white border border-[#D1CEC7] focus:border-[#1A1A1A] rounded-md px-3 py-2 text-xs text-[#1A1A1A] placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E3DC]">
              <button
                onClick={() => setIsAddCharOpen(false)}
                className="px-3 py-1.5 bg-white border border-[#D1CEC7] text-stone-600 rounded-md text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddNewCharacter}
                disabled={!newCharName.trim()}
                className={`px-4.5 py-1.5 rounded-md text-xs font-semibold select-none flex items-center transition duration-250 cursor-pointer ${
                  !newCharName.trim()
                    ? 'bg-stone-100 text-stone-400 border border-[#E6E3DC] cursor-not-allowed'
                    : 'bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white'
                }`}
              >
                確認創建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: USER MANUAL TUTORIAL */}
      {isTutorialOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in animate-fade-in">
          <div className="bg-[#FDFDFB] border border-[#D1CEC7] max-w-lg w-full rounded-lg p-6 space-y-5 shadow-2xl animate-scale relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#8c6717]" />
            
            <div className="flex items-center justify-between border-b border-[#E6E3DC] pb-3">
              <div className="space-y-0.5">
                <span className="text-[9.5px] text-[#8c6717] font-mono tracking-widest uppercase block font-bold">
                  ATELIER MACRO SUITE MANUAL
                </span>
                <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  🎭 巨集工坊 ‧ RP玩家使用指南
                </h3>
              </div>
              <button
                onClick={handleCloseTutorial}
                className="text-stone-400 hover:text-[#1A1A1A] p-1 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <LucideIcon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700 max-h-[55vh] overflow-y-auto pr-1">
              <p className="leading-relaxed">
                歡迎來到 <strong>Atelier Macro Studio (巨集工坊)</strong>！這是一個專為愛好艾奧傑亞演劇、餐飲酒館、冒險RP演繹角色打造的精悍劇本巨集管理座艙。請查閱下方簡明使用要訣：
              </p>

              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-[#FAF2E1] border border-[#ebdcb3] text-[#8c6717] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-stone-900 flex items-center gap-1">
                      <span>👤 多演員角色卡與獨立分頁</span>
                    </h4>
                    <p className="leading-relaxed text-[11px] text-stone-500">
                      您可於左側欄「建立新角色存檔」為不同演員設定個資與伺服器。每個角色自備獨立的劇本分頁索引，點擊「新增分頁分類」能替您的台詞分類（例如：日常招呼、服務交談、戰鬥演武）。
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-[#FAF2E1] border border-[#ebdcb3] text-[#8c6717] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-stone-900">
                      <span>✍️ 巨集編寫（智慧行數偵測）</span>
                    </h4>
                    <p className="leading-relaxed text-[11px] text-stone-500">
                      點選右上角「新增 RP 巨集」可挑選情境標籤、設定燙金配色、撰寫台詞。若劇本單行超長（超過遊戲寬度）或總行數超過 FFXIV 限制的 15 行，系統會自動在卡片以紅框高亮警告，確保您的巨集絕不卡句！
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-[#FAF2E1] border border-[#ebdcb3] text-[#8c6717] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-stone-900">
                      <span>★ 喜好收藏與跨分頁快捷置頂</span>
                    </h4>
                    <p className="leading-relaxed text-[11px] text-stone-500">
                      每個宏卡片右上角都有可愛的金色五角星，點亮即可加入「常用置頂收藏」分類中。不僅跨越所有頁面，還會突出高亮排序在首位，非常適合用在急需緊急切換交際對話的黃金台詞。
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-[#FAF2E1] border border-[#ebdcb3] text-[#8c6717] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-stone-900">
                      <span>🎭 雙向完美的演技說演機制</span>
                    </h4>
                    <p className="leading-relaxed text-[11px] text-stone-500">
                      <strong>【一鍵複製完整巨集】</strong>：可整段帶走，去到遊戲 ESC 的「巨集管理」黏貼即可一鍵整段播放。
                      <br />
                      <strong>【單行點唱說演】</strong>：點擊「單行對白」會單獨複製該句，讓您能在人潮擁擠的場合隨心、自主控制氣氛間隔逐句口吐珠璣。
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-[#E6E3DC] text-[10.5px] text-stone-500 leading-relaxed font-sans">
                🔐 <strong>本地隨時匯出</strong>：本站所有對白直接存在您現在的這個瀏覽器中。多設備遊玩或清理電腦前，請記得於右上角使用「匯入/匯出」功能將代碼導出並保存發布至雲端。
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E6E3DC]">
              <button
                onClick={handleCloseTutorial}
                className="w-full sm:w-auto px-6 py-2 bg-[#1A1A1A] hover:bg-[#2D2D2A] text-white text-xs font-bold rounded shadow-sm cursor-pointer transition select-none text-center"
              >
                我已瞭解，開啟舞台說演！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
