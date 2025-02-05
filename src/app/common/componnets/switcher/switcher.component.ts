import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ISwitcher } from '../../interfaces/switcher.interfaces';

@Component({
  selector: 'app-switcher',
  templateUrl: './switcher.component.html',
  styleUrls: ['./switcher.component.scss'],
})
export class SwitcherComponent implements OnInit {
  @Input() model: ISwitcher[] = []; // Default state
  @Input() value: string = ''; // Default state
  @Output() toggled = new EventEmitter<string>();

  ngOnInit() {}

  toggle(selectedValue: string) {
    this.value = selectedValue;
    this.toggled.emit(this.value); // Emit the new state
  }

  isSelected(selectedValue: string) {
    return selectedValue === this.value;
  }
}
