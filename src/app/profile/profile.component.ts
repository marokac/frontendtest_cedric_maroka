import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"]
})
export class ProfileComponent implements OnInit {
  @Output() valueChange = new EventEmitter();

  @Input() data: any;
  @Input() imageValue: any;

  icons = [
    { name: "user" },
    { name: "email" },
    { name: "calendar" },
    { name: "map-location" },
    { name: "call" },
    { name: "locked" }
  ];
  constructor() {}

  ngOnInit() {
    console.log(this.data);
  }
  mouseOverEvent(e) {
    console.log(this.data);
    this.valueChange.next(e);
  }
}
