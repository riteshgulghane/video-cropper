import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { VideoTimePipe } from './common/pipes/video-time.pipe';
import { VideoCropperComponent } from './video-cropper/video-cropper.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwitcherComponent } from './common/componnets/switcher/switcher.component';
import { SelectComponent } from './common/componnets/select/select.component';

@NgModule({
  declarations: [AppComponent, VideoCropperComponent, VideoTimePipe, SwitcherComponent, SelectComponent],
  imports: [BrowserModule, CommonModule, FormsModule],
  providers: [VideoTimePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}

