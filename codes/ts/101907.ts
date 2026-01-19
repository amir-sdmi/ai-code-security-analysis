import { InfoTab, InfoTabType } from '@components/game/info-tab/InfoTab';
import { TurnHandler } from '@business-logic/TurnHandler';
import { FirebaseGameType, TurnHandlerType, UserType } from '@types-dir/index';
import { TicTacTable, TicTacTableType } from './TicTacTable';
import {
  InitializeContextsFunctionType,
  isItRemoteGame,
  useContextCurrentMove,
  useContextTurnHookType,
  useContextTurnStorage,
  useContextWinner,
  useContextWinnerSeq,
  useContextUserSession,
  useContextRoomCodeId,
  UseRoomCodeIdHookType,
  useContextGameId,
  getRandomMove,
  isItSameDeviceGame,
  isItGameWithOpenAi,
} from '@contexts/index';
import { Loader, useDiv } from '@components/base';
import {
  askChatGptToJoinGame,
  createGame,
  onGameCreated,
} from '@firebase-dir/game';
import { GameActionCallbacksType } from '@components/game/GameActions';
import { startSubscribers } from '@components/game/firebase-subscriber/FirebaseSubscriber';
import { AddErrorWithoutAction } from '@components/base/ux/notification/AddErrorWithAction';

export type TicTacType = {
  render: () => HTMLDivElement;
  exitGame: () => void;
};

export const TicTac = (
  contextsData: InitializeContextsFunctionType,
  gameActionsObject: GameActionCallbacksType
): TicTacType => {
  let infoTabDiv: InfoTabType | undefined;
  let turnHandler: TurnHandlerType | undefined;
  let ticTacTableType: TicTacTableType | undefined;

  const { getDiv: getWrapperDiv, setDiv: setWrapperDiv } = useDiv();
  const { showLoader, stopLoader } = Loader();

  const setInfoTabDiv = (item: InfoTabType) => {
    infoTabDiv = item;
  };

  const setTurnHandlerType = (item: TurnHandlerType) => {
    turnHandler = item;
  };

  const getTurnHandlerType = (): TurnHandlerType => {
    return turnHandler as TurnHandlerType;
  };

  const setTicTacTable = (item: TicTacTableType) => {
    ticTacTableType = item;
  };

  const getTicTacTable = (): TicTacTableType => {
    return ticTacTableType as TicTacTableType;
  };

  const anotherPersonMadeMove = async () => {
    // console.log('anotherPersonMadeMove updateInfo');
    await getTicTacTable().updateOtherPersonMove();
  };

  const resetGameJoiner = () => {
    getInfoTabDiv().resetApp();
  };

  const resetGame = () => {
    const { removeWinner } = useContextWinner(contextsData);
    const { getUser } = useContextUserSession(contextsData);
    const { removeWinnerSequence } = useContextWinnerSeq(contextsData);
    const { resetTurnStorage } = useContextTurnStorage(contextsData);
    const { resetTurn } = useContextTurnHookType(contextsData);

    removeWinner();
    removeWinnerSequence();
    resetTurnStorage();

    if (isItSameDeviceGame(contextsData)) {
      resetTurn();
    }

    if (isItRemoteGame(contextsData)) {
      //sets correct room code and game id in info tab
      getInfoTabDiv().updateRoomInfo();

      const { getCurrentMove } = useContextCurrentMove(contextsData);
      const { setUserTurn, setAnotherUserTurn } =
        useContextTurnHookType(contextsData);
      if (getCurrentMove() === getUser().id) {
        setUserTurn();
      } else {
        setAnotherUserTurn();
      }
    }

    setTurnHandlerType(
      TurnHandler(
        contextsData,
        anotherPersonMadeMove,
        reStartGameStoppedWithError
      )
    );
    const table = getTicTacTable();
    table.reset();
    getInfoTabDiv().addTurn();
  };

  // alllowed only for remote game and chatGPT game
  // if it is not remote game , it is chatGPT game
  const reStartGame = async () => {
    showLoader();
    const { setGameId } = useContextGameId(contextsData);
    const { setCurrentMove } = useContextCurrentMove(contextsData);
    const { getRoomCodeId } = useContextRoomCodeId(contextsData);
    const { getUser } = useContextUserSession(contextsData);
    const { setUserTurn } = useContextTurnHookType(contextsData);

    const roomCodeId = getRoomCodeId();
    const userItem = getUser() as UserType;
    const currentMove = getRandomMove(contextsData);
    const g = await createGame(roomCodeId, currentMove, userItem.id);
    if (g) {
      // console.log('Game started', g.id);
      setGameId(g.id);
      if (isItRemoteGame(contextsData)) {
        setCurrentMove(currentMove);
        await startSubscribers(contextsData, {
          ...gameActionsObject,
          exitGame,
        });
      } else {
        // on game with ChatGPT, Player is always first to make move
        setUserTurn();
        setCurrentMove(userItem.id);
        await askChatGptToJoinGame(roomCodeId, g.id);
      }
      resetGame();
      stopLoader();
    } else {
      AddErrorWithoutAction('Error creating game by me');
      stopLoader();
    }
  };

  const reload = async () => {
    if (isItRemoteGame(contextsData) || isItGameWithOpenAi(contextsData)) {
      await reStartGame();
    } else {
      // console.log("resetGame");
      resetGame();
    }
  };

  const getInfoTabDiv = (): InfoTabType => {
    if (!infoTabDiv) {
      setInfoTabDiv(InfoTab(reload, contextsData));
    }
    return infoTabDiv as InfoTabType;
  };

  const updateInfo = () => {
    getInfoTabDiv().updateInfo(reload);
  };

  // Remote Game Listener, note required for game with ChatGPT
  const addRestartGameListener = () => {
    // console.log('addRestartGameListener');
    const { getRoomCodeId } = useContextRoomCodeId(
      contextsData
    ) as UseRoomCodeIdHookType;
    const { getGameId, setGameId } = useContextGameId(contextsData);
    const { setCurrentMove } = useContextCurrentMove(contextsData);
    const { getUser } = useContextUserSession(contextsData);
    onGameCreated(
      getRoomCodeId(),
      async (d: FirebaseGameType, gameId: string) => {
        if (getUser().id !== d.creator && gameId !== getGameId()) {
          // console.log('TICTAC 2 NEW GAME', gameId);
          setGameId(gameId);
          setCurrentMove(d.currentMove);
          await startSubscribers(contextsData, {
            ...gameActionsObject,
            exitGame,
          });
          resetGameJoiner();
          resetGame();
        } else {
          if (getUser().id === d.creator) {
            // console.log('TICTAC SAME USER ');
          } else if (gameId === getGameId()) {
            // console.log('TICTAC SAME GAME');
          }
        }
      },
      () => {
        // console.log('Game started Game 2');
      }
    );
  };

  const reStartGameStoppedWithError = () => {
    getInfoTabDiv().resetApp();
    reload();
  };

  const render = () => {
    setTurnHandlerType(
      TurnHandler(
        contextsData,
        anotherPersonMadeMove,
        reStartGameStoppedWithError
      )
    );
    setInfoTabDiv(InfoTab(reload, contextsData));

    setWrapperDiv('wrapper-div');
    getWrapperDiv().append(getInfoTabDiv().render());
    getInfoTabDiv().addTurn();
    const table = TicTacTable(getTurnHandlerType, updateInfo, contextsData);
    setTicTacTable(table);
    getWrapperDiv().append(table.render());
    if (isItRemoteGame(contextsData)) {
      addRestartGameListener();
    }
    return getWrapperDiv();
  };

  const exitGame = () => {
    getInfoTabDiv().exitGame();
    getTicTacTable().exitGame();
    getWrapperDiv().remove();
  };

  return {
    render,
    exitGame,
  };
};
