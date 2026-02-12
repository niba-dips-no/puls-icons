export type IconSource = 'material' | 'puls';

export type IconMeta = {
  name: string;
  source: IconSource;
  keywords?: string[];
  file?: string;
};

export type PulsIconEntry = {
  name: string;
  keywords?: string[];
  file: string;
};

export type PluginMessage =
  | { type: 'insert-icon'; svg: string; name: string }
  | { type: 'resize'; width: number; height: number }
  | { type: 'notify'; message: string };
