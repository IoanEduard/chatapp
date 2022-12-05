import { AfterViewInit, Component, ComponentFactoryResolver, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { HelperService } from 'src/app/services/helper.service';
import { HubService } from 'src/app/services/hub.service';
import { PrivateChatComponent } from './private-chat/private-chat.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { LoginComponent } from '../auth/login/login.component';
import { Subject } from 'rxjs';
import { EditProfileModalComponent } from './edit-profile-modal/edit-profile-modal.component';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewInit {
	_listener: any;
	openedTabIndex!: 0;
	closeResult = '';
	images: { 'name': string }[] = [];
	username = '';
	userid!: number;
	connectionId = '';
	clientConnectionId = '';
	photo: any;
	messages: {
		img: any,
		message: string
	}[] = [];
	updateProfileDto: {
		name: string,
		photoUrl: string
	} = {} as { name: string, photoUrl: string };

	privateMessages: BehaviorSubject<{
		img: any,
		message: string
	}> = new BehaviorSubject<{
		img: any,
		message: string
	}>(null as any);

	privateChats: string[] = []
	photoBackend: any;

	connections: { [key: string]: Array<string> } = {};

	componentRef!: ComponentRef<PrivateChatComponent>;
	componentRefTabs: { component: ComponentRef<PrivateChatComponent>, visible: boolean }[]
		= [] as { component: ComponentRef<PrivateChatComponent>, visible: boolean }[];

	enabledLastTabIndex: number = 0;

	publicIdPhotoToDelete: string = '';

	public textArea: string = '';
	public isEmojiPickerVisible: boolean = false;

	tabName = '';

	@ViewChild('componentHolder', { read: ViewContainerRef }) componentHolder!: ViewContainerRef;

	rootChatOpen: boolean = true;

	openModalEventSubject: Subject<any> = new Subject<any>();

	constructor(
		private modalService: NgbModal,
		public authService: AuthService,
		private hubService: HubService,
	private componentFactoryResolver: ComponentFactoryResolver,
		private helperService: HelperService) { }

	ngOnInit() {
		const userProfile = JSON.parse(localStorage.getItem('user_profile')!)
		this.userid = userProfile ? userProfile['id'] : -1;

		this.setAuthenticatedProfile();

		this.hubService.setToken();
		this.hubService.startConnection();

		this.updateConnectionList();
		this.sendMessageSignalRCallback();
		this.sendPrivateMessageToUserSignalRCallback();
		this.getConnectionIdSignalRCallback();
		this.getYourUsernameCallback();

		this.helperService.privteMessage$.subscribe(message => {
			this.sendPrivateMessage();
		});

		this.updateConnectionUserName();
	}

	ngAfterViewInit() {
		window.addEventListener("storage", this._listener, false);
	}

	public sendMessage(messageEvent: any) {
		if (!this.connectionId) {
			this.hubService.hubConnection
				.invoke('SendMessage', this.username, this.photo, messageEvent)
				.catch(err => console.error(err))
				.finally(() => { });
		}
	}

	public sendPrivateMessage() {
		let componentInstance = this.componentRefTabs[this.enabledLastTabIndex].component.instance;

		if (componentInstance.isResponse) {
			componentInstance.receiverConnectionId = componentInstance.responseConnectionId;
			componentInstance.receiverName = componentInstance.responseName;
		}

		this.hubService.hubConnection
			.invoke('SendMessageToUser', componentInstance.receiverName,
				componentInstance.receiverConnectionId,
				componentInstance.senderConnectionId,
				componentInstance.privateMessage,
				componentInstance.senderName,
				componentInstance.photoUrl)
			.catch(err => console.error(err))
			.finally(
				() => {
					const text = `${componentInstance.senderName}: ${componentInstance.privateMessage}`;
					componentInstance.privateMessages.push({ img: componentInstance.photoUrl, message: text });
					componentInstance.privateMessage = '';
				}
			)
	}

	public createNewPrivateMessageComponent(senderName: string, senderConnectionId: any): void {
		const exists = this.privateChats.includes(senderConnectionId.toString());
		if (!exists) {
			const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PrivateChatComponent);
			this.componentRef = this.componentHolder.createComponent(componentFactory);

			this.componentRef.instance.receiverConnectionId = senderConnectionId.toString();
			this.componentRef.instance.receiverName = senderName;

			this.componentRef.instance.senderConnectionId = this.clientConnectionId;
			this.componentRef.instance.senderName = this.username;

			this.componentRef.instance.isResponse = false;
			this.componentRef.instance.clientConnectionId = this.clientConnectionId;

			this.privateChats.push(senderConnectionId.toString());

			this.enabledLastTabIndex = this.componentRefTabs.push({
				component: this.componentRef,
				visible: true
			}) - 1;

			this.componentRefTabs[this.enabledLastTabIndex].component.instance.componentIndex = this.enabledLastTabIndex;
			this.componentRefTabs[this.enabledLastTabIndex].component.instance.visible = true;
			this.componentRefTabs[this.enabledLastTabIndex].component.instance.tabName = senderName;

			this.tabName = senderName;
			this.rootChatOpen = false;

			if (this.enabledLastTabIndex > 0)
				this.componentRefTabs[this.enabledLastTabIndex - 1].component.instance.visible = false;

			this.componentRef.instance.componentRefTabs = this.componentRefTabs;
		}
	}

	public openTab(i: any) {
		this.componentRefTabs[this.enabledLastTabIndex].component.instance.visible = false;
		this.componentRefTabs[i].component.instance.visible = true;
		this.componentRefTabs[i].component.instance.newMessage = false;
		this.enabledLastTabIndex = i;
		this.rootChatOpen = false;
	}

	public messageOpened(event: any) {
		this.componentRefTabs[this.enabledLastTabIndex].component.instance.newMessage = false;
	}

	public selectMain() {
		if (this.enabledLastTabIndex !== -1) {
			this.enabledLastTabIndex = -1;
			this.rootChatOpen = !this.rootChatOpen;
			this.componentRefTabs[this.enabledLastTabIndex].component.instance.visible = false;
		}
	}

	public destroyTab(i: any) {
		this.componentRefTabs[i].component.destroy();
		this.componentRefTabs.splice(i, 1);
	}

	public openLogin() {
		this.modalService.open(LoginComponent);
	}

	public logout() {
		this.authService.logout();
	}

	private updateConnectionList() {
		this.hubService.hubConnection.on('UpdateConnectionsList', (connections) => {
			this.connections = connections;

			delete this.connections[this.username];
		});
	}

	private updateConnectionUserName() {
		this.hubService.hubConnection.on('UpdateConnectionUserName', (oldKey, newKey) => {
			delete Object.assign(this.connections, { [newKey]: this.connections[oldKey] })[oldKey];

			const profile = JSON.parse(localStorage.getItem('user_profile')!);
			profile.username = newKey;
			this.setProfile(profile);

			delete this.connections[this.username];
		});
	}

	private getYourUsernameCallback() {
		if (!this.hubService.localStorageProfile) {
			this.hubService.hubConnection.on('GetYourUsername', (userprofile) => {
				this.setProfile(userprofile);
				localStorage.setItem('user_profile', JSON.stringify(userprofile));
			});
		}
		else {
			const profile = JSON.parse(localStorage.getItem('user_profile')!);
			this.setProfile(profile);
		}
	}

	private sendMessageSignalRCallback() {
		this.hubService.hubConnection
			.on('SendMessage', (username: string, photoUrl: any, message: string) => {
				const text = `${username}: ${message}`;
				this.messages.push({ img: photoUrl, message: text });
			});
	}

	private sendPrivateMessageToUserSignalRCallback() {
		this.hubService.hubConnection
			.on('SendMessageToUser', (receiverName: string, receiverConnectionId: string, senderConnectionId: string, privateMessage: string, senderName: string, photoUrl: string) => {
				const text = `${senderName}: ${privateMessage}`;

				if (typeof this.componentRef === 'undefined') {
					this.createNewPrivateMessageComponent(senderName, senderConnectionId);
					this.privateChats.push(senderConnectionId.toString());
				}

				const senderConnectionIdExists = this.privateChats.includes(senderConnectionId.toString());
				if (!senderConnectionIdExists) {
					this.createNewPrivateMessageComponent(senderName, senderConnectionId);
				}

				this.componentRef.instance.privateMessages.push({ img: photoUrl, message: text })
				this.componentRef.instance.isResponse = true;
				this.componentRef.instance.responseConnectionId = senderConnectionId;
				this.componentRef.instance.responseName = receiverName;
				this.componentRef.instance.newMessage = true;
			});
	}

	private getConnectionIdSignalRCallback() {
		this.hubService.hubConnection.on('GetConnectionId', (connectionId) => {
			this.clientConnectionId = connectionId;

			localStorage.setItem('user_profile_connectionId', JSON.stringify(connectionId));
		});
	}

	private setAuthenticatedProfile() {
		this.authService.isLoggedIn$.subscribe(result => {
			if (!result) this.userid === -1;
			if (result) {
				const profile = JSON.parse(localStorage.getItem('user_profile')!);
				this.setProfile(profile);
			}
		})
	}

	private setProfile(profile: any) {
		this.username = profile.name;
		this.userid = profile.id;
		this.photo = profile.photoUrl;

		this.publicIdPhotoToDelete = profile.imagePublicId;
	}

	openModal() {
		const modalRef = this.modalService.open(EditProfileModalComponent);

		modalRef.componentInstance.userid = this.userid;
		modalRef.componentInstance.photo = this.photo;
		modalRef.componentInstance.publicIdPhotoToDelete = this.publicIdPhotoToDelete;
		modalRef.componentInstance.username = this.username;
		modalRef.componentInstance.connectionId = this.connectionId;
	}
}