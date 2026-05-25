import React from 'react';
import {
  Sword,
  Shield,
  Beer,
  Wine,
  Coffee,
  Cake,
  Sparkles,
  Heart,
  Smile,
  Music,
  Coins,
  BookOpen,
  MessageSquare,
  FileText,
  Star,
  Volume2,
  User,
  Trash2,
  Copy,
  Check,
  Plus,
  Eye,
  Sliders,
  Download,
  Upload,
  Globe,
  Settings,
  Edit,
  X,
  Search,
  Book,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Info,
  AlertTriangle
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  sword: Sword,
  shield: Shield,
  beer: Beer,
  wine: Wine,
  coffee: Coffee,
  cake: Cake,
  sparkles: Sparkles,
  heart: Heart,
  smile: Smile,
  music: Music,
  coin: Coins,
  book: BookOpen,
  'message-square': MessageSquare,
  edit: FileText,
  star: Star,
  speech: Volume2,
  user: User,
  trash: Trash2,
  copy: Copy,
  check: Check,
  plus: Plus,
  eye: Eye,
  sliders: Sliders,
  download: Download,
  upload: Upload,
  globe: Globe,
  settings: Settings,
  pencil: Edit,
  x: X,
  search: Search,
  bookIcon: Book,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  refresh: RefreshCw,
  info: Info,
  alert: AlertTriangle
};

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const LucideIcon: React.FC<LucideIconProps> = ({ name, className = '', size = 18 }) => {
  const IconComponent = iconMap[name] || Star;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_MACRO_ICONS = [
  { name: 'smile', label: '😊 招呼微笑', icon: 'smile' },
  { name: 'message-square', label: '💬 聊天對話', icon: 'message-square' },
  { name: 'beer', label: '🍺 麥酒飲品', icon: 'beer' },
  { name: 'wine', label: '🍷 紅酒佳釀', icon: 'wine' },
  { name: 'coffee', label: '☕ 溫馨咖啡', icon: 'coffee' },
  { name: 'cake', label: '🍰 羅蘭美味', icon: 'cake' },
  { name: 'sparkles', label: '✨ 萌萌魔法', icon: 'sparkles' },
  { name: 'heart', label: '❤️ 心動粉紅', icon: 'heart' },
  { name: 'music', label: '🎵 音樂演奏', icon: 'music' },
  { name: 'coin', label: '💰 金幣交易', icon: 'coin' },
  { name: 'book', label: '📖 菜單資料', icon: 'book' },
  { name: 'sword', label: '⚔️ 兵刃戰鬥', icon: 'sword' },
  { name: 'shield', label: '🛡️ 御盾守護', icon: 'shield' },
  { name: 'star', label: '⭐ 特別企劃', icon: 'star' },
  { name: 'edit', label: '📝 水晶日誌', icon: 'edit' },
  { name: 'speech', label: '🗣️ 特設宣傳', icon: 'speech' },
  { name: 'user', label: '👤 個人設定', icon: 'user' }
];
