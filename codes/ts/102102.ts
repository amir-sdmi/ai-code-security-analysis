import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Subscription, switchMap } from 'rxjs';
import { AccessEnum, CardListViewModel, CardViewModel } from 'src/api/models';
import { CardService } from 'src/api/services';
import { LanguageLevelPipe } from 'src/app/util/pipes/language-level.pipe';
import { AlertService } from 'src/app/util/services/alert.service';
import { LoadingService } from 'src/app/util/services/loading.service';
import { LocalStorageService } from 'src/app/util/services/localstorage.service';
import { ToastrService } from 'src/app/util/services/toastr.service';
import {
  CARD_LEARNING_NAVIGATION,
  CARD_LISTS_NAVIGATION,
  CARD_NAVIGATION
} from 'src/app/util/util.constants';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.page.html',
  styleUrls: ['./card-list.page.scss'],
  standalone: false
})
export class CardListPage {
  accessOfCardList = AccessEnum.Public;
  cards: Array<CardViewModel> = [];
  originalCards: Array<CardViewModel> = [];
  showSwiper = false;
  cardListId: number | undefined | null;
  generatedCards: Array<CardViewModel> = [];
  hasCardChanged = false;
  title = '';
  isCardListOfOtherUser = false;
  navigateBackRouter = CARD_LISTS_NAVIGATION;

  getCardListSub: Subscription | undefined;
  saveCardsSub: Subscription | undefined;
  changeAccessOfCardListSub: Subscription | undefined;

  constructor(
    private cardService: CardService,
    private translateService: TranslateService,
    private activatedRoute: ActivatedRoute,
    private loadingService: LoadingService,
    private toastrService: ToastrService,
    private alertService: AlertService,
    private navController: NavController,
    private localStorageService: LocalStorageService,
    private languageLevelPipe: LanguageLevelPipe,
    private modalController: ModalController
  ) {}

  ionViewWillEnter() {
    this.loadData();
  }

  ionViewWillLeave() {
    this.saveCardsSub?.unsubscribe();
    this.changeAccessOfCardListSub?.unsubscribe();
    this.getCardListSub?.unsubscribe();
  }

  /**
   * Generate words with ChatGPT API
   */
  async generateCards() {
    this.alertService.showCreateCardsAlert(this.title).then(result => {
      if (result) {
        this.cardService
          .generateWordList$Json({
            cardListId: this.cardListId!
          })
          .subscribe({
            next: (res: Array<CardViewModel>) => {
              this.loadingService.hideLoading();
              if (res?.length) {
                this.generatedCards = [...res];
                this.showSwiper = true;
              } else {
                this.toastrService.presentErrorToast(
                  this.translateService.instant(
                    'ERROR_HAPPEND_WHILE_GENERATING_WORDS'
                  )
                );
              }
            },
            error: () => {
              this.loadingService.hideLoading();
              this.toastrService.presentErrorToast(
                this.translateService.instant(
                  'ERROR_HAPPEND_WHILE_GENERATING_WORDS'
                )
              );
            }
          });
      }
    });
  }

  /**
   * Remove card from the list
   */
  removeFromList(i: number) {
    this.alertService
      .showRemoveAlert(
        this.translateService.instant(
          'ARE_YOU_SURE_YOU_WANT_TO_DELETE_FROM_THE_LIST',
          {
            value: this.cards[i].wordInNativeLanguage
          }
        )
      )
      .then((remove: boolean) => {
        if (remove) {
          this.hasCardChanged = true;
          this.cards = this.cards.filter((word, index) => i !== index);
        }
      });
  }

  /**
   * Saving cards
   */
  saveCards() {
    this.loadingService.showLoading().then(() => {
      this.saveCardsSub = this.cardService
        .saveCards$Json({
          body: {
            cardListId: this.cardListId as number | undefined,
            cards: this.cards
          }
        })
        .subscribe({
          next: (success: boolean) => {
            this.loadingService.hideLoading();
            if (success) {
              this.toastrService.presentSuccessToast(
                this.translateService.instant('SAVING_SUCCESSFULL')
              );
              this.hasCardChanged = false;
            } else {
              this.toastrService.presentErrorToast(
                this.translateService.instant('UNSUCCESSFULL_SAVING')
              );
            }
          },
          error: () => {
            this.toastrService.presentErrorToast(
              this.translateService.instant('UNSUCCESSFULL_SAVING')
            );
            this.loadingService.hideLoading();
          }
        });
    });
  }

  /**
   * Handle the emit,
   * Add the new cards to the current card list
   */
  addCards(cardsToBeAdded: Array<CardViewModel>) {
    if (cardsToBeAdded?.length) {
      this.hasCardChanged = true;
      cardsToBeAdded.forEach(c => this.cards.push(c));
    }
    this.showSwiper = false;
  }

  /**
   * Navigate back without saving
   */
  navigateBackWithoutSaving(quit: boolean) {
    if (quit) {
      this.navController.back();
    }
  }

  /**
   * Navigate to learn cards if there are at least 30 cards
   */
  async learnCards() {
    if (this.hasCardChanged) {
      await this.alertService
        .showSavingMissedAlert()
        .then(async (quit: boolean) => {
          if (quit) {
            if (this.cards.length >= 30) {
              this.navController.navigateForward(
                CARD_LEARNING_NAVIGATION + '/' + this.cardListId
              );
            } else {
              await this.alertService.showTooFewCardsAlert();
            }
          }
        });
    }

    if (this.cards.length >= 30) {
      this.navController.navigateForward(
        CARD_LEARNING_NAVIGATION + '/' + this.cardListId
      );
    } else {
      this.alertService.showTooFewCardsAlert();
    }
  }

  /**
   * Copy the cardlist of other user
   */
  copyCards() {
    this.loadingService.showLoading().then(() => {
      this.cardService
        .copyCardListOfOtherUser$Json({
          cardListId: this.cardListId!
        })
        .subscribe({
          next: (success: boolean) => {
            if (success) {
              this.loadingService.hideLoading();
              this.toastrService.presentSuccessToast(
                this.translateService.instant('SUCCESSFULLY_SAVE_THE_CARDS')
              );
            } else {
              this.loadingService.hideLoading();
              this.toastrService.presentErrorToast(
                this.translateService.instant(
                  'ERROR_HAPPEND_WHEN_TRIED_TO_SAVE_THE_CARDS'
                )
              );
            }
          },
          error: () => {
            this.loadingService.hideLoading();
            this.toastrService.presentErrorToast(
              this.translateService.instant(
                'ERROR_HAPPEND_WHEN_TRIED_TO_SAVE_THE_CARDS'
              )
            );
          }
        });
    });
  }

  /**
   * Change the access of the cardlist
   */
  changeAccess(access: AccessEnum) {
    this.loadingService.showLoading().then(() => {
      this.cardService
        .changeAccessOfCardList$Json({
          body: {
            userId: this.localStorageService.getUserId()!,
            cardListId: this.cardListId!,
            access
          }
        })
        .subscribe({
          next: res => {
            if (res) {
              this.accessOfCardList = access;
              this.loadingService.hideLoading();
              this.toastrService.presentSuccessToast(
                this.translateService.instant('SUCCESSFUL_ACCESS_CHANGE')
              );
            } else {
              this.loadingService.hideLoading();
              this.toastrService.presentSuccessToast(
                this.translateService.instant('UNSUCCESSFUL_ACCESS_CHANGE')
              );
            }
          },
          error: () => {
            this.loadingService.hideLoading();
            this.toastrService.presentSuccessToast(
              this.translateService.instant('SUCCESSFUL_ACCESS_CHANGE')
            );
          }
        });
    });
  }

  /**
   * Open the card
   */
  openCard(index: number) {
    if (!this.isCardListOfOtherUser) {
      this.navController.navigateForward(
        CARD_NAVIGATION + '/' + this.cards[index].id
      );
    }
  }

  /**
   * Loading the data
   */
  private loadData() {
    this.loadingService.showLoading().then(() => {
      this.getCardListSub = this.activatedRoute.params
        .pipe(
          switchMap((params: Params) => {
            this.cardListId = params['id'];

            if (!this.cardListId) {
              this.loadingService.hideLoading();
              return EMPTY;
            }

            return this.cardService.getCardListById$Json({
              cardListId: this.cardListId
            });
          })
        )
        .subscribe({
          next: (cardList: CardListViewModel) => {
            this.title = cardList?.name ?? '';
            if (cardList?.cardViewModelList?.length) {
              this.accessOfCardList = cardList.access ?? AccessEnum.Public;
              this.cards = [...cardList?.cardViewModelList];
              this.originalCards = [...cardList?.cardViewModelList];
            }

            this.isCardListOfOtherUser =
              cardList?.userId !== this.localStorageService.getUserId();

            this.loadingService.hideLoading();
          },
          error: () => {
            this.loadingService.hideLoading();
            this.toastrService.presentErrorToast(
              this.translateService.instant('DATA_ERROR')
            );
          }
        });
    });
  }
}
