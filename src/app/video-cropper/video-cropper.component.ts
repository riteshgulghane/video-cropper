import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { ISwitcher } from '../common/interfaces/switcher.interfaces';
import { ISelectOption } from '../common/interfaces/select.interface';

@Component({
  selector: 'app-video-cropper',
  templateUrl: './video-cropper.component.html',
  styleUrls: ['./video-cropper.component.scss'],
})
export class VideoCropperComponent implements AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewCanvasElement')
  previewCanvasElement!: ElementRef<HTMLCanvasElement>;

  readonly switcherModel: ISwitcher[] = [
    {
      label: 'Preview Session',
      value: 'previewSession',
    },
    {
      label: 'Generate Session',
      value: 'generateSession',
    },
  ];

  readonly playbackSpeedOptions: ISelectOption[] = [
    {
      label: '0.5x',
      value: '0.5',
    },
    {
      label: '1x',
      value: '1',
    },
    {
      label: '1.5x',
      value: '1.5',
    },
    {
      label: '2x',
      value: '2',
    },
  ];

  readonly aspectRationOptions: ISelectOption[] = [
    {
      label: '9:18',
      value: '9:18',
    },
    {
      label: '9:16',
      value: '9:16',
    },
    {
      label: '4:3',
      value: '4:3',
    },
    {
      label: '3:4',
      value: '3:4',
    },
    {
      label: '1:1',
      value: '1:1',
    },
    {
      label: '4:5',
      value: '4:5',
    },
  ];

  selectedPlaybackSpeed = '1x';
  selectedAspectRation = '9:16';

  selectedSwitch = this.switcherModel[1].value;

  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private previewCanvas!: HTMLCanvasElement;

  private context!: CanvasRenderingContext2D;
  private previewContext!: CanvasRenderingContext2D;

  isPreviewAvailable = true;

  // Cropping rectangle properties

  private isDragging = false; // Whether the rectangle is being dragged
  private isResizing = false; // Whether the rectangle is being resized
  private dragStartX = 0; // Initial mouse position when dragging starts
  private resizeStartX = 0; // Initial mouse position when resizing starts

  private cropX = 100; // Initial x position of the cropping rectangle
  private cropWidth = 200; // Initial width of the cropping rectangle
  private cropY = 0;
  private cropHeight = 0;

  isPlaying = false;
  currentTime = 0;
  videoDuration = 0;
  isMuted = false;
  volume = 1; // Default volume (1 is 100%)

  private gridColor = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white grid lines
  private gridLineWidth = 1;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.video = this.videoElement.nativeElement;

    this.canvas = this.canvasElement?.nativeElement;
    if (this.previewCanvasElement) {
      this.previewCanvas = this.previewCanvasElement.nativeElement;
      this.previewContext = this.previewCanvas.getContext('2d')!;
    }
    if (this.canvas) this.context = this.canvas.getContext('2d')!;

    this.video.ontimeupdate = () => {
      this.currentTime = this.video.currentTime;
      if (this.canvas) this.updatePreview(); // Update the preview in real-time
    };
  }

  onVideoLoaded(): void {
    // Set canvas dimensions to match the video
    if (this.canvas) this.setCropper();
    // Set video duration
    this.videoDuration = this.video.duration;
  }

  setCropper() {
    // Draw the 3x3 grid
    this.canvas.width = this.video.clientWidth;
    this.canvas.height = this.video.clientHeight;

    this.cropWidth = this.canvas.width / 3;
    this.cropHeight = this.canvas.height / 3;
    if (this.previewCanvas) {
      this.previewCanvas.width = this.cropWidth;
      this.previewCanvas.height = this.canvas.height;
    }
    this.drawGrid();

    // Initialize the preview
    this.updatePreview();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      // Check if the mouse is inside the cropping rectangle
      if (mouseX >= this.cropX && mouseX <= this.cropX + this.cropWidth) {
        // Check if the mouse is near the edges for resizing
        if (Math.abs(mouseX - this.cropX) < 10) {
          this.isResizing = true;
          this.resizeStartX = mouseX;
        } else if (Math.abs(mouseX - (this.cropX + this.cropWidth)) < 10) {
          this.isResizing = true;
          this.resizeStartX = mouseX;
        } else {
          this.isDragging = true;
          this.dragStartX = mouseX - this.cropX;
          this.canvas.style.cursor = 'grabbing';
        }
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging || this.isResizing) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      if (this.isDragging) {
        // Move the cropping rectangle
        this.cropX = mouseX - this.dragStartX;
        // Ensure the rectangle stays within the canvas bounds
        this.cropX = Math.max(
          0,
          Math.min(this.cropX, this.canvas.width - this.cropWidth)
        );
      } else if (this.isResizing) {
        // Resize the cropping rectangle
        const deltaX = mouseX - this.resizeStartX;
        if (Math.abs(mouseX - this.cropX) < 10) {
          // Resize from the left
          this.cropX += deltaX;
          this.cropWidth -= deltaX;
        } else {
          // Resize from the right
          this.cropWidth += deltaX;
        }
        // Ensure the rectangle stays within the canvas bounds
        this.cropX = Math.max(
          0,
          Math.min(this.cropX, this.canvas.width - this.cropWidth)
        );
        this.cropWidth = Math.max(
          10,
          Math.min(this.cropWidth, this.canvas.width - this.cropX)
        );
        this.resizeStartX = mouseX;
      }

      this.drawGrid();

      // this.drawCroppingRectangle();
    }
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    if (this.canvas) {
      this.isDragging = false;
      this.isResizing = false;
      this.canvas.style.cursor = 'grab';
    }
  }

  cropVideo(): void {
    // Draw the cropped portion onto the canvas
    // this.previewContext.drawImage(
    //   this.video,
    //   this.cropX,
    //   0,
    //   this.cropWidth,
    //   this.cropHeight, // Source rectangle
    //   50,
    //   50,
    //   this.cropWidth,
    //   this.cropHeight // Destination rectangle
    // );
  }

  downloadCroppedVideo(): void {
    // Convert canvas to a data URL
    const dataUrl = this.canvas.toDataURL('image/png');

    // Create a temporary link to download the cropped image
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'cropped-video-frame.png';
    link.click();
  }

  togglePlayPause(): void {
    if (this.video.paused) {
      this.video.play();
      this.isPlaying = true;
    } else {
      this.video.pause();
      this.isPlaying = false;
    }
  }

  onSeek(event: Event): void {
    const target = event.target as HTMLInputElement;
    const time = parseFloat(target.value);
    this.video.currentTime = time;
  }

  onPlaybackSpeedChange(speed: string): void {
    this.video.playbackRate = parseFloat(speed);
  }

  onAspectRatioChange(aspectRation: string): void {
    const [height, width] = aspectRation.split(':');

    this.cropWidth = this.canvas.height * (+height / +width);

    // this.cropWidth =  (originalWidth / originalHeight) * containerHeight;
    this.drawGrid();
    this.resetPreview();
  }

  resetPreview(): void {
    this.previewCanvas.width = this.cropWidth;
    this.previewCanvas.height = this.canvas.height;
    this.updatePreview();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.video.muted = this.isMuted;
  }

  onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.volume = parseFloat(target.value);
    this.video.volume = this.volume;

    if (this.isMuted && this.volume > 0) {
      this.isMuted = false;
      this.video.muted = false;
    }
  }

  drawGrid(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.context.clearRect(0, 0, width, height);

    for (let i = 1; i < 3; i++) {
      const x = this.cropX + (this.cropWidth / 3) * i;
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, height);
      this.context.strokeStyle = this.gridColor;
      this.context.lineWidth = this.gridLineWidth;
      this.context.stroke();
    }

    for (let i = 1; i < 3; i++) {
      const y = (height / 3) * i;
      this.context.beginPath();
      this.context.moveTo(this.cropX, y);
      this.context.lineTo(this.cropX + this.cropWidth, y);
      this.context.strokeStyle = this.gridColor;
      this.context.lineWidth = this.gridLineWidth;
      this.context.stroke();
    }

    this.context.strokeStyle = 'red';
    this.context.lineWidth = 2;
    this.context.strokeRect(this.cropX, 0, this.cropWidth, this.canvas.height);
    this.updatePreview();
  }

  updatePreview(): void {
    const box = this.canvas.getBoundingClientRect();

    const xStart =
      ((this.video.videoWidth / this.canvas.width) * this.cropX * 2) / 3;
    const xEnd =
      ((this.video.videoWidth / this.canvas.width) *
        (this.cropX + this.cropWidth) *
        2) /
      3;

    const width = (this.video.videoWidth / this.canvas.width) * this.cropWidth;
    const height =
      (this.video.videoHeight / this.canvas.height) * this.cropHeight;

    const yStart = (this.video.videoHeight / this.canvas.height) * 60;

    if (this.previewContext)
      this.previewContext.drawImage(
        this.video,
        xStart,
        yStart,
        xEnd,
        1080, // Source rectangle
        0,
        0,
        width,
        this.canvas.height // Destination rectangle
      );
  }

  onToggle(state: string) {
    console.log('Switcher State:', state);
  }

  toggleCropper(state: boolean) {
    this.isPreviewAvailable = state;
    if (state) {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.setCropper();
      }, 1000);
    }
  }
}
