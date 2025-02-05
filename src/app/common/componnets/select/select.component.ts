import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { ISelectOption } from '../../interfaces/select.interface';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent {
  @Input() options: ISelectOption[] = []; // List of dropdown options
  @Input() selected: string | null = null; // List of dropdown options
  @Input() placeholder: string = 'Select an option';
  @Output() selectedChange = new EventEmitter<string>();

  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: string) {
    this.selected = option;
    this.selectedChange.emit(option);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    if (!(event.target as HTMLElement).closest('.custom-select')) {
      this.isOpen = false;
    }
  }
}
