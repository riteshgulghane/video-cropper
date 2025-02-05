import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'videoTime',
})
export class VideoTimePipe implements PipeTransform {
  transform(seconds: number, format: string): string {
    let formattedMins = '00';
    let formattedSecs = '00';
    let formattedHrs = '00';

    if (Number.isFinite(seconds) && seconds >= 0) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      formattedMins = String(mins).padStart(2, '0');
      formattedSecs = String(secs).padStart(2, '0');
      formattedHrs = String(hrs).padStart(2, '0');
    }

    return format
      .replace('hh', formattedHrs)
      .replace('mm', formattedMins)
      .replace('ss', formattedSecs);
  }
}
