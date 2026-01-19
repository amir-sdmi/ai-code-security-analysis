import React from "react";
import styles from "./Home.module.css";
import mobileStyles from "./Home.mobile.module.css";
import ImageTextComponents from "./components/Image_text_components";
import TextImageComponents from "./components/Text_iamge_components";
import DownloadComponents from "./components/Download_components";
import Footer from "./components/Footer";

import display from "../assets/images/display.png";
import aiTutor from "../assets/images/ai_tutor.png";
import practice from "../assets/images/practice.png";
import score from "../assets/images/score.png";
import tips from "../assets/images/tips.png";
import topics from "../assets/images/topics.png";

function HomePage() {
  return (
    //  Header
    <div>
      <header className={`${styles.home__header} ${mobileStyles.home__header}`}>
        <span
          className={`${styles.home__ttf_text} ${mobileStyles.home__ttf_text}`}
        >
          Thirtyful
        </span>
        <span>for</span>
        <span
          className={`${styles.home__header__ielts__red} ${mobileStyles.home__header__ielts__red}`}
        >
          IELTS
        </span>
      </header>

      <body
        className={`${styles.home__background} ${mobileStyles.home__background}`}
      >
        {/* ImageTextComponents = 이미지가 왼쪽, 텍스트가 오른쪽 */}
        {/* TextImageComponents = 텍스트가 왼쪽, 이미지가 오른쪽 */}
        <ImageTextComponents
          imageSrc={display}
          altText={"Display Image"}
          title={"Unleash Your IELTS Potential with Thirtyful"}
          contents={
            "Embrace AI-Powered Realistic Testing and In-depth Learning, powered by ChatGPT"
          }
        />
        <TextImageComponents
          imageSrc={aiTutor}
          altText={"aiTutor Image"}
          title={
            "You can take a test almost the same as the IELTS Speaking test."
          }
          contents={
            "Are you planning to take the IELTS test soon? Now, you can take practice tests right from your mobile phone and receive instant scores!"
          }
        />
        <ImageTextComponents
          imageSrc={practice}
          altText={"practice Image"}
          title={"Best way to practice IELTS Speaking!"}
          contents={
            "Chat and practice IELTS speaking anytime, anywhere with your always-ready AI tutor. Speak up, we're listening!"
          }
        />
        <TextImageComponents
          imageSrc={score}
          altText={"score Image"}
          title={"Get your scores from tests and practices!"}
          contents={
            "After taking a test or practice, Thirtyful A.I system predicts your scores and generate rich feedbacks of each answers you made!"
          }
        />
        <ImageTextComponents
          imageSrc={tips}
          altText={"tips Image"}
          title={"You want to get higher scores in the speaking part?"}
          contents={
            "The most advanced A.I system is here to help you with better answers! Even it gives you sample answers if you have no idea about the question."
          }
        />
        <TextImageComponents
          imageSrc={topics}
          altText={"topics Image"}
          title={"Feeling ready for IELTS topics?"}
          contents={
            "Dive into a world of diverse topics with Thirtyful - just like the real test. Let's ace this together!"
          }
        />

        {/* 앱스토어 다운로드 링크 */}
        <DownloadComponents />
      </body>

      {/* Footer */}
      <footer>
        <Footer />
      </footer>
    </div>
  );
}

export default HomePage;
