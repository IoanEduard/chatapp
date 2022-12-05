import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalDismissReasons, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { HubService } from 'src/app/services/hub.service';
import { UserProfileService } from 'src/app/services/userProfile.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss']
})
export class EditProfileModalComponent implements OnInit, OnDestroy {
  @Input() name!: any;

  images: { 'name': string }[] = [];
  closeResult = '';
  updateProfileDto: {
    name: string,
    photoUrl: string
  } = {} as { name: string, photoUrl: string };

  userid: any;
  photo: any;
  publicIdPhotoToDelete: any;
  username: any;
  connectionId: any;

  constructor(private userService: UserProfileService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private hubService: HubService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeImages();
  }

  ngOnDestroy() {

  }

  public initializeImages() {
    this.userService.getAllImages().subscribe((response: any) => {
      this.images = response;
    }, (error: any) => {
      console.log(error);
    }, () => {

    })
  }

  public uploadImage(event: any) {
    this.userService.uploadImage(this.userid, event.target.files[0]).subscribe((result: any) => {
      this.photo = result['photoUrl'];
      this.publicIdPhotoToDelete = result['publicId'];
    }, (error: any) => console.log(error),
      () => {
        this.deleteCloudPicture();
      }
    );
  }

  public updateImage(imageUrl: any) {
    this.photo = imageUrl;
    this.updateProfileDto.photoUrl = this.photo;

    this.deleteCloudPicture();
  }

  public saveProfile() {
    this.updateProfileDto = {
      name: this.username,
      photoUrl: this.photo
    }

    const profile = JSON.parse(localStorage.getItem('user_profile')!);
    const oldName = profile.name;

    if (profile.id > 1) {
      this.userService.editUserProfile(this.userid, this.updateProfileDto).subscribe((result: any) => {
        profile.id = result.id;
        profile.imagePublicId = result.publicId;
        profile.name = result.name;
        profile.photoUrl = result.photoUrl;
        localStorage.setItem('user_profile', JSON.stringify(profile))
      }, (error: any) => {
        console.log(error);
      }, () => {
        this.updateUserConnectionKey(oldName);
      });
    }
    else {
      profile.name = this.updateProfileDto.name;
      profile.photoUrl = this.updateProfileDto.photoUrl;
      localStorage.setItem('user_profile', JSON.stringify(profile))
      this.updateUserConnectionKey(oldName);
    }

    this.modalService.dismissAll();
  }

  private updateUserConnectionKey(oldName: string) {
    this.hubService.hubConnection
      .invoke('UpdateUserConnectionKey', this.connectionId, oldName, this.updateProfileDto.name)
      .catch(err => console.error(err)).finally(() => {
        console.log('connection Key updated')
      });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  private deleteCloudPicture() {
    if (this.publicIdPhotoToDelete)
      if (!this.publicIdPhotoToDelete.includes("assets/")) {
        this.userService.deleteImage(this.userid, this.publicIdPhotoToDelete).subscribe((result: any) => {
        }, (error: any) => {
          console.log(error)
        }, () => {
        })
      }
  }
}
