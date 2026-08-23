import { Component, inject, OnInit, signal, WritableSignal, HostListener, ViewChild, Type } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {  Subscription } from 'rxjs';
import { Managenote } from '../usernote/managenote/managenote'
import { DomSanitizer } from '@angular/platform-browser';
import { GenericModal } from '../../common-components/generic-component-type/generic-modal/generic-modal';
import { ExpansionPanelHeader } from '../../common-components/expansion-panel-header/expansion-panel-header';
import { IUserNote } from './usernote.model';
import { UserNoteService } from './usernote.service';
import { UserService } from '../../../core/user/user.service';
import { User } from '../../../core/user/user.types';

@Component({
  selector: 'app-usernote',
  imports: [CommonModule,
    ExpansionPanelHeader,
    ReactiveFormsModule,
    MatIcon,
    MatTooltipModule,
    GenericModal
  ],
  templateUrl: './usernote.html',
  styleUrl: './usernote.scss'
})
export class Usernote implements OnInit {
  @ViewChild(GenericModal) modalComponentRef?: GenericModal;

  private userSubscription?: Subscription;
  // frmUserNote: FormGroup;
  userNoteList: IUserNoteUI[];
  //IUserNote[];
  userNote: IUserNote = {};
  businessHeaderPanel: WritableSignal<boolean> = signal(true);
  toastr = inject(ToastrService);
  cols: number = 5; // default columns

  showModal = false;
  modalComponent?: Type<any>;
  Managenote: Type<any> = Managenote;
  modalComponentData?: any = null;
  modalOkButtonText = signal('OK');
  private modalSubscriptions: Subscription[] = [];
  private subscriptionCheckTimer: any = null;

  currentUser?: User;

  constructor(private formBuilder: FormBuilder,
    private userNoteService: UserNoteService,
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.userSubscription = this.userService.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Failed to load current user profile from stream', error);
      },
    });

    this.getUserNoteByUserId();
  }

  getUserNoteByUserId() {
    const userId = this.currentUser?.username;
    this.userNoteService
      .getUserNoteByUserId(userId ?? '')
      .subscribe((Response) => {
        this.userNoteList = (Response as IUserNote[]).map(note => ({
          ...note,
          expanded: false
        })) as IUserNoteUI[];
      });
  }

  deleteNote(noteId: string) {
    this.userNoteService
      .deleteUserNote(noteId)
      .subscribe((Response) => {
        this.toastr.success('Note Deleted Successfully', 'Delete Note');
        // this.onReset();
        this.getUserNoteByUserId();

        // if (Response.Status == 'OK') {
        //   this.loading = false;

        //   this.sharedService.SuccessOrErrorPopupService.showSuccessOrErrorPopup('Success', Response.Message, 'Close', false);
        //   this.onReset();
        // } else {
        //   this.loading = false;
        //   this.sharedService.SuccessOrErrorPopupService.showSuccessOrErrorPopup('Failure', Response.Message, 'Try again');
        //   // this.popupError = true;
        //   // this.header = 'Failure';
        //   // this.message = Response.Message;
        //   // this.btnText = 'Close';
        //   // this.popup = true;
        // }
        // this.loading = false;
      });
  }

  onDeleteNote(noteId: string) {
    const confirmed = confirm(`Are you sure you want to delete this note?`);
    if (confirmed) {
      this.deleteNote(noteId);
    }
  }

  updateNotePinStatus(note: IUserNote) {
    note.isPinned = +!note.isPinned;

    this.userNoteService
      .manageUserNote(note)
      .subscribe((Response) => {
        if (note.isPinned == 0) {
          this.toastr.success('Note Unpinned Successfully', 'Unpin Note');
        }
        else {
          this.toastr.success('Note Pinned Successfully', 'Pin Note');
        }
      });

    setTimeout(() => {
      this.getUserNoteByUserId();
    }, 500);
  }

  // Responsive columns
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateCols(event.target.innerWidth);
  }

  updateCols(width: number) {
    if (width < 600) this.cols = 2;
    else if (width < 960) this.cols = 3;
    else if (width < 1280) this.cols = 4;
    else this.cols = 5;
  }

  onBlur(value: string): void {
    console.log('Textbox blurred, value:', value);
  }

  openModal(componentToLoad?: Type<any>, data?: any) {
    // Reset modal state
    this.showModal = false;
    this.modalComponent = undefined;
    const currentFieldData = data;

    setTimeout(() => {
      this.modalComponent = componentToLoad || this.Managenote;

      this.modalComponentData = {
        initialData: currentFieldData,
        ...(data || {})
      };
      this.showModal = true;
    }, 50);
  }

  onModalClose(isVisible: boolean) {
    this.showModal = isVisible;

    if (!isVisible) {
      this.modalSubscriptions.forEach((sub) => sub.unsubscribe());
      this.modalSubscriptions = [];

      if (this.subscriptionCheckTimer) {
        clearInterval(this.subscriptionCheckTimer);
        this.subscriptionCheckTimer = null;
      }
    }
  }

  onModalResult(result: any) {
    // Don't close modal if result is null or just a button text update
    if (!result) return;

    this.toastr.success(result.message, result.title);
    this.showModal = false;

    this.getUserNoteByUserId();

    // Close modal only for actual actions (not button text changes)
    // if (result.action === 'updated') {
    //   this.showModal = false;
    // }
  }

  onUpdateNote(note: IUserNote) {
    // this.userNote = note;
    this.openModal(Managenote, note);
    // const confirmed = confirm(`Are you sure you want to update this note?`);
    // if (confirmed) {
    //this.updateNote(note);
    //}
  }

  getSafeHtml(html: string | undefined) {
    return html
      ? this.sanitizer.bypassSecurityTrustHtml(html)
      : '';
  }
}

interface IUserNoteUI extends IUserNote {
  expanded: boolean;
}
