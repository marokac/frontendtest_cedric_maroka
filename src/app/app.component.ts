import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  UserDatails: any = [];
  reqValue: object = {};
  imageValue: any = "";
  constructor(private http: HttpClient) {
    const user = this.http.get("https://randomuser.me/api/");
    user.subscribe((response: any) => {
      console.log("response --- ", response);
      this.mapresult(response.results);
      this.reqValue = {
        value: this.UserDatails[0].name,
        text: "Hi, my name is"
      };
    });
  }
  //{name:'user'},{name:'email'},{name:'calendar'},{name:'map-location'},{name:'call'},{name:'locked'}
  valueChangeEvent(e) {
    switch (e) {
      case "user": {
        this.reqValue = {
          value: this.UserDatails[0].name,
          text: "Hi, my name is"
        };
        break;
      }
      case "email": {
        this.reqValue = {
          value: this.UserDatails[0].email,
          text: "my email address is"
        };
        break;
      }
      case "calendar": {
        this.reqValue = {
          value: this.UserDatails[0].dob,
          text: "my birthday is"
        };
        break;
      }
      case "map-location": {
        this.reqValue = {
          value: this.UserDatails[0].location,
          text: "My address is"
        };
        break;
      }
      case "call": {
        this.reqValue = {
          value: this.UserDatails[0].cell,
          text: "My Phone number is"
        };
        break;
      }
      case "locked": {
        this.reqValue = {
          value: this.UserDatails[0].login,
          text: "My password is"
        };
        break;
      }
    }
    console.log(this.reqValue);
  }
  mapresult(value) {
    value.forEach(val => {
      console.log(val);
      this.UserDatails.push({
        cell: val.cell,
        email: val.email,
        dob: val.dob.date,
        gender: val.gender,
        location:
          val.location.street +
          " - " +
          val.location.city +
          " " +
          val.location.state,
        login: val.login.password,
        name: val.name.title + " " + val.name.first + " " + val.name.last,
        picture: val.picture.large
      });
      this.imageValue = this.UserDatails[0].picture;
    });
  }
}
