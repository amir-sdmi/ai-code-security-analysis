import React, { useRef,useState, useEffect, useCallback } from "react";

//Importing the game's components
import Player from "./utilities/Player.js";
import Platform from "./utilities/Platform.js";
import Enemy from "./utilities/Enemy.js";

//Importing the static assets, images & audio
import watermelonImg from "./static/images/prize.png";
import duckImg from "./static/images/Duck_Character.png";
import bigfootImg from "./static/images/bigfoot.png";
import levels from "./utilities/levels.js";
import BackgroundMusic from "./utilities/BackgroundMusic.js";
import menuMusic from "./static/audio/mainMenu.mp3";
import quackSound from './static/audio/duck.mp3'; 
import deadSound from './static/audio/glitch-scream.mp3';
import dropSound from './static/audio/death.wav';
import SoundEffect from "./utilities/soundEffect.js";

//Importing the style sheet
import "./static/styles/App.css";

//Import photos for creator bios
import samPhoto from "./static/images/SamuelZhang_Foto.jpg";
import alexPhoto from "./static/images/AlexLopezPhoto.jpg";
import yiskaPhoto from "./static/images/yiska.jpg";

function App() {

  //Managing whether dispalyed screen is menu or game
  const [currentScreen, setCurrentScreen] = useState("menu");
  
  //Stores the index of the current active level
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  
  // Creating array for platforms and enemies of the current level
  const [platforms, setPlatforms] = useState([]);
  const [enemies, setEnemies] = useState([]);
  
  //Creating object representing prize at the end of the level
  const [prize, setPrize] = useState(null);
  
  //Duck character's x pos, y pos, horizontal velo, and vert veloc in the game board
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(100);
  const [velocityX, setVelocityX] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  
  //Bool stating whether character is jumping
  const [isJumping, setIsJumping] = useState(false);
  
  //Adjustable horizontal scroll position of game to keep player at center
  const [scrollX, setScrollX] = useState(0);
  
  //Bool stating whether game is over or not
  const [gameOver, setGameOver] = useState(false);
  
  //Bool sttaing whether level is complete or not
  const [levelComplete, setLevelComplete] = useState(false);
  
  //Bool stating whether screen wipe is happening or not
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  //Variable to store index of level to load after screen wipe
  const [nextLevelToLoad, setNextLevelToLoad] = useState(null);
  
  //Bool stating whether timer is running or not
  const [timerRunning, setTimerRunning] = useState(false);
  
  //Stores current elapsed time for teh current level (in ms)
  const [elapsedTime, setElapsedTime] = useState(0);
  
  //Object storing the fastest times for each level
  const [leaderboard, setLeaderboard] = useState({});
  
  //References for sound effects
  const soundRef = useRef();
  const deathRef = useRef();
  const fallRef = useRef();

  //Constants for gameplay movement
  const GRAVITY = -0.3;
  const JUMP_VELOCITY = 12;
  const MOVE_ACCELERATION = 2;
  const MAX_SPEED = 8;
  const FRICTION = 0.2;
  
  //Visible width of game board
  const viewportWidth = 900;
  
  //Width and Height of player
  const playerWidth = 50;
  const playerHeight = 50;
  
  //Total width of a level in the game
  const maxGameWidth = 2100;

 
  /*
  The resetGameState function helps put the game's elements back into their starting configuration for the
  level the player is on. elapsedTime is not reset in this function because we want the time
  to indicate how many times you had to restart rather than being reset. As a memoize function, we  
  list levels and currentLevelIndex in useCallback()'s dependency array. Doing this, we only get a new version of 
  resetGameState if the currentLevelIndex changes or if the data in levels changes instead of re-creating the function
  every time the player restarts the Level.
  */
  //Assisted by ChatGPT
  const resetGameState = useCallback(() => {
    const level = levels[currentLevelIndex]; // Load current level's data
    setPlatforms(level.platforms);
    setEnemies(level.enemies.map(enemy => ({ ...enemy, direction: 1 })));
    setPrize(level.prize);
    setPlayerX(50);
    setPlayerY(100);
    setVelocityX(0);
    setVelocityY(0);
    setIsJumping(false);
    setScrollX(0);
    setGameOver(false);
    setLevelComplete(false);
  }, [currentLevelIndex]); // Dependency array

  /*
  The loadLevel function is similar to resetGameState, except it initializes the game for a specifc level. 
  This function is called when a new level is selected from the main menu or moving to the next level, resetting all 
  game states, including elapsedTime this time.
  */
  const loadLevel = useCallback((index) => {
    const level = levels[index];
    setCurrentLevelIndex(index);
    setPlatforms(level.platforms);
    setEnemies(level.enemies.map(enemy => ({ ...enemy, direction: 1 })));
    setPrize(level.prize);
    setPlayerX(50);
    setPlayerY(100);
    setVelocityX(0);
    setVelocityY(0);
    setIsJumping(false);
    setScrollX(0);
    setGameOver(false);
    setLevelComplete(false);
    setCurrentScreen("game");
    setElapsedTime(0); //Reset timer when a new level is loaded
    setTimerRunning(true); //Restarts timer in new level
    setIsTransitioning(false); //Make sure transition state is false when a level is loaded
  }, []);

  
  //startTransitionToLevel starts the screen wipe transition before loading the next level.
  const startTransitionToLevel = (index) => {
    setIsTransitioning(true);
    setNextLevelToLoad(index); //Stores index of next level to load
  };

  /* 
  handleOverlayAnimationEnd function is for when the screen wipe animation is completed and chooses whetehr to load
  a new level or just clear the transiion state.
  */
  const handleOverlayAnimationEnd = (e) => {
    //Checks if animation is Wipe Expand
    if (e.animationName === "wipeExpand") {
      //Checks if there's another level to load
      if (nextLevelToLoad !== null) {
        loadLevel(nextLevelToLoad); //Loads next level
        setNextLevelToLoad(null); //Clears the queue
        //Remove expand class and added contract class to start the reverse wipe back
        e.target.classList.remove("expand");
        e.target.classList.add("contract");
      } else {
        // Else case is the wipe expanded but there's no next level to load (going back to menu with a screen wipe)
        setIsTransitioning(false); //Reset transition state so screen can be interactive
      }
    } 
    //Checks if ending animation is contracted (screen uncovered)
    else if (e.animationName === "wipeContract") {
      setIsTransitioning(false); //Reset transition state so screen can be interactive
      e.target.classList.remove("contract");
    }
  };

  /*
  useEffect hook function for game timer. Sets up a 10 ms interval to update elapsedTime if timer is running. If timer isn't running, it clears
  the interval value. 
  */
  useEffect(() => {
    if (timerRunning) {
      const interval = setInterval(() => {
        setElapsedTime((time) => time + 10);
      }, 10);
      return () => clearInterval(interval);
    }
  }, [timerRunning]);

  /*
  useEffect hook for main game loop, player character movement and enemy movement. This runs continuously to update the player characater's 
  and enemy's position. 
  */
  //Assisted by ChatGPT
  useEffect(() => {
    //Doesn't run the game loop if in game screen, or game is over, or level complete
    if (currentScreen !== "game" || gameOver || levelComplete) 
      return;
    
    //Set up an interval for game updates by calling setInterval()
    const interval = setInterval(() => {
      //Apply gravity to vertical velocity 
      setVelocityY((vy) => vy + GRAVITY);

      //Update player's Y position
      setPlayerY((prevY) => {
        const nextY = prevY + velocityY;
        const playerBottomPrev = prevY;
        const playerBottomNext = nextY;
        const playerLeft = playerX;
        const playerRight = playerX + playerWidth;

        let landed = false; //Flag to determine if the player has landed on a platform
        let correctedY = nextY; //The player's Y position, potentially adjusted for collisions

        //Iterate through all platforms to check for collisions
        platforms.forEach((plat) => {
          const platTop = plat.bottom + 20; //The effective top surface of the platform (adjusted for visual alignment)
          const platLeft = plat.left; 
          const platRight = plat.left + plat.width; 

          const wasAbovePlatform = playerBottomPrev >= platTop; //Checks if the player was above the platform in the previous frame
          const isBelowPlatform = playerBottomNext <= platTop; //Checks if the player is now at or below the platform's top edge

          //Checks for horizontal overlap between the player and the platform
          const horizontalOverlap =
            playerRight > platLeft && playerLeft < platRight;

          /* 
          Determines if the player is currently falling through and about to land on a platform based on these conditions:
          #1 Player is moving downwards or is still (not jumping up)
          #2 Player was previously above the platform
          #3 Player is now at or below the platform's top
          #4 Player is horizontally aligned with the platform
          */
          const isFallingThrough =
            velocityY <= 0 && 
            wasAbovePlatform && 
            isBelowPlatform && 
            horizontalOverlap; 

          if (isFallingThrough) {
            landed = true; // Mark that the player has landed
            correctedY = platTop; //Change player's Y position to the top of the platform
            setVelocityY(0); //Stop vertical movement
            setIsJumping(false); //Player is no longer jumping
          }
        });

        //If the player has not landed on a platform and falls below the screen boundary (Y < 0)
        if (!landed && nextY < 0) {
          fallRef.current?.play(); //Play the fall sound effect
          setGameOver(true); //Set game over state to true
          setTimerRunning(false); //Stop the timer briefly when game is over
          return prevY;
        }

        return correctedY; //Return the adjusted (or unadjusted) Y position
      });

      //Update player's X position and manage horizontal scrolling of the game board
      setPlayerX((prevX) => {
        let newVX = velocityX; 

        //Apply friction when the player is not jumping to slow down horizontal movement
        if (!isJumping) {
          if (velocityX > 0) newVX = Math.max(velocityX - FRICTION, 0); //Reduce positive velocity towards 0
          else if (velocityX < 0) newVX = Math.min(velocityX + FRICTION, 0); //Increase negative velocity towards 0
        }

        setVelocityX(newVX); //Update the player's horizontal velocity

        //Update enemy positions based on their direction and collision with platform edges
        setEnemies((prevEnemies) =>
          prevEnemies.map((enemy) => {
            //Find the platform the enemy is currently walking on
            const platform = platforms.find(
              (plat) =>
                enemy.bottom === plat.bottom + 20 && //Enemy's bottom aligns with platform's top
                enemy.left >= plat.left && //Enemy is within platform's left boundary
                enemy.left + enemy.width <= plat.left + plat.width //Enemy is within platform's right boundary
            );
            if (!platform) return enemy; 

            let newLeft = enemy.left + (enemy.direction || 1) * 0.7; //Calculate new enemy left position (speed 0.7)

            //If enemy hits the left edge of its platform, reverse direction
            if (newLeft <= platform.left) {
              newLeft = platform.left; 
              enemy.direction = 1; //Set direction to right
            }
            // If enemy hits the right edge of its platform, reverse direction
            else if (newLeft + enemy.width >= platform.left + platform.width) {
              newLeft = platform.left + platform.width - enemy.width; 
              enemy.direction = -1; //Set direction to left
            }

            return {
              ...enemy,
              left: newLeft,
              direction: enemy.direction,
            };
          })
        );

        /*
        Calculate the new player X position, ensuring it stays within the total game width and 
        adjust the horizontal scroll position to keep the player centered
        */
        const newX = Math.min(Math.max(0, prevX + newVX), maxGameWidth);
        setScrollX(
          newX > viewportWidth / 2
            ? Math.min(newX - viewportWidth / 2, maxGameWidth - viewportWidth) //Scroll if player is past half the viewport
            : 0
        );
        return newX;
      });
    }, 1000 / 60); //Set interval to run approximately 60 times per second

    return () => clearInterval(interval);
  }, [
    velocityX,
    velocityY,
    playerX,
    playerY,
    gameOver,
    levelComplete,
    platforms,
    isJumping,
    GRAVITY,
    currentScreen,
  ]); //Dependencies for the game loop

  /*
  handleKeyDown is a memoized function that handles player input from the keyboard.
  It controls horizontal movement and jumping based on arrow keys and spacebar.
  */
  const handleKeyDown = useCallback(
    (event) => {
      //Ignore key presses if not in the game screen, if game is over, of if level is complete
      if (currentScreen !== "game" || gameOver || levelComplete)
        return;
      //If Left Arrow is pressed, decrease horizontal velo (move left)
      if (event.code === "ArrowLeft") {
        setVelocityX((vx) => Math.max(vx - MOVE_ACCELERATION, -MAX_SPEED));
      }
      //If Right Arrow is pressed, increase horizontal velo (move right)
      else if (event.code === "ArrowRight") {
        setVelocityX((vx) => Math.min(vx + MOVE_ACCELERATION, MAX_SPEED));
      }
      //If Space or Up Arrow is pressed and the player is not already jumping, trigger a jump
      else if (
        (event.code === "Space" || event.code === "ArrowUp") &&
        !isJumping
      ) {
        soundRef.current?.play(); //Play the jump sound effect
        setVelocityY(JUMP_VELOCITY);
        setIsJumping(true); //Set jumping state to true
      }
    },
    [currentScreen, gameOver, levelComplete, isJumping] //Dependencies
  );

  /*
  This useEffect hook sets up and cleans up keyboard controls for the game. This ensures that when the 
  game is active, player's key presses are recognized. When the game screen is no longer shown, it stops l
  istening for those key presses to prevent issues.
  */
  //Assisted by ChatGPT
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown); //Starts listening for key presses
    return () => window.removeEventListener("keydown", handleKeyDown); //Stops listening when the component is removed or updated
  }, [handleKeyDown]); //Re-runs this if the handleKeyDown function itself changes

  /*
  useEffect hook for collision detection. This effect checks for collisions between the player and enemies, 
  and between the player and the level prize. It triggers game over or level complete states accordingly.
  */
  useEffect(() => {
    //Only perform collision checks if in the game screen, if the game is not over, or if level is not complete
    if (currentScreen !== "game" || gameOver || levelComplete) return;

    //Define the player's bounding box for collision detection
    const playerRect = {
      left: playerX,
      bottom: playerY,
      width: playerWidth - 15, //Adjusted width for more accurate hitbox
      height: playerHeight,
    };

    const hitboxPadding = 0; //Padding to adjust enemy hitbox size (if desired)

    //Loop through each enemy to check for collision with the player
    for (const enemy of enemies) {
      //Define the enemy's bounding box, potentially adjusted with padding
      const enemyRect = {
        left: enemy.left + hitboxPadding,
        bottom: enemy.bottom + hitboxPadding,
        width: (enemy.width - 2 * hitboxPadding) - 10, //Adjusted width for enemy hitbox
        height: enemy.height - 2 * hitboxPadding,
      };

      /*
      Performed Axis-Aligned Bounding Box (AABB) collision detection. If there is no overlap on any axis,
      then there is no collision. So, if there is overlap then a collision has occurred.
      */
      // Assisted by ChatGPT
      if (
        !(
          playerRect.left > enemyRect.left + enemyRect.width ||
          playerRect.left + playerRect.width < enemyRect.left ||
          playerRect.bottom > enemyRect.bottom + enemyRect.height ||
          playerRect.bottom + playerRect.height < enemyRect.bottom
        )
      ) {
        deathRef.current?.play(); //Play the death sound effect
        setGameOver(true); //Set the game over state to true
        setTimerRunning(false); //Stop the game timer
        return; //Exit the effect
      }
    }

    //Check for collision with the prize if the prize object exists
    if (
      prize &&
      !(
        playerRect.left > prize.left + prize.width ||
        playerRect.left + playerRect.width < prize.left ||
        playerRect.bottom > prize.bottom + prize.height ||
        playerRect.bottom + playerRect.height < prize.bottom
      )
    ) {
      setLevelComplete(true); //Set the level complete state to true
      setTimerRunning(false); //Stop the game timer

      //Update the leaderboard with the current level's time if it's a new fastest time
      //Assisted by ChatGPT
      setLeaderboard((prev) => {
        const levelName = levels[currentLevelIndex].name;
        const currentBest = prev[levelName] ?? Infinity; //Get the current best time for this level from the leaderboard, or Infinity if none exists
        if (elapsedTime < currentBest) {
          const updated = { ...prev, [levelName]: elapsedTime }; //Create a new leaderboard object with the updated time
          localStorage.setItem("leaderboard", JSON.stringify(updated)); //Save the updated leaderboard to local storage
          return updated; //Return the updated leaderboard state
        }
        return prev;
      });
    }
  }, [playerX, playerY, enemies, prize, gameOver, levelComplete, currentScreen, elapsedTime, currentLevelIndex]); //Dependencies for collision detection

  /*
  useEffect hook to load leaderboard data from local storage when the component mounts.
  This ensures that previously saved high scores are displayed.
  */
  //Assisted by ChatGPT
  useEffect(() => {
    const saved = localStorage.getItem("leaderboard"); //Retrieve 'leaderboard' data from local storage
    if (saved) {
      setLeaderboard(JSON.parse(saved)); //If data exists, parse the JSON string and set it as the leaderboard state
    }
  }, []); //Empty dependency array

  /*
  restartGame function resets the current game level's state (player position, enemies, etc.)
  without resetting the elapsed time, and ensures the timer starts running again.
  */
  const restartGame = () => {
    resetGameState(); //Calls the memoized resetGameState function to reset game elements
    setTimerRunning(true); //Ensures the timer starts running again after the restart
  };

  
  //formatTime is a function to help format a time in milliseconds into (Minutes:Seconds.Hundredths) format
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000); // Calculate total seconds from milliseconds
    const minutes = Math.floor(totalSeconds / 60); // Get the number of full minutes
    const seconds = totalSeconds % 60; // Get the remaining seconds after extracting minutes
    const hundredths = Math.floor((ms % 1000) / 10); // Get the hundredths of a second
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`; // Format with leading zeros
  };

  /*
  resetLeaderboard function clears all saved leaderboard data from local storage
  and resets the in-memory leaderboard state.
  */
  //Assisted by ChatGPT
  const resetLeaderboard = () => {
    localStorage.removeItem("leaderboard"); //Removes the leaderboard item from the browser's local storage
    setLeaderboard({}); //Resets the leaderboard state in the component to an empty object
  };

  //handleBackToMenu function for going back to the main menu.
  const handleBackToMenu = () => {
    setCurrentScreen("menu"); //Sets the current screen state to "menu"
    setIsTransitioning(false); //Reset transition state here when going back to menu directly, to avoid lingering wipe effects
    setNextLevelToLoad(null); //Clears any pending next level to load
  };

  //Defines what user interface will look when currentScreen state is set to main menu. ChatGPT was used to help set up initial layout.
  //Blocks of code below represent buttons that are available to be pressed to access other screen windows
  return (
    <div className="App">
      {currentScreen === "menu" ? ( 
        <div className="menu-screen">

=======
          <BackgroundMusic bg={menuMusic}/>
          <h1>Duck, Duck, Squatch</h1>
          <h2>Select a Level</h2> 
          {levels.map((lvl, i) => (
            <button key={i} onClick={() => loadLevel(i)}>
              {lvl.name}
            </button>
          ))}

          <button onClick={() => setCurrentScreen("about")}>About the Creators</button>
          <div className="leaderboard">
            <h3>Leaderboard (Fastest Level Times)</h3>
            {(() => {
              const entries = Object.entries(leaderboard).map(([levelName, time]) => ({ levelName, time }));
              entries.sort((a, b) => a.time - b.time);
              const top3 = entries.slice(0, 3);
              if (top3.length === 0) {
                return <p>No records yet</p>;
              }
              return top3.map(({ levelName, time }, index) => (
                <p key={levelName}>
                  {levelName}: {formatTime(time)}
                </p>
              ));
            })()}
            <button onClick={resetLeaderboard}>Reset Leaderboard</button>
          </div>

          <div className="instructions">
            <h3>Instructions</h3>
            <p>Avoid all the sasquatches for a prize at the end!</p>
          </div>
        </div>

      /*Start of "About the Creators" section. When currentScreen state variable is switched to "about" section, new screen pops up detailing the 
        profiles of all three creators (Samuel, Alex, and Yiska). All text references font defined in .App of App.css to match the other menu options. 
        Each creator profile presents a name, picture, short bio and LinkedIn link. ChatGPT assisted with inital layout but everything else was manually 
        designed to fit on page.
      */
      ) : currentScreen === "about" ? (
        <div className="about-screen" style={{ padding: "20px", textAlign: "center" }}>
          <h1>Meet the Creators</h1>

          <div className="creator-profile" style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "20px", justifyContent: "center" }}>
            <img src={samPhoto} alt="Samuel Zhang" style={{ width: "120px", height: "auto", borderRadius: "8px" }}/>
        <div style={{ textAlign: "left", maxWidth: "500px" }}>
    <h2 style={{ fontSize: "18px" }}>Samuel Zhang</h2>
    <p>
      Hello everyone! I'm majoring in mechanical engineering. 
      In the future, I envision myself working in robotics. 
      I love playing basketball and am a huge LeBron Fan!
    </p>
    <a
      href="https://www.linkedin.com/in/zhangsamuell/"
      target="_blank"
      rel="noopener noreferrer"
    >
      LinkedIn Profile
    </a>
  </div>
</div>


          <div className="creator-profile" style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "20px", justifyContent: "center" }}>
            <img src={alexPhoto} alt="Alex Lopez" style={{ width: "120px", height: "auto", borderRadius: "8px" }}/>
        <div style={{ textAlign: "left", maxWidth: "500px" }}>
    <h2 style={{ fontSize: "18px" }}>Alex Lopez</h2>
    <p>
      Hello everyone! I'm majoring in mechanical engineering. 
      I plan on earning a Master's Degree or PhD in Engineering. 
      Fun fact, I'm a huge Dodgers Fan!
    </p>
    <a
      href="https://www.linkedin.com/in/alexlopez1159/"
      target="_blank"
      rel="noopener noreferrer"
    >
      LinkedIn Profile
    </a>
  </div>
</div>

          <div className="creator-profile" style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "20px", justifyContent: "center" }}>
  <img
    src={yiskaPhoto}
    alt="Yiska Anastasia"
    style={{ width: "120px", height: "auto", borderRadius: "8px" }}
  />
  <div style={{ textAlign: "left", maxWidth: "500px" }}>
    <h2 style={{ fontSize: "18px" }}>Yiska Anastasia</h2>
    <p>
      Hello everyone! My name is Yiska and I'm majoring in electrical engineering.
      I want to work in the semiconductor field or gain a Master's Degree in
      electrical engineering. In my free time, I enjoy hiking and crafting with my hands!
    </p>
    <a
      href="https://www.linkedin.com/in/graciela-yiska-anastasia-489743320/"
      target="_blank"
      rel="noopener noreferrer"
    >
      LinkedIn Profile
    </a>
  </div>
</div>

          {/*Button to go back to the main menu from the about screen*/}
          <button
            onClick={() => setCurrentScreen("menu")}
            style={{ marginTop: "40px", padding: "10px 20px", fontSize: "16px" }}
          >
            Back to Menu
          </button>
        </div>
      ) : (
        <div className="game-layout">
          <div
            className="game-board"
            style={{ backgroundImage: `url(${levels[currentLevelIndex].background})` }} //Sets the background image for the current level
          >
            {/*SoundEffect components*/}
            <SoundEffect ref={soundRef} bg={quackSound} />
            <SoundEffect ref={deathRef} bg={deadSound} />
            <SoundEffect ref={fallRef} bg={dropSound} />
            <BackgroundMusic bg={levels[currentLevelIndex].music}/> {/*Plays background music for the current level*/}
            {/*Player component, positioned relative to the scroll position*/}
            <Player x={playerX - scrollX} y={playerY} img={duckImg} />
            {/*Map and render Platform components for the current level*/}
            {platforms.map((plat, i) => (
              <Platform
                key={i}
                left={plat.left - scrollX} //Scroll position adjustment
                bottom={plat.bottom}
                width={plat.width}
              />
            ))}
            {/*Map and render Enemy components for the current level*/}
            {enemies.map((enemy, i) => (
              <Enemy
                key={i}
                left={enemy.left - scrollX} //Scroll position adjustment
                bottom={enemy.bottom}
                width={enemy.width}
                height={enemy.height}
                img={bigfootImg}
              />
            ))}
            {/*Render the prize image for the current level*/}
            {prize && (
              <img
                src={watermelonImg}
                alt="Watermelon Prize"
                style={{
                  position: "absolute",
                  left: prize.left - scrollX, //Scroll position adjustment
                  bottom: prize.bottom,
                  width: prize.width,
                  height: prize.height,
                  zIndex: 3, //Ensures the prize image is above all other components
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}

            {/*Game Over or Level Complete overlay, displayed when either is true*/}
            {(gameOver || levelComplete) && (
              <div className="game-over">
                <h1>{gameOver ? "Game Over" : "Level Complete!"}</h1> {/*Displays appropriate message*/}
                {gameOver ? (
                  <button onClick={restartGame}>Restart</button> //If game over, show a Restart button
                ) : (
                  <>
                    <button onClick={restartGame}>Replay Level</button> {/*If level complete, show Replay Level*/}
                    <button
                      onClick={() => {
                        //If not the last level, trigger transition to the next level
                        if (currentLevelIndex < levels.length - 1) {
                          startTransitionToLevel(currentLevelIndex + 1);
                        }
                      }}
                      disabled={currentLevelIndex >= levels.length - 1} //Disable Next Level button if it's the last level
                    >
                      Next Level
                    </button>
                  </>
                )}
              </div>
            )}

            {/*Screen wipe transition overlay, visible only when `isTransitioning` is true*/}
            {isTransitioning && currentScreen !== 'menu' && (
              <div
                className="screen-wipe expand" //Expand class initiates the screen wipe animation
                onAnimationEnd={handleOverlayAnimationEnd} //handleOverlayAnimationEnd triggered when the CSS animation finishes
              />
            )}

            {/*Timer display and control buttons within the game board*/}
            <div className="timer-display">
              <h3>Timer: {formatTime(elapsedTime)}</h3> {/*Displays the formatted elapsed time*/}
              {!timerRunning ? (
                <button onClick={() => setTimerRunning(true)}>Start Timer</button> //Button to start the timer
              ) : (
                <button onClick={() => setTimerRunning(false)}>Stop Timer</button> //Button to stop the timer
              )}
            </div>
          </div>

          {/*Side panel containing game controls and additional options*/}
          <div className="side-panel">
            <div className="instructions">
              <h3>Keyboard Controls</h3>
              <p>← Left Arrow: Move Left</p>
              <p>→ Right Arrow: Move Right</p>
              <p>↑ Up Arrow or Space: Jump</p>
            </div>
            <div className="instructions">
              <h3>Mouse Controls</h3>
            </div>
            <div className="controls">
              <div className="horizontal-buttons">
                {/*Mouse-controlled Left movement button*/}
                <button
                  onClick={() =>
                    setVelocityX((vx) => Math.max(vx - MOVE_ACCELERATION, -MAX_SPEED))
                  }
                >
                  Left
                </button>
                {/*Mouse-controlled Right movement button*/}
                <button
                  onClick={() =>
                    setVelocityX((vx) => Math.min(vx + MOVE_ACCELERATION, MAX_SPEED))
                  }
                >
                  Right
                </button>
              </div>
              {/*Mouse-controlled Jump button*/}
              <button
                onClick={() => {
                  if (!isJumping) { //Allow jump only if not already jumping
                    setVelocityY(JUMP_VELOCITY);
                    setIsJumping(true);
                  }
                }}
              >
                Jump
              </button>
            </div>

            <button onClick={restartGame}>Restart Level</button> {/*Button to restart the current level*/}

            <button onClick={handleBackToMenu}>Back to Menu</button> {/*Button to go back to the main menu*/}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
