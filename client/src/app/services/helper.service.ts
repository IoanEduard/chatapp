import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
  })
  export class HelperService {
    private data = new Subject<any>();
    public data$ = this.data.asObservable();

    private privateMessage = new Subject<any>();
    public privteMessage$ = this.privateMessage.asObservable();
  
    emitComponentIndex(index: any){
      this.data.next(index);
    }

    emitPrivateMessage(message: any) {
      this.privateMessage.next(message);
    }
  }