import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.scss']
})
export class MessageBoxComponent implements OnInit {
  @Input() chatForm!: NgForm;
  @Output() messageEvent: EventEmitter<string> = new EventEmitter<string>();
  @Output() messageOpenedEvent: EventEmitter<void> = new EventEmitter<void>();

  message: string = '';

	mapEmoji = {
		'%demon%': '👹',
		'%angry%': '🤬',
		'%shit%': '💩',
		'%clown%': '🤡',
		'%sick%': '🤢',
		'%clap%': '👏',
	};

  constructor() { }

  ngOnInit(): void {
  }

  insertEmojiInMessage(emoji: string, i: number) {
		this.message = this.message = this.message + `${emoji}`;
		this.editTextareaMessage();
	}

  editTextareaMessage() {
		for (let i in this.mapEmoji) {
			let regex = new RegExp(this.escapeSpecialChars(i), 'gim');
			this.message = this.message = this.message.replace(regex, (this.mapEmoji as any)[i]);
		}
	}

	private escapeSpecialChars(regex: any) {
		return regex.replace(/([()[{*+.$^\\|?])/g, '\\$1');
	}

  sendMessage(){
    this.messageEvent.emit(this.message);
    this.message = '';
  }

  messageRead() {
    this.messageOpenedEvent.emit();
  }
}
