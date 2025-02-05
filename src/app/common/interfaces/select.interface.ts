export interface ISelectOption {
  label: string;
  value: string;
}

export interface ISelectProps {
  options: ISelectOption[];
  value: string;
  onChange: (value: string) => void;
}
