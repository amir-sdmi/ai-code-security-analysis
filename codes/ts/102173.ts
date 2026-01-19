import {
  receptionInnovationSkillSet,
  nextjsSkillSet,
  links,
  T3StackSkillSet,
} from "@/constants";

const tmpPic = "/images/profile/developer-pic-1.png"; // ポートフォリオサイトの画像
const tokyoGasPic = "/images/projects/tokyo-gas2.png"; // 東京ガスの画像
const tokyoGasHenkoPic = "/images/projects/tokyo-gas-henko.png"; // picture for tokyo gas henko screens
const tokyoGasCustomerSearchPic =
  "/images/projects/tokyo-gas-customer-search.png"; // picture for tokyo gas customer search screens
const tokyoGasFuriwakePic = "/images/projects/tokyo-gas-furiwake.png"; // picture for tokyo gas furiwake screens
const chatGptColonePic = "/images/projects/chat-gpt-clone.png"; // ChatGPT クローンの画像
const chatBot3dPic = "/images/projects/3d-chatbot.png"; // 3Dチャットボットの画像
const onDevelopingPic = "/images/projects/onDeveloping.jpg"; // 開発中の画像
const advancedSearchYoutubePic = "/images/projects/advanced-search-youtube.png"; // picture for advanced search youtube
const restaurantAroundStationPic =
  "/images/projects/restaurant-around-station.png"; // picture for restaurant around station
const bankingAppPic = "/images/projects/banking-app.png"; // picture for banking app
const typingGamePic = "/images/projects/typing-game.png"; // picture for typing game
const TwodRpgPic = "/images/projects/2d-rpg-react.png"; // picture for 2d rpg
const ragChatBotAkiraShinguPic = "/images/projects/rag-chatbot-akirashingu.jpg"; // picture for rag chatbot akira shingu

export type ProjectContent = {
  title: string;
  description: string;
  image: string;
  githubUrl: string;
  liveUrl: string;
  technologies: string[];
};

export type MultilingualProjectProps = {
  technologies: string[];
  ja: ProjectContent;
  en: ProjectContent;
};

export const projects: MultilingualProjectProps[] = [
  //   {
  //     technologies: nextjsSkillSet,
  //     ja: {
  //       title: "開発予定を考えているアプリ",
  //       description: `[採用サイト間のプロフィール自動入力(データ連携)]
  // [画像認識を使用した何か]
  // [Visual Studioのプロジェクトファイル変換アプリ]
  // [何かのマッチングアプリ]
  // [何かのサイトのadvanced検索]
  // [オンライン会議アプリ]
  // [タイピング×パワハラ3Dボット]
  // [タイピング×Google Map]
  // [タイピング×2Dゲーム]
  // `,
  //       image: onDevelopingPic,
  //       githubUrl: "",
  //       liveUrl: "",
  //     },
  //     en: {
  //       title: "Planned Applications",
  //       description: `[Auto-fill Profile Data Across Recruitment Sites]
  // [Image Recognition Application]
  // [Visual Studio Project File Converter]
  // [Matching Application]
  // [Advanced Search for Various Websites]
  // [Online Meeting Application]
  // [Typing Game with 3D Harassment Bot]
  // [Typing Game with Google Map Integration]
  // [Typing Game with 2D Game Elements]
  // `,
  //       image: onDevelopingPic,
  //       githubUrl: "",
  //       liveUrl: "",
  //     },
  //   },
  //   {
  //     technologies: [
  //       "React",
  //       "TypeScript",
  //       "Remix",
  //       "Hono.js",
  //       "DB(未定)",
  //       "Tailwind CSS",
  //       "lucide-react",
  //       "kaPlay",
  //     ],
  //     ja: {
  //       title: "2Dゲーム",
  //       description: `KaPlayライブラリを使用した2Dゲーム
  // ChatGPTが考えたストーリーを元にゲームボーイ風のグラフィックでの実装中。
  // あえてゲーム開発で、ReactおよびReact関連のライブラリを使用することで、
  // 普段の開発では気づかない各ライブラリを使用時の特徴や、最適化について学習する。
  // `,
  //       image: TwodRpgPic,
  //       githubUrl: "https://github.com/shinguakira/2d-rpg-react",
  //       liveUrl: "",
  //     },
  //     en: {
  //       title: "2D Game",
  //       description: `A 2D game using the KaPlay library.
  // Currently implementing Game Boy-style graphics based on a story created by ChatGPT.
  // By deliberately using React and React-related libraries for game development,
  // I'm learning about the characteristics and optimization of libraries that I might not notice in regular development.
  // `,
  //       image: TwodRpgPic,
  //       githubUrl: "https://github.com/shinguakira/2d-rpg-react",
  //       liveUrl: "",
  //     },
  //   },
  //   {
  //     technologies: ["TypeScript", "Hono.js", "AWS Lambda"],
  //     ja: {
  //       title: "神宮章情報取得API(開発中)",
  //       description: `神宮章情報取得API
  // ポートフォリオを別パターン作成や、履歴書作成処理のために、メンテナンス時間削減のため、共通に使用できるAPI
  // データはDBなしでjsonで定義。
  // `,
  //       image: onDevelopingPic,
  //       githubUrl: "",
  //       liveUrl: "",
  //     },
  //     en: {
  //       title: "Akira Shingu Information API (In Development)",
  //       description: `An API for retrieving information about Akira Shingu.
  // Created to reduce maintenance time for portfolio creation and resume processing.
  // Data is defined in JSON without a database.
  // `,
  //       image: onDevelopingPic,
  //       githubUrl: "",
  //       liveUrl: "",
  //     },
  //   },
  //   {
  //     technologies: [
  //       "React",
  //       "TypeScript",
  //       "Remix",
  //       "Context API",
  //       "Tailwind CSS",
  //       "lucide-react",
  //     ],
  //     ja: {
  //       title: "国検索アプリ(開発中)",
  //       description: `国検索アプリ
  // 公開APIを使用して国情報を取得し、国名を検索するアプリ。
  // タイピングゲームと紐づけたり、国名検索だけでなくより細かい、州や県、市などを検索する実装も検討中
  // `,
  //       image: onDevelopingPic,
  //       githubUrl: "",
  //       liveUrl: "",
  //     },
  //     en: {
  //       title: "Country Search App (In Development)",
  //       description: `An application that retrieves and searches for country information using a public API.
  // Considering implementations to link with typing games and search for more detailed information such as states, prefectures, and cities.
  // `,
  //       image: onDevelopingPic,
  //       githubUrl: "",
  //       liveUrl: "",
  //     },
  //   },
  //   {
  //     technologies: [
  //       ...nextjsSkillSet,
  //       "AstraDB(Apache Cassandra)",
  //       "@ai-sdk/react",
  //       "OpenAI API",
  //       "shadcn",
  //       "lucide-react",
  //     ],
  //     ja: {
  //       title: "神宮章情報用RAGチャットボット",
  //       description: `神宮章情報用RAGチャットボット
  // 読み込ませたベクトル情報から神宮章に関する情報を取得するRAGチャットボット
  // 精度向上のためベクトルの近似の調整や、データの区切りの適切かが必要そう。
  // Amazon Kendraを使ったRAGチャットボットに似た挙動
  // `,
  //       image: ragChatBotAkiraShinguPic,
  //       githubUrl: "https://github.com/shinguakira/rag-skill-match",
  //       liveUrl: "",
  //     },
  //     en: {
  //       title: "RAG Chatbot for Akira Shingu Information",
  //       description: `A RAG chatbot that retrieves information about Akira Shingu from loaded vector data.
  // Requires adjustment of vector approximation and appropriate data segmentation for accuracy improvement.
  // Similar behavior to an Amazon Kendra-based RAG chatbot.
  // `,
  //       image: ragChatBotAkiraShinguPic,
  //       githubUrl: "https://github.com/shinguakira/rag-skill-match",
  //       liveUrl: "",
  //     },
  //   },
  //   {
  //     technologies: [
  //       ...nextjsSkillSet,
  //       "Hono.js",
  //       "Redis(Upstash)",
  //       "Bun",
  //       "shadcn",
  //       "lucide-react",
  //     ],
  //     ja: {
  //       title: "タイピングゲーム",
  //       description: `タイピングゲーム
  // 様々なモードを実装。tailWindCSSやshadcnなどのコードを練習できるモードあり
  // 効果音を選択できることによって好きな効果音でプレイできます
  // `,
  //       image: typingGamePic,
  //       githubUrl: "https://github.com/shinguakira/typing-game-hono",
  //       liveUrl: "https://typing-game-hono.vercel.app/",
  //     },
  //     en: {
  //       title: "Typing Game",
  //       description: `A typing game with various modes.
  // Includes modes for practicing Tailwind CSS and shadcn code.
  // You can select different sound effects to play with your preferred audio feedback.
  // `,
  //       image: typingGamePic,
  //       githubUrl: "https://github.com/shinguakira/typing-game-hono",
  //       liveUrl: "https://typing-game-hono.vercel.app/",
  //     },
  //   },
  //   {
  //     technologies: [
  //       ...nextjsSkillSet,
  //       "Sentry",
  //       "Appwrite",
  //       "Dwolla",
  //       "shadcn",
  //       "lucide-react",
  //     ],
  //     ja: {
  //       title: "バンキングアプリ",
  //       description: `バンキングアプリ、Sentryによるエラーログ、エラー発生時のリプレイ機能付き
  // `,
  //       image: bankingAppPic,
  //       githubUrl: "https://github.com/shinguakira/banking-nextjs",
  //       liveUrl: "https://banking-horizon-sooty.vercel.app/sign-in",
  //     },
  //     en: {
  //       title: "Banking App",
  //       description: `A banking application with Sentry error logging and replay functionality when errors occur.
  // `,
  //       image: bankingAppPic,
  //       githubUrl: "https://github.com/shinguakira/banking-nextjs",
  //       liveUrl: "https://banking-horizon-sooty.vercel.app/sign-in",
  //     },
  //   },
  //   {
  //     technologies: [
  //       ...T3StackSkillSet,
  //       "Google Map API",
  //       "shadcn",
  //       "lucide-react",
  //     ],
  //     ja: {
  //       title: "現在いる最寄り駅の飲食店情報リスト表示アプリ",
  //       description: `最寄りの駅の飲食店情報リストをGooogle Mapで表示するアプリ
  // `,
  //       image: restaurantAroundStationPic,
  //       githubUrl: "",
  //       liveUrl: links.restaurantAroundStationLink,
  //     },
  //     en: {
  //       title: "Restaurant Information App for Nearby Stations",
  //       description: `An application that displays restaurant information for the nearest station on Google Maps.
  // `,
  //       image: restaurantAroundStationPic,
  //       githubUrl: "",
  //       liveUrl: links.restaurantAroundStationLink,
  //     },
  //   },
  //   {
  //     technologies: [
  //       ...nextjsSkillSet,
  //       "Youtube Data API",
  //       "shadcn",
  //       "lucide-react",
  //     ],
  //     ja: {
  //       title: "Youtube動画のadvanced検索(随時更新中)",
  //       description: `Youtubeの詳細検索サイト
  // 公式のYoutubeではできない詳細な検索によって効率よく目的の動画を探すことができるサイト
  // 検索条件を随時更新いたしますので、ご要望お問い合わせお待ちしております。
  // 他のサービスのバージョンも開発予定です。`,
  //       image: advancedSearchYoutubePic,
  //       githubUrl: "",
  //       liveUrl: links.advancedSearchYoutubeLink,
  //     },
  //     en: {
  //       title: "Advanced YouTube Video Search (Regularly Updated)",
  //       description: `A detailed search site for YouTube.
  // Efficiently find the videos you're looking for with detailed search options not available on the official YouTube site.
  // Search conditions are regularly updated. Please feel free to contact us with your requests.
  // Planning to develop versions for other services as well.`,
  //       image: advancedSearchYoutubePic,
  //       githubUrl: "",
  //       liveUrl: links.advancedSearchYoutubeLink,
  //     },
  //   },
  //   {
  //     technologies: [
  //       "React",
  //       "Typescript",
  //       "Next.js",
  //       "Styled Components",
  //       "Vercel",
  //       "Google Text-to-Speech API",
  //       "OpenAI API",
  //       "babyron.js",
  //     ],
  //     ja: {
  //       title: "パワハラ訓練3Dチャットボット",
  //       description: `パワハラ気質の上司になりきったチャットボットと会話ができるアプリ
  // ※開発者は考案者ではありません。
  // 会話の内容は、OpenAIのGPT-4を使用しています。
  // 他のリポジトリをfolkして、要件に合うようにカスタマイズしています。
  // 元のソースとの変更点
  // ・パワハラ上司っぽい会話内容
  // ・一定の期間(30秒)ごとに特定の音声付きチャットをボットが送信する。十数パターンあります。`,
  //       image: chatBot3dPic,
  //       githubUrl: "https://github.com/shinguakira/3d-chatbot-power",
  //       liveUrl: "https://3d-chatbot-power.vercel.app/",
  //     },
  //     en: {
  //       title: "Workplace Harassment Training 3D Chatbot",
  //       description: `An application where you can converse with a chatbot that acts like a boss with harassment tendencies.
  // *Note: I am not the original creator of this concept.
  // The conversation content uses OpenAI's GPT-4.
  // I forked another repository and customized it to meet the requirements.
  // Changes from the original source:
  // - Conversation content mimicking a harassing boss
  // - The bot sends specific voice-enabled chats at regular intervals (30 seconds). There are over a dozen patterns.`,
  //       image: chatBot3dPic,
  //       githubUrl: "https://github.com/shinguakira/3d-chatbot-power",
  //       liveUrl: "https://3d-chatbot-power.vercel.app/",
  //     },
  //   },
  //   {
  //     technologies: ["React", "Vite", "Typescript"],
  //     ja: {
  //       title: "ChatGPT クローン",
  //       description: "フロントVite,React,バックExpress.js使用のChatGPTクローン",
  //       image: chatGptColonePic,
  //       githubUrl: "https://github.com/shinguakira/gpt-clone",
  //       liveUrl: "",
  //     },
  //     en: {
  //       title: "ChatGPT Clone",
  //       description:
  //         "A ChatGPT clone using Vite, React for frontend and Express.js for backend",
  //       image: chatGptColonePic,
  //       githubUrl: "https://github.com/shinguakira/gpt-clone",
  //       liveUrl: "",
  //     },
  //   },
  //   {
  //     technologies: [...nextjsSkillSet, "lucide-react"],
  //     ja: {
  //       title: "ポートフォリオWebサイト",
  //       description: "経歴、職務経歴等の情報を記載",
  //       image: `${tmpPic}?height=400&width=600`,
  //       githubUrl: "",
  //       liveUrl: "/",
  //     },
  //     en: {
  //       title: "Portfolio Website",
  //       description:
  //         "A website showcasing my background, work history, and other professional information",
  //       image: `${tmpPic}?height=400&width=600`,
  //       githubUrl: "",
  //       liveUrl: "/",
  //     },
  //   },
];
