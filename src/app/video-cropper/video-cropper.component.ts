import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import { ISwitcher } from "../common/interfaces/switcher.interfaces";
import { ISelectOption } from "../common/interfaces/select.interface";
import {
  AspectRationOptions,
  PlaybackSpeedOptions,
  Sessions,
  SwitcherModel,
} from "../common/constants";
import { ActivityService } from "../common/services/activity.service";
import { Activity } from "../common/interfaces/Activity.interface";

@Component({
  selector: "app-video-cropper",
  templateUrl: "./video-cropper.component.html",
  styleUrls: ["./video-cropper.component.scss"],
})
export class VideoCropperComponent implements AfterViewInit {
  @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild("canvasElement") canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild("previewCanvasElement")
  previewCanvasElement!: ElementRef<HTMLCanvasElement>;

  readonly gridColor = "rgba(255, 255, 255, 0.5)";
  readonly gridLineWidth = 1;
  readonly Sessions = Sessions;
  readonly switcherModel: ISwitcher[] = SwitcherModel;
  readonly playbackSpeedOptions: ISelectOption[] = PlaybackSpeedOptions;
  readonly aspectRationOptions: ISelectOption[] = AspectRationOptions;

  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private previewCanvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private previewContext!: CanvasRenderingContext2D;

  private isDragging = false;
  private isResizing = false;
  private dragStartX = 0;
  private resizeStartX = 0;

  private cropX = 0;
  private cropY = 0;
  private cropWidth = 0;
  private cropHeight = 0;

  selectedPlaybackSpeed = "1x";
  selectedAspectRation = "9:16";
  currentSession = this.switcherModel[1].value;

  storedActivities: Activity[] = [];

  isPlaying = false;
  isMuted = false;
  isPreviewAvailable = false;
  currentTime = 0;
  videoDuration = 0;
  previewWidth = 0;
  previewHeight = 0;
  volume = 1;

  playbackInterval: any;

  get isPreviewSession(): boolean {
    return this.currentSession === Sessions.PREVIEW;
  }

  constructor(private activityService: ActivityService) {}

  ngAfterViewInit(): void {
    this.video = this.videoElement.nativeElement;

    this.canvas = this.canvasElement?.nativeElement;
    if (this.previewCanvasElement) {
      this.previewCanvas = this.previewCanvasElement.nativeElement;
      this.previewContext = this.previewCanvas.getContext("2d")!;
    }
    if (this.canvas) this.context = this.canvas.getContext("2d")!;

    this.video.ontimeupdate = () => {
      this.currentTime = this.video.currentTime;
    };
  }

  onVideoLoaded(): void {
    if (this.canvas) this.setCropper();
    this.videoDuration = this.video.duration;
  }

  setCropper() {
    this.canvas.width = this.video.clientWidth;
    this.canvas.height = this.video.clientHeight;

    this.cropWidth = this.canvas.width / 3;
    this.cropHeight = this.canvas.height / 3;
    if (this.previewCanvas) {
      this.previewCanvas.width = this.cropWidth;
      this.previewCanvas.height = this.canvas.height;
    }
    this.drawGrid();

    this.updatePreview();
  }

  @HostListener("mousedown", ["$event"])
  onMouseDown(event: MouseEvent): void {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      if (mouseX >= this.cropX && mouseX <= this.cropX + this.cropWidth) {
        if (Math.abs(mouseX - this.cropX) < 10) {
          this.isResizing = true;
          this.resizeStartX = mouseX;
        } else if (Math.abs(mouseX - (this.cropX + this.cropWidth)) < 10) {
          this.isResizing = true;
          this.resizeStartX = mouseX;
        } else {
          this.isDragging = true;
          this.dragStartX = mouseX - this.cropX;
          this.canvas.style.cursor = "grabbing";
        }
      }
    }
  }

  @HostListener("mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging || this.isResizing) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      if (this.isDragging) {
        this.cropX = mouseX - this.dragStartX;
        this.cropX = Math.max(
          0,
          Math.min(this.cropX, this.canvas.width - this.cropWidth)
        );
      } else if (this.isResizing) {
        const deltaX = mouseX - this.resizeStartX;
        if (Math.abs(mouseX - this.cropX) < 10) {
          this.cropX += deltaX;
          this.cropWidth -= deltaX;
        } else {
          this.cropWidth += deltaX;
        }
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
    }
  }

  @HostListener("mouseup")
  onMouseUp(): void {
    if (this.canvas) {
      this.isDragging = false;
      this.isResizing = false;
      this.canvas.style.cursor = "grab";
    }
  }

  downloadCroppedVideo(): void {
    const dataUrl = this.canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "cropped-video-frame.png";
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
    this.selectedPlaybackSpeed = speed;
  }

  onAspectRatioChange(aspectRation: string): void {
    const [height, width] = aspectRation.split(":");

    this.cropWidth = this.canvas.height * (+height / +width);

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

    this.context.strokeStyle = "red";
    this.context.lineWidth = 2;
    this.context.strokeRect(this.cropX, 0, this.cropWidth, this.canvas.height);
    this.updatePreview();
  }

  updatePreview(): void {
    const xStart =
      ((this.video.videoWidth / this.canvas.width) * this.cropX * 2) / 3;
    const xEnd =
      ((this.video.videoWidth / this.canvas.width) *
        (this.cropX + this.cropWidth) *
        2) /
      3;

    const width = (this.video.videoWidth / this.canvas.width) * this.cropWidth;
    const yStart = (this.video.videoHeight / this.canvas.height) * 60;

    this.previewWidth = width;
    this.previewHeight = this.canvas.height;

    if (this.previewContext)
      this.previewContext.drawImage(
        this.video,
        xStart,
        yStart,
        xEnd,
        1080,
        0,
        0,
        this.previewWidth,
        this.previewHeight
      );

    if (!this.isPreviewSession && this.playbackInterval) this.captureActivity();
  }

  onToggleSession(session: string) {
    this.currentSession = session;
    if (session === Sessions.PREVIEW) this.isPreviewAvailable = true;
  }

  toggleCropper(state: boolean) {
    this.isPreviewAvailable = state;
    if (state) {
      setTimeout(() => {
        this.setCropper();
      }, 1000);
      this.activityService.resetActivities();
      this.startCapturing();
    } else {
      this.stopCapturing();
    }
  }

  onStartPreview() {
    if (this.playbackInterval) clearInterval(this.playbackInterval);
    if (this.video.played) {
      this.storedActivities = [...this.activityService.activities];
      let index = 0;
      this.video.play();
      this.playbackInterval = setInterval(() => {
        this.setPreviewData(this.storedActivities[index++]);
        if (index >= this.storedActivities.length) {
          clearInterval(this.playbackInterval);
        }
      }, 10);
    }
  }

  setPreviewData(currentState: Activity) {
    const [coordX, CoordY, width, height] = currentState.coordinates;

    this.cropX = coordX;
    this.cropY = CoordY;
    this.cropWidth = width;
    this.cropHeight = height;

    this.previewCanvas.width = width;
    this.previewCanvas.height = height;
    this.video.currentTime = currentState.timeStamp;
    this.video.playbackRate = currentState.playbackRate;
    this.video.volume = currentState.volume;

    this.updatePreview();
  }

  onGeneratePreview(): void {
    this.activityService.generateJson();
  }

  captureActivity() {
    const match = this.selectedPlaybackSpeed.match(/[\d.]+/);
    const speed = match ? parseFloat(match[0]) : 0;

    const recentActivity: Activity = {
      timeStamp: this.currentTime,
      coordinates: [
        this.cropX,
        this.cropY,
        this.previewWidth,
        this.previewHeight,
      ],
      volume: this.volume,
      playbackRate: speed,
    };

    this.activityService.updateActivity(recentActivity);
  }

  startCapturing() {
    this.playbackInterval = setInterval(() => {
      if (this.canvas) this.updatePreview();
    }, 10);
  }

  stopCapturing() {
    clearInterval(this.playbackInterval);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        this.activityService.activities = json;
      } catch (error) {
        console.error("Invalid JSON file:", error);
      }
    };

    reader.readAsText(file);
  }
}
