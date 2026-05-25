export interface Macro {
  id: string;
  title: string;
  content: string;
  description?: string;
  icon: string; // lucide icon name
  color: 'gold' | 'blue' | 'green' | 'purple' | 'rose' | 'slate';
  isPinned?: boolean;
}

export interface TabCategory {
  id: string;
  name: string;
  macros: Macro[];
}

export interface CharacterConfig {
  id: string;
  characterName: string;
  serverName: string; // e.g., "Bahamut", "Tonberry", "Mana/Chocobo"
  categories: TabCategory[];
}

export interface OrganizerData {
  characters: CharacterConfig[];
  activeCharacterId: string;
}
