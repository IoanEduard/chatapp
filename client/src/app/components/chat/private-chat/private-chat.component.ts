import { Component, ComponentRef, EventEmitter, Output} from '@angular/core';
import { HubConnection } from '@microsoft/signalr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { LoginComponent } from '../../auth/login/login.component';
import { ChatComponent } from '../chat.component';
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'app-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.scss'],
  animations: []
})

export class PrivateChatComponent {
  @Output() messageEvent: EventEmitter<any> = new EventEmitter<any>();

  receiverConnectionId!: string;
  receiverName!: string;

  senderConnectionId!: string;
  senderName!: string;

  messageSendBy: string = '';
  clientConnectionId: string = '';
  privateMessage = '';
  privateMessages: {
    img: any,
    message: string
  }[] = [];
  responseConnectionId: string = '';
  responseName: string = '';
  isResponse: boolean = true;
  visible: boolean = false;
  tabName: string = '';
  newMessage: boolean = false;
  newMessageAnimation: string = 'open';
  componentIndex: number = 0;
  photoUrl: any;

  public textArea: string = '';
  public isEmojiPickerVisible: boolean = false;

  hubConnection!: HubConnection;
  enabledLastTabIndex: number = 0;
  componentRefTabs: { component: ComponentRef<PrivateChatComponent>, visible: boolean }[]
    = [] as { component: ComponentRef<PrivateChatComponent>, visible: boolean }[];

  constructor(private modalService: NgbModal,
    public authService: AuthService, private chatComponent: ChatComponent, private helperService: HelperService) {
  }

  sendPrivateMessage(event: any) {
    this.photoUrl = JSON.parse(localStorage.getItem('user_profile')!).photoUrl;
    this.privateMessage = event;
    this.helperService.emitPrivateMessage(event);
  }

  openLogin() {
    this.modalService.open(LoginComponent);
  }

  logout() {
    this.authService.logout();
  }

  openTab(i: any) {
    this.newMessage = false;
    if (this.chatComponent.enabledLastTabIndex !== i) {
      this.chatComponent.openTab(i);
      // this.visible = false;
    }
  }

  destroyTab(i: any) { }

  selectMain() {
    this.chatComponent.rootChatOpen = true;
    this.visible = false;
  }
}