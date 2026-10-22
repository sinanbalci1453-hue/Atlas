export type JarvisState = 'standby' | 'awake' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  toolUsed?: string;
  toolResult?: any;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface SystemTelemetry {
  status: string;
  timestamp: number;
  latency: string;
  cores: number;
  memory: string;
  uptime: string;
  hasApiKey: boolean;
  activeTasks: number;
  model?: string;
}

export interface VoiceSettings {
  pitch: number;
  rate: number;
  volume: number;
  autoWake: boolean;
  soundChime: boolean;
  mode: 'jarvis' | 'atlas';
  theme: 'cyan' | 'crimson' | 'matrix' | 'violet';
}

