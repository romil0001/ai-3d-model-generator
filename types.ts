
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  specs: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StatsData {
  name: string;
  efficiency: number;
  uptime: number;
  battery: number;
}
