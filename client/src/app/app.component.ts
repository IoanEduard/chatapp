import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter, fromEvent, map } from 'rxjs';
import { AuthService } from './services/auth.service';
import { HubService } from './services/hub.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  
  loggedIn!: boolean;

  constructor(private router: Router, public authService: AuthService, private hubService: HubService) { }

  @HostListener('window:storage')
  onStorageChange() {
    console.log('reached')
    this.hubService.hubConnection.invoke('OnDisconnectedAsync')
    .catch(err => console.error(err)).finally(() => {
      console.log('reached')
    });
  }

  ngOnInit() {

    // if (!this.startup.startupData) {
    //     // assign a random username and a random photo
    //     // store it in an object along with connection list
    // }
    this.authService.isLoggedIn();
  }
}

