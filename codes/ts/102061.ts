import {Component, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest, interval, Subject, Subscription} from 'rxjs';
import {Urlaub, vacationState} from '../../../types/urlaub';
import {UserService} from '../../../services/user.service';
import {SnackbarService} from '../../../services/snackbar.service';
import {SpinnerService} from '../../../services/spinner.service';
import {NgProgressbar, NgProgressRef} from 'ngx-progressbar';
import {
  MatDatepicker,
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {ApiError} from '../../../error/ApiError';
import {User} from '../../../types/user';
import {MAT_DATE_LOCALE, MatNativeDateModule, MatOptionModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {UrlaubComponent} from '../../components/urlaub/urlaub.component';
import {MatDivider} from '@angular/material/divider';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {NotificationsService} from '../../../services/notifications.service';

@Component({
  selector: 'app-urlaubs-planung',
  standalone: true,
  providers: [provideNativeDateAdapter(), {provide: MAT_DATE_LOCALE, useValue: 'de-DE'}],
  imports: [
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    CommonModule,
    MatIconModule,
    NgProgressbar,
    UrlaubComponent,
    MatDivider,
    MatCard,
    MatCardTitle,
    MatCardContent,
  ],
  templateUrl: './urlaubs-planung.component.html',
  styleUrl: './urlaubs-planung.component.scss'
})
export class UrlaubsPlanungComponent implements OnInit, OnDestroy {

  protected isVisible = signal(false);
  currentUser?: User;
  users: User[] = [];
  bereichsleiter: User[] = [];
  userCurrentVacationDays?: number;
  userRemainingVacationDays$ = new BehaviorSubject<number>(0);
  urlaub$ = new BehaviorSubject<Urlaub[]>([]);
  @ViewChild(NgProgressRef) progressBar!: NgProgressRef;
  @ViewChild('picker') datepicker!: MatDatepicker<Date>

  private pollingSubscription?: Subscription;

  startDatePicker = new Subject<MatDatepickerInputEvent<any>>();
  endDatePicker = new Subject<MatDatepickerInputEvent<any>>();


  waitingVacations$ = new BehaviorSubject<Urlaub[]>([]);
  acceptedVacations$ = new BehaviorSubject<Urlaub[]>([]);

  constructor(
    private UserService: UserService,
    private readonly SnackBarService: SnackbarService,
    private readonly SpinnerService: SpinnerService,
    private readonly NotificationService: NotificationsService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.SpinnerService.show();

    try {
      this.currentUser = await this.UserService.getCurrentUser();
    } catch (error) {
      this.SnackBarService.open('User could not be retrieved');
    }

    this.users = await this.UserService.getUsers();
    this.bereichsleiter = this.UserService.getBereichsleiter(this.users);

    try {
      this.startPolling();
    } catch (error) {
      console.log(error);
    } finally {
      this.SpinnerService.hide();
    }

    if (this.currentUser?.urlaub) {
      this.urlaub$.next(this.currentUser.urlaub);
      this.updateFilteredVacations();
      this.calculateRemainingVacationDays();
    }

    this.urlaub$.subscribe(() => this.updateFilteredVacations());

    //refined with chatgpt
    combineLatest([this.startDatePicker, this.endDatePicker]).subscribe(async ([startEvent, endEvent]) => {
      if (startEvent.value && endEvent.value && this.currentUser) {
        /*
        if (!await this.UrlaubsPlanungService.checkIfVacationIsValid(startEvent.value, endEvent.value, this.currentUser.id)) {
          this.SnackBarService.open('Holidays are within the project period!');
          this.resetDatePickers();
          return;
        }
        With Vacation planning implemented and bereichsleiter accepting requests, this check is probably abundant
         */
        try {
          this.progressBar.start();

          if (!this.checkIfUserHasVacationCapacity(startEvent.value, endEvent.value)) {
            return;
          }
          if(startEvent.value < new Date()){
            this.SnackBarService.open("Holiday can't be in the past");
            this.resetDatePicker();
            return;
          }

          let newUrlaub: Urlaub = {
            userId: this.currentUser.id,
            startDatum: startEvent.value,
            endDatum: endEvent.value,
            stateOfAcception: vacationState.Waiting
          };

          const urlaubMitId: Urlaub = await this.UserService.sendUrlaubRequest(
            this.currentUser.id,
            startEvent.value,
            endEvent.value,
            vacationState.Waiting,
          );

          newUrlaub.id = urlaubMitId.id;
          const updatedUrlaub = [...this.urlaub$.getValue(), newUrlaub];
          this.urlaub$.next(updatedUrlaub);
          this.isVisible.set(!this.isVisible());
          this.SnackBarService.open('Holiday has been successfully entered');
          for(let b of this.bereichsleiter){
            await this.NotificationService.createNotification(`The user: ${this.currentUser.vorname} ${this.currentUser.nachname} has requested a vacation. Go to the overview and take a look!`,b.id)
          }
          this.calculateRemainingVacationDays();
          setTimeout(() => {
            this.resetDatePicker()
          }, 1000)
        } catch (error: unknown) {
          if (error instanceof ApiError && error.code === 409) {
            this.SnackBarService.open('Holiday already exists');
            this.resetDatePicker()
            this.datepicker.open()
          } else {
            this.SnackBarService.open('Holiday could not be entered');
          }
        } finally {
          this.progressBar.complete();
        }
      }
    });
  }

  startPolling(): void {
    this.pollingSubscription = interval(5000).subscribe(async () => {
      try {

        const updatedUser = await this.UserService.getCurrentUser();

        if (updatedUser) {

          const updatedUrlaub = await this.UserService.getUserUrlaub(updatedUser);

          const currentUrlaub = this.urlaub$.getValue();
          const isEqual = this.areVacationsEqual(currentUrlaub, updatedUrlaub);

          if (!isEqual) {
            this.currentUser = updatedUser;
            this.currentUser.urlaub = updatedUrlaub;

            this.urlaub$.next([...updatedUrlaub]);

            this.updateFilteredVacations();
            this.calculateRemainingVacationDays();
          }
        }
      } catch (error) {
        if(error instanceof ApiError && error.code === 404) {
          this.urlaub$.next([]);
          return;
        }
        console.error('Fehler im Polling:', error);
      }
    });
  }

  private areVacationsEqual(vacationsA: Urlaub[], vacationsB: Urlaub[]): boolean {
    if (vacationsA.length !== vacationsB.length) {
      return false;
    }

    return vacationsA.every((vacationA) => {
      const vacationB = vacationsB.find((v) => v.id === vacationA.id);
      return (
        vacationB &&
        new Date(vacationA.startDatum).getTime() === new Date(vacationB.startDatum).getTime() &&
        new Date(vacationA.endDatum).getTime() === new Date(vacationB.endDatum).getTime() &&
        vacationA.stateOfAcception === vacationB.stateOfAcception
      );
    });
  }


  deleteUrlaub(urlaub: Urlaub) {
    this.progressBar.start();
    this.UserService.deleteUrlaub(urlaub).then(() => {
      const updatedUrlaub = this.urlaub$.getValue().filter(u => u !== urlaub);
      this.urlaub$.next(updatedUrlaub);
      this.calculateRemainingVacationDays();
      this.SnackBarService.open('Holiday has been deleted');
      this.resetDatePicker()
    }).catch(() => {
      this.SnackBarService.open('Holiday could not be deleted');
    }).finally(() => {
      this.progressBar.complete();
    });
  }

  resetDatePicker(): void {
    this.datepicker.select(null as unknown as Date)
  }


  updateFilteredVacations() {
    const vacations = this.urlaub$.getValue();
    this.waitingVacations$.next(vacations.filter(v => v.stateOfAcception === vacationState.Waiting));
    this.acceptedVacations$.next(vacations.filter(v => v.stateOfAcception === vacationState.Accepted));
  }

  calculateTotalVacationDays(urlaubArray: Urlaub[]): number {
    return urlaubArray.reduce((totalDays, urlaub) => {
      const startDate = new Date(urlaub.startDatum);
      const endDate = new Date(urlaub.endDatum);

      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return totalDays + days;
    }, 0);
  }

  checkIfUserHasVacationCapacity(startDatum: Date, endDatum: Date): boolean {
    if (!this.currentUser) {
      return false;
    }

    const allRelevantVacations = [
      ...this.acceptedVacations$.getValue(),
      ...this.waitingVacations$.getValue()
    ];

    this.userCurrentVacationDays = this.calculateTotalVacationDays(allRelevantVacations);

    const totalVacationDays = this.currentUser.urlaubstage ?? 28;

    const remainingDays = totalVacationDays - this.userCurrentVacationDays;

    this.userRemainingVacationDays$.next(remainingDays);

    const requestedVacationDays = Math.ceil((endDatum.getTime() - startDatum.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (requestedVacationDays > remainingDays) {
      this.SnackBarService.open(`You do not have enough vacation days left. You can only request ${remainingDays} more day(s).`);
      this.resetDatePicker()
      this.datepicker.open()
      return false;
    }

    return true;
  }


  calculateRemainingVacationDays(): void {
    if (!this.currentUser) {
      return;
    }

    const allRelevantVacations = [
      ...this.acceptedVacations$.getValue(),
      ...this.waitingVacations$.getValue()
    ];

    this.userCurrentVacationDays = this.calculateTotalVacationDays(allRelevantVacations);

    const totalVacationDays = this.currentUser.urlaubstage ?? 28;

    const remainingDays = totalVacationDays - this.userCurrentVacationDays;

    this.userRemainingVacationDays$.next(remainingDays);
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

}
