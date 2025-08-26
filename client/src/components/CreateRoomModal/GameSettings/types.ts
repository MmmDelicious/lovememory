export interface GameSettingsProps {
  onSettingsChange: (settings: any) => void;
  initialSettings: any;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SettingField {
  key: string;
  label: string;
  type: 'select' | 'radio' | 'number' | 'toggle';
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue: any;
}
