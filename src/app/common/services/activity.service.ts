import { Injectable } from "@angular/core";
import { Activity } from "../interfaces/Activity.interface";

@Injectable({
  providedIn: "root",
})
export class ActivityService {
  _activities: Activity[] = [];

  updateActivity(activity: Activity): void {
    this._activities.push(activity);
  }

  resetActivities(): void {
    this._activities = [];
  }

  generateJson() {
    this.saveToFile();
  }

  saveToFile() {
    const jsonString = JSON.stringify(this._activities, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  get activities(): Activity[] {
    return this._activities;
  }

  set activities(activities: Activity[]) {
    this._activities = activities;
  }
}
