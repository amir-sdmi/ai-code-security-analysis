/**
 * 메뉴 텍스트 파서 서비스
 * Gemini API로부터 받은 텍스트를 Slack 메시지 형식으로 변환
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
// dayjs.tz.setDefault('Asia/Seoul'); // 이 줄을 추가합니다.

// Gemini 로고 경로
const geminiLogo =
  'https://registry.npmmirror.com/@lobehub/icons-static-png/1.41.0/files/light/gemini-color.png';

interface SlackMenuItem {
  title: string;
  value: string;
  short: boolean;
}

// 기존 방식의 Slack 메시지 포맷 (Type1)
export interface SlackMenuMessageType1 {
  text: string;
  attachments: Array<{
    color?: string;
    pretext?: string;
    title?: string;
    title_link?: string;
    text?: string;
    fields?: SlackMenuItem[];
    footer?: string;
    footer_icon?: string;
    type?: string;
    url?: string;
    action_id?: string;
    ts?: string;
    buttonText?: {
      type: string;
      text: string;
    };
    actions?: Array<{
      type: string;
      text: string;
      url: string;
    }>;
  }>;
}

// 마크다운 포맷을 지원하는 Slack 메시지 포맷 (Type2)
export interface SlackMenuMessageType2 {
  blocks: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    elements?: Array<{
      type: string;
      text?: {
        type: string;
        text: string;
      };
      url?: string;
      action_id?: string;
    }>;
  }>;
}

// 통합 Slack 메시지 타입 (두 가지 타입 중 하나)
export type SlackMenuMessage = SlackMenuMessageType1 | SlackMenuMessageType2;

// 메뉴 데이터 인터페이스 정의
interface MenuData {
  weeklyMenu: {
    [dateKey: string]: {
      breakfast?: {
        main?: string[] | null;
        salad?: string[] | null;
      };
      lunch?: {
        main_1?: string[] | null;
        main_2?: string[] | null;
        salad?: string[] | null;
      };
    };
  };
}

/**
 * 현재 요일에 맞는 메뉴 정보 가져오기
 * @param jsonText JSON 형태의 메뉴 텍스트
 * @returns 오늘의 메뉴 정보
 */
function getTodayMenuFromJson(jsonText: string): {
  breakfast: { main: string[] | null; salad: string[] | null };
  lunch: {
    main_1: string[] | null;
    main_2: string[] | null;
    salad: string[] | null;
  };
} | null {
  try {
    // JSON 문자열에서 실제 JSON 부분만 추출
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    // JSON 파싱
    const menuData = JSON.parse(jsonMatch[0]) as MenuData;

    // 오늘 날짜에 맞는 요일 구하기 (0: 일요일, 1: 월요일, ..., 6: 토요일)
    const today = dayjs().day();

    // 주말인 경우 (토요일, 일요일)
    if (today === 0 || today === 6) {
      return null;
    }

    // 요일 매핑
    const dayMap = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const targetDay = dayMap[today];

    // 해당 요일 데이터 찾기
    const todayData = Object.entries(menuData.weeklyMenu).find(([key]) =>
      key.includes(targetDay),
    );

    if (!todayData) return null;

    console.log('todayData', todayData);
    // 오늘의 메뉴 데이터
    const dayMenu = todayData[1];

    return {
      breakfast: {
        main: dayMenu.breakfast?.main || null,
        salad: dayMenu.breakfast?.salad || null,
      },
      lunch: {
        main_1: dayMenu.lunch?.main_1 || null,
        main_2: dayMenu.lunch?.main_2 || null,
        salad: dayMenu.lunch?.salad || null,
      },
    };
  } catch (error) {
    console.error('메뉴 JSON 파싱 중 오류 발생:', error);
    return null;
  }
}

/**
 * 메뉴 배열을 문자열로 변환
 * @param menuArray 메뉴 배열
 * @returns 포맷된 메뉴 문자열
 */
function formatMenuArray(menuArray: string[] | null): string {
  if (!menuArray || menuArray.length === 0 || menuArray[0] === 'null') {
    return '정보가 없습니다.';
  }

  return menuArray.map((item) => `- ${item.trim()}`).join('\n');
}

/**
 * 날짜를 포맷팅합니다.
 * @param date 날짜 객체
 * @returns 포맷팅된 날짜 문자열 (YYYY년 MM월 DD일 요일)
 */
export function formatDate(date: dayjs.Dayjs): string {
  const year = date.year();
  const month = date.month() + 1;
  const day = date.date();

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.day()];

  return `${year}년 ${month}월 ${day}일 (${dayName}) `;
}

/**
 * 메뉴 텍스트를 기존 Slack 포맷(Type1)으로 변환
 * @param menuText Gemini API에서 추출한 텍스트
 * @param imageUrl 메뉴 이미지 URL
 * @returns Slack 메시지 객체 (Type1)
 */
export function parseMenuTextToSlackFormat(
  menuText: string,
  imageUrl: string,
): SlackMenuMessageType1 {
  // JSON에서 오늘의 메뉴 정보 추출
  const todayMenu = getTodayMenuFromJson(menuText);
  console.log('메뉴 JSON 파싱 결과:', todayMenu);

  // 기본 메시지 구조
  const slackMessage: SlackMenuMessageType1 = {
    text: '오늘 뭐 먹지? 🤤',
    attachments: [
      {
        color: '#ffffff',
        pretext: `📩 ${formatDate(dayjs())} 오늘의 메뉴가 도착했습니다.`,
      },
    ],
  };

  // 메뉴 정보 첨부
  if (todayMenu) {
    // 조식 정보
    slackMessage.attachments.push({
      color: '#8e44ad',
      title: '📝 조식 메뉴',
      fields: [
        {
          title: '오늘의 집밥 🍚',
          value: formatMenuArray(todayMenu.breakfast.main),
          short: true,
        },
        {
          title: '오늘의 샐러드 🥗',
          value: formatMenuArray(todayMenu.breakfast.salad),
          short: true,
        },
      ],
    });

    // 중식 정보
    slackMessage.attachments.push({
      color: '#36a64f',
      title: '📝 중식 메뉴',
      fields: [
        {
          title: '오늘의 집밥 🍚',
          value: formatMenuArray(todayMenu.lunch.main_1),
          short: true,
        },
        {
          title: '일품요리 🍱',
          value: formatMenuArray(todayMenu.lunch.main_2),
          short: true,
        },
      ],
      actions: [
        {
          type: 'button',
          text: '주간식단표 보러가기',
          url: imageUrl,
        },
      ],
    });

    // 중식 샐러드가 있는 경우 추가
    if (todayMenu.lunch.salad && todayMenu.lunch.salad[0] !== 'null') {
      slackMessage.attachments[
        slackMessage.attachments.length - 1
      ].fields?.push({
        title: '오늘의 샐러드 🥗',
        value: formatMenuArray(todayMenu.lunch.salad),
        short: true,
      });
    }

    // footer format 추가
    // footer 추가
    slackMessage.attachments[slackMessage.attachments.length - 1].footer =
      'Powered by Gemini';
    slackMessage.attachments[slackMessage.attachments.length - 1].footer_icon =
      geminiLogo;
    slackMessage.attachments[slackMessage.attachments.length - 1].ts = dayjs()
      .unix()
      .toString();
  } else {
    // 주말이거나 메뉴 정보가 없는 경우
    slackMessage.attachments.push({
      color: '#ff6b6b',
      text: '오늘은 주말이거나 메뉴 정보가 없습니다. 😅',
    });

    // 푸터 버튼 추가
    slackMessage.attachments[slackMessage.attachments.length - 1].footer =
      'Powered by Gemini';
    slackMessage.attachments[slackMessage.attachments.length - 1].footer_icon =
      geminiLogo;
    slackMessage.attachments[slackMessage.attachments.length - 1].ts = dayjs()
      .unix()
      .toString();
  }

  return slackMessage;
}

/**
 * 메뉴 텍스트를 마크다운 기반 Slack 포맷(Type2)으로 변환
 * @param menuText Gemini API에서 추출한 텍스트
 * @param imageUrl 메뉴 이미지 URL
 * @returns Slack 메시지 객체 (Type2)
 */
export function parseMenuTextToMarkdownSlackFormat(
  menuText: string,
  imageUrl: string,
): SlackMenuMessageType2 {
  // JSON에서 오늘의 메뉴 정보 추출
  const todayMenu = getTodayMenuFromJson(menuText);

  // 블록 메시지 구조 초기화
  const blocks: SlackMenuMessageType2['blocks'] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '오늘 뭐 먹지? 🤤',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📩 ${formatDate(dayjs())} 오늘의 메뉴가 도착했습니다.*`,
      },
    },
    {
      type: 'divider',
    },
  ];

  // 메뉴 정보가 있을 경우 마크다운 형식으로 추가
  if (todayMenu) {
    // 조식 메뉴
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🌅 조식 메뉴*',
      },
    });

    let breakfastText = '';

    // 조식 집밥
    if (todayMenu.breakfast.main && todayMenu.breakfast.main[0] !== 'null') {
      breakfastText += '*🍚 오늘의 집밥*\n';
      todayMenu.breakfast.main.forEach((item) => {
        breakfastText += `• ${item}\n`;
      });
    }

    // 조식 샐러드
    if (todayMenu.breakfast.salad && todayMenu.breakfast.salad[0] !== 'null') {
      breakfastText += '\n*🥗 오늘의 샐러드*\n';
      todayMenu.breakfast.salad.forEach((item) => {
        breakfastText += `• ${item}\n`;
      });
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: breakfastText || '정보가 없습니다.',
      },
    });

    // 구분선
    blocks.push({
      type: 'divider',
    });

    // 중식 메뉴
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🍽️ 중식 메뉴*',
      },
    });

    let lunchText = '';

    // 중식 집밥
    if (todayMenu.lunch.main_1 && todayMenu.lunch.main_1[0] !== 'null') {
      lunchText += '*🍚 오늘의 집밥*\n';
      todayMenu.lunch.main_1.forEach((item) => {
        lunchText += `• ${item}\n`;
      });
    }

    // 중식 일품
    if (todayMenu.lunch.main_2 && todayMenu.lunch.main_2[0] !== 'null') {
      lunchText += '\n*🍱 일품요리*\n';
      todayMenu.lunch.main_2.forEach((item) => {
        lunchText += `• ${item}\n`;
      });
    }

    // 중식 샐러드
    if (todayMenu.lunch.salad && todayMenu.lunch.salad[0] !== 'null') {
      lunchText += '\n*🥗 오늘의 샐러드*\n';
      todayMenu.lunch.salad.forEach((item) => {
        lunchText += `• ${item}\n`;
      });
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: lunchText || '정보가 없습니다.',
      },
    });
  } else {
    // 주말이거나 메뉴 정보가 없는 경우
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '오늘은 주말이거나 메뉴 정보가 없습니다. 😅',
      },
    });
  }

  // 구분선
  blocks.push({
    type: 'divider',
  });

  // 버튼 추가
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '주간식단표 보러가기',
        },
        url: imageUrl,
        action_id: 'button-action',
      },
    ],
  });

  return { blocks };
}
