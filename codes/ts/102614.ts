import Gen from "multi-json-to-ts";
import axios from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Was generated using ChatGPT
// https://chatgpt.com/share/66f95df3-e01c-8006-ab85-565ea50f20ed
async function main() {
  // 1. /v1/player/{player}/game-log/{season}/{game-type}
  try {
    const getPlayerGameLog1 = "https://api-web.nhle.com/v1/player/8478402/game-log/20232024/2";
    const getPlayerGameLog2 = "https://api-web.nhle.com/v1/player/8474567/game-log/20222023/3";
    const getPlayerGameLog3 = "https://api-web.nhle.com/v1/player/8471234/game-log/20212022/2";

    const playerGameLogData1 = await getRequest(getPlayerGameLog1);
    const playerGameLogData2 = await getRequest(getPlayerGameLog2);
    const playerGameLogData3 = await getRequest(getPlayerGameLog3);

    const genPlayerGameLog = new Gen("IPlayerGameLogOutput", "./output/interfaces/player/game-log", {
      backupOldFile: false,
      fileName: "PlayerGameLog",
      jsonVariations: [playerGameLogData1, playerGameLogData2, playerGameLogData3],
    });
    genPlayerGameLog.generateInterfaces();
  } catch (error) {
    console.error("Error fetching player game log:", error);
  }

  // 2. /v1/player/{player}/landing
  try {
    const getPlayerLanding1 = "https://api-web.nhle.com/v1/player/8478402/landing";
    const getPlayerLanding2 = "https://api-web.nhle.com/v1/player/8474567/landing";
    const getPlayerLanding3 = "https://api-web.nhle.com/v1/player/8471234/landing";

    const playerLandingData1 = await getRequest(getPlayerLanding1);
    const playerLandingData2 = await getRequest(getPlayerLanding2);
    const playerLandingData3 = await getRequest(getPlayerLanding3);

    const genPlayerLanding = new Gen("IPlayerLandingOutput", "./output/interfaces/player/landing", {
      backupOldFile: false,
      fileName: "PlayerLanding",
      jsonVariations: [playerLandingData1, playerLandingData2, playerLandingData3],
    });
    genPlayerLanding.generateInterfaces();
  } catch (error) {
    console.error("Error fetching player landing info:", error);
  }

  // 3. /v1/player/{player}/game-log/now
  try {
    const getPlayerGameLogNow1 = "https://api-web.nhle.com/v1/player/8478402/game-log/now";
    const getPlayerGameLogNow2 = "https://api-web.nhle.com/v1/player/8474567/game-log/now";
    const getPlayerGameLogNow3 = "https://api-web.nhle.com/v1/player/8471234/game-log/now";

    const playerGameLogNowData1 = await getRequest(getPlayerGameLogNow1);
    const playerGameLogNowData2 = await getRequest(getPlayerGameLogNow2);
    const playerGameLogNowData3 = await getRequest(getPlayerGameLogNow3);

    const genPlayerGameLogNow = new Gen("IPlayerGameLogNowOutput", "./output/interfaces/player/game-log", {
      backupOldFile: false,
      fileName: "PlayerGameLogNow",
      jsonVariations: [playerGameLogNowData1, playerGameLogNowData2, playerGameLogNowData3],
    });
    genPlayerGameLogNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching player game log for now:", error);
  }

  // 4. /v1/skater-stats-leaders/current
  try {
    const getSkaterStatsLeadersCurrent1 = "https://api-web.nhle.com/v1/skater-stats-leaders/current?categories=goals&limit=5";
    const getSkaterStatsLeadersCurrent2 = "https://api-web.nhle.com/v1/skater-stats-leaders/current?categories=assists&limit=10";
    const getSkaterStatsLeadersCurrent3 = "https://api-web.nhle.com/v1/skater-stats-leaders/current?categories=points&limit=3";

    const skaterStatsLeadersCurrentData1 = await getRequest(getSkaterStatsLeadersCurrent1);
    const skaterStatsLeadersCurrentData2 = await getRequest(getSkaterStatsLeadersCurrent2);
    const skaterStatsLeadersCurrentData3 = await getRequest(getSkaterStatsLeadersCurrent3);

    const genSkaterStatsLeadersCurrent = new Gen("ISkaterStatsLeadersCurrentOutput", "./output/interfaces/stats/skater/leaders", {
      backupOldFile: false,
      fileName: "SkaterStatsLeadersCurrent",
      jsonVariations: [skaterStatsLeadersCurrentData1, skaterStatsLeadersCurrentData2, skaterStatsLeadersCurrentData3],
    });
    genSkaterStatsLeadersCurrent.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current skater stats leaders:", error);
  }

  // 5. /v1/skater-stats-leaders/{season}/{game-type}
  try {
    const getSkaterStatsLeaders1 = "https://api-web.nhle.com/v1/skater-stats-leaders/20222023/2?categories=points&limit=5";
    const getSkaterStatsLeaders2 = "https://api-web.nhle.com/v1/skater-stats-leaders/20212022/3?categories=goals&limit=10";
    const getSkaterStatsLeaders3 = "https://api-web.nhle.com/v1/skater-stats-leaders/20232024/2?categories=assists&limit=3";

    const skaterStatsLeadersData1 = await getRequest(getSkaterStatsLeaders1);
    const skaterStatsLeadersData2 = await getRequest(getSkaterStatsLeaders2);
    const skaterStatsLeadersData3 = await getRequest(getSkaterStatsLeaders3);

    const genSkaterStatsLeaders = new Gen("ISkaterStatsLeadersOutput", "./output/interfaces/stats/skater/leaders", {
      backupOldFile: false,
      fileName: "SkaterStatsLeaders",
      jsonVariations: [skaterStatsLeadersData1, skaterStatsLeadersData2, skaterStatsLeadersData3],
    });
    genSkaterStatsLeaders.generateInterfaces();
  } catch (error) {
    console.error("Error fetching skater stats leaders:", error);
  }

  // 6. /v1/goalie-stats-leaders/current
  try {
    const getGoalieStatsLeadersCurrent = "https://api-web.nhle.com/v1/goalie-stats-leaders/current";

    const goalieStatsLeadersCurrentData = await getRequest(getGoalieStatsLeadersCurrent);

    const genGoalieStatsLeadersCurrent = new Gen("IGoalieStatsLeadersCurrentOutput", "./output/interfaces/stats/goalie/leaders", {
      backupOldFile: false,
      fileName: "GoalieStatsLeadersCurrent",
      jsonVariations: [goalieStatsLeadersCurrentData],
    });
    genGoalieStatsLeadersCurrent.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current goalie stats leaders:", error);
  }

  // 7. /v1/goalie-stats-leaders/{season}/{game-type}
  try {
    const getGoalieStatsLeaders1 = "https://api-web.nhle.com/v1/goalie-stats-leaders/20232024/2";
    const getGoalieStatsLeaders2 = "https://api-web.nhle.com/v1/goalie-stats-leaders/20222023/3";
    const getGoalieStatsLeaders3 = "https://api-web.nhle.com/v1/goalie-stats-leaders/20212022/2";

    const goalieStatsLeadersData1 = await getRequest(getGoalieStatsLeaders1);
    const goalieStatsLeadersData2 = await getRequest(getGoalieStatsLeaders2);
    const goalieStatsLeadersData3 = await getRequest(getGoalieStatsLeaders3);

    const genGoalieStatsLeaders = new Gen("IGoalieStatsLeadersOutput", "./output/interfaces/stats/goalie/leaders", {
      backupOldFile: false,
      fileName: "GoalieStatsLeaders",
      jsonVariations: [goalieStatsLeadersData1, goalieStatsLeadersData2, goalieStatsLeadersData3],
    });
    genGoalieStatsLeaders.generateInterfaces();
  } catch (error) {
    console.error("Error fetching goalie stats leaders:", error);
  }

  // 8. /v1/player-spotlight
  try {
    const getPlayerSpotlight = "https://api-web.nhle.com/v1/player-spotlight";

    const playerSpotlightData = await getRequest(getPlayerSpotlight);

    const genPlayerSpotlight = new Gen("IPlayerSpotlightOutput", "./output/interfaces/player", {
      backupOldFile: false,
      fileName: "PlayerSpotlight",
      jsonVariations: [playerSpotlightData],
    });
    genPlayerSpotlight.generateInterfaces();
  } catch (error) {
    console.error("Error fetching player spotlight:", error);
  }

  // 9. /v1/standings/now
  try {
    const getStandingsNow = "https://api-web.nhle.com/v1/standings/now";

    const standingsNowData = await getRequest(getStandingsNow);

    const genStandingsNow = new Gen("IStandingsNowOutput", "./output/interfaces/standings", {
      backupOldFile: false,
      fileName: "StandingsNow",
      jsonVariations: [standingsNowData],
    });
    genStandingsNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current standings:", error);
  }

  // 10. /v1/standings/{date}
  try {
    const getStandingsByDate1 = "https://api-web.nhle.com/v1/standings/2023-11-10";
    const getStandingsByDate2 = "https://api-web.nhle.com/v1/standings/2023-10-15";
    const getStandingsByDate3 = "https://api-web.nhle.com/v1/standings/2024-01-01";

    const standingsByDateData1 = await getRequest(getStandingsByDate1);
    const standingsByDateData2 = await getRequest(getStandingsByDate2);
    const standingsByDateData3 = await getRequest(getStandingsByDate3);

    const genStandingsByDate = new Gen("IStandingsByDateOutput", "./output/interfaces/standings", {
      backupOldFile: false,
      fileName: "StandingsByDate",
      jsonVariations: [standingsByDateData1, standingsByDateData2, standingsByDateData3],
    });
    genStandingsByDate.generateInterfaces();
  } catch (error) {
    console.error("Error fetching standings by date:", error);
  }

  // 11. /v1/standings-season
  try {
    const getStandingsSeason = "https://api-web.nhle.com/v1/standings-season";

    const standingsSeasonData = await getRequest(getStandingsSeason);

    const genStandingsSeason = new Gen("IStandingsSeasonOutput", "./output/interfaces/standings", {
      backupOldFile: false,
      fileName: "StandingsSeason",
      jsonVariations: [standingsSeasonData],
    });
    genStandingsSeason.generateInterfaces();
  } catch (error) {
    console.error("Error fetching standings season data:", error);
  }

  // 12. /v1/club-stats/{team}/now
  try {
    const getClubStatsNow1 = "https://api-web.nhle.com/v1/club-stats/TOR/now";
    const getClubStatsNow2 = "https://api-web.nhle.com/v1/club-stats/BOS/now";
    const getClubStatsNow3 = "https://api-web.nhle.com/v1/club-stats/EDM/now";

    const clubStatsNowData1 = await getRequest(getClubStatsNow1);
    const clubStatsNowData2 = await getRequest(getClubStatsNow2);
    const clubStatsNowData3 = await getRequest(getClubStatsNow3);

    const genClubStatsNow = new Gen("IClubStatsNowOutput", "./output/interfaces/club/stats", {
      backupOldFile: false,
      fileName: "ClubStatsNow",
      jsonVariations: [clubStatsNowData1, clubStatsNowData2, clubStatsNowData3],
    });
    genClubStatsNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club stats for now:", error);
  }

  // 13. /v1/club-stats-season/{team}
  try {
    const getClubStatsSeason1 = "https://api-web.nhle.com/v1/club-stats-season/TOR";
    const getClubStatsSeason2 = "https://api-web.nhle.com/v1/club-stats-season/BOS";
    const getClubStatsSeason3 = "https://api-web.nhle.com/v1/club-stats-season/EDM";

    const clubStatsSeasonData1 = await getRequest(getClubStatsSeason1);
    const clubStatsSeasonData2 = await getRequest(getClubStatsSeason2);
    const clubStatsSeasonData3 = await getRequest(getClubStatsSeason3);

    const genClubStatsSeason = new Gen("IClubStatsSeasonOutput", "./output/interfaces/club/stats", {
      backupOldFile: false,
      fileName: "ClubStatsSeason",
      jsonVariations: [clubStatsSeasonData1, clubStatsSeasonData2, clubStatsSeasonData3],
    });
    genClubStatsSeason.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club stats by season:", error);
  }

  // 14. /v1/club-stats/{team}/{season}/{game-type}
  try {
    const getClubStats1 = "https://api-web.nhle.com/v1/club-stats/TOR/20232024/2";
    const getClubStats2 = "https://api-web.nhle.com/v1/club-stats/BOS/20222023/3";
    const getClubStats3 = "https://api-web.nhle.com/v1/club-stats/EDM/20212022/2";

    const clubStatsData1 = await getRequest(getClubStats1);
    const clubStatsData2 = await getRequest(getClubStats2);
    const clubStatsData3 = await getRequest(getClubStats3);

    const genClubStats = new Gen("IClubStatsOutput", "./output/interfaces/club/stats", {
      backupOldFile: false,
      fileName: "ClubStats",
      jsonVariations: [clubStatsData1, clubStatsData2, clubStatsData3],
    });
    genClubStats.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club stats by season and game type:", error);
  }

  // 15. /v1/scoreboard/{team}/now
  try {
    const getScoreboardNow1 = "https://api-web.nhle.com/v1/scoreboard/TOR/now";
    const getScoreboardNow2 = "https://api-web.nhle.com/v1/scoreboard/BOS/now";
    const getScoreboardNow3 = "https://api-web.nhle.com/v1/scoreboard/EDM/now";

    const scoreboardNowData1 = await getRequest(getScoreboardNow1);
    const scoreboardNowData2 = await getRequest(getScoreboardNow2);
    const scoreboardNowData3 = await getRequest(getScoreboardNow3);

    const genScoreboardNow = new Gen("IScoreboardNowOutput", "./output/interfaces/club/scoreboard", {
      backupOldFile: false,
      fileName: "ScoreboardNow",
      jsonVariations: [scoreboardNowData1, scoreboardNowData2, scoreboardNowData3],
    });
    genScoreboardNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching scoreboard for now:", error);
  }

  // 16. /v1/roster/{team}/current
  try {
    const getTeamRosterNow1 = "https://api-web.nhle.com/v1/roster/TOR/current";
    const getTeamRosterNow2 = "https://api-web.nhle.com/v1/roster/BOS/current";
    const getTeamRosterNow3 = "https://api-web.nhle.com/v1/roster/EDM/current";

    const teamRosterNowData1 = await getRequest(getTeamRosterNow1);
    const teamRosterNowData2 = await getRequest(getTeamRosterNow2);
    const teamRosterNowData3 = await getRequest(getTeamRosterNow3);

    const genTeamRosterNow = new Gen("ITeamRosterNowOutput", "./output/interfaces/roster", {
      backupOldFile: false,
      fileName: "TeamRosterNow",
      jsonVariations: [teamRosterNowData1, teamRosterNowData2, teamRosterNowData3],
    });
    genTeamRosterNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current team roster:", error);
  }

  // 17. /v1/roster/{team}/{season}
  try {
    const getTeamRoster1 = "https://api-web.nhle.com/v1/roster/TOR/20232024";
    const getTeamRoster2 = "https://api-web.nhle.com/v1/roster/BOS/20222023";
    const getTeamRoster3 = "https://api-web.nhle.com/v1/roster/EDM/20212022";

    const teamRosterData1 = await getRequest(getTeamRoster1);
    const teamRosterData2 = await getRequest(getTeamRoster2);
    const teamRosterData3 = await getRequest(getTeamRoster3);

    const genTeamRoster = new Gen("ITeamRosterOutput", "./output/interfaces/roster", {
      backupOldFile: false,
      fileName: "TeamRoster",
      jsonVariations: [teamRosterData1, teamRosterData2, teamRosterData3],
    });
    genTeamRoster.generateInterfaces();
  } catch (error) {
    console.error("Error fetching team roster by season:", error);
  }

  // 18. /v1/roster-season/{team}
  try {
    const getRosterSeason1 = "https://api-web.nhle.com/v1/roster-season/TOR";
    const getRosterSeason2 = "https://api-web.nhle.com/v1/roster-season/BOS";
    const getRosterSeason3 = "https://api-web.nhle.com/v1/roster-season/EDM";

    const rosterSeasonData1 = await getRequest(getRosterSeason1);
    const rosterSeasonData2 = await getRequest(getRosterSeason2);
    const rosterSeasonData3 = await getRequest(getRosterSeason3);

    const genRosterSeason = new Gen("IRosterSeasonOutput", "./output/interfaces/roster", {
      backupOldFile: false,
      fileName: "RosterSeason",
      jsonVariations: [rosterSeasonData1, rosterSeasonData2, rosterSeasonData3],
    });
    genRosterSeason.generateInterfaces();
  } catch (error) {
    console.error("Error fetching roster seasons:", error);
  }

  // 19. /v1/prospects/{team}
  try {
    const getTeamProspects1 = "https://api-web.nhle.com/v1/prospects/TOR";
    const getTeamProspects2 = "https://api-web.nhle.com/v1/prospects/BOS";
    const getTeamProspects3 = "https://api-web.nhle.com/v1/prospects/EDM";

    const teamProspectsData1 = await getRequest(getTeamProspects1);
    const teamProspectsData2 = await getRequest(getTeamProspects2);
    const teamProspectsData3 = await getRequest(getTeamProspects3);

    const genTeamProspects = new Gen("ITeamProspectsOutput", "./output/interfaces/prospects", {
      backupOldFile: false,
      fileName: "TeamProspects",
      jsonVariations: [teamProspectsData1, teamProspectsData2, teamProspectsData3],
    });
    genTeamProspects.generateInterfaces();
  } catch (error) {
    console.error("Error fetching team prospects:", error);
  }

  // 20. /v1/club-schedule-season/{team}/now
  try {
    const getClubScheduleNow1 = "https://api-web.nhle.com/v1/club-schedule-season/TOR/now";
    const getClubScheduleNow2 = "https://api-web.nhle.com/v1/club-schedule-season/BOS/now";
    const getClubScheduleNow3 = "https://api-web.nhle.com/v1/club-schedule-season/EDM/now";

    const clubScheduleNowData1 = await getRequest(getClubScheduleNow1);
    const clubScheduleNowData2 = await getRequest(getClubScheduleNow2);
    const clubScheduleNowData3 = await getRequest(getClubScheduleNow3);

    const genClubScheduleNow = new Gen("IClubScheduleNowOutput", "./output/interfaces/club/schedule", {
      backupOldFile: false,
      fileName: "ClubScheduleNow",
      jsonVariations: [clubScheduleNowData1, clubScheduleNowData2, clubScheduleNowData3],
    });
    genClubScheduleNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club schedule for now:", error);
  }

  // 21. /v1/club-schedule-season/{team}/{season}
  try {
    const getClubSchedule1 = "https://api-web.nhle.com/v1/club-schedule-season/TOR/20232024";
    const getClubSchedule2 = "https://api-web.nhle.com/v1/club-schedule-season/BOS/20222023";
    const getClubSchedule3 = "https://api-web.nhle.com/v1/club-schedule-season/EDM/20212022";

    const clubScheduleData1 = await getRequest(getClubSchedule1);
    const clubScheduleData2 = await getRequest(getClubSchedule2);
    const clubScheduleData3 = await getRequest(getClubSchedule3);

    const genClubSchedule = new Gen("IClubScheduleOutput", "./output/interfaces/club/schedule", {
      backupOldFile: false,
      fileName: "ClubSchedule",
      jsonVariations: [clubScheduleData1, clubScheduleData2, clubScheduleData3],
    });
    genClubSchedule.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club schedule by season:", error);
  }

  // 22. /v1/club-schedule/{team}/month/now
  try {
    const getClubScheduleMonthNow1 = "https://api-web.nhle.com/v1/club-schedule/TOR/month/now";
    const getClubScheduleMonthNow2 = "https://api-web.nhle.com/v1/club-schedule/BOS/month/now";
    const getClubScheduleMonthNow3 = "https://api-web.nhle.com/v1/club-schedule/EDM/month/now";

    const clubScheduleMonthNowData1 = await getRequest(getClubScheduleMonthNow1);
    const clubScheduleMonthNowData2 = await getRequest(getClubScheduleMonthNow2);
    const clubScheduleMonthNowData3 = await getRequest(getClubScheduleMonthNow3);

    const genClubScheduleMonthNow = new Gen("IClubScheduleMonthNowOutput", "./output/interfaces/club/schedule", {
      backupOldFile: false,
      fileName: "ClubScheduleMonthNow",
      jsonVariations: [clubScheduleMonthNowData1, clubScheduleMonthNowData2, clubScheduleMonthNowData3],
    });
    genClubScheduleMonthNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club monthly schedule:", error);
  }

  // 23. /v1/club-schedule/{team}/month/{month}
  try {
    const getClubScheduleMonth1 = "https://api-web.nhle.com/v1/club-schedule/TOR/month/2023-11";
    const getClubScheduleMonth2 = "https://api-web.nhle.com/v1/club-schedule/BOS/month/2023-12";
    const getClubScheduleMonth3 = "https://api-web.nhle.com/v1/club-schedule/EDM/month/2024-01";

    const clubScheduleMonthData1 = await getRequest(getClubScheduleMonth1);
    const clubScheduleMonthData2 = await getRequest(getClubScheduleMonth2);
    const clubScheduleMonthData3 = await getRequest(getClubScheduleMonth3);

    const genClubScheduleMonth = new Gen("IClubScheduleMonthOutput", "./output/interfaces/club/schedule", {
      backupOldFile: false,
      fileName: "ClubScheduleMonth",
      jsonVariations: [clubScheduleMonthData1, clubScheduleMonthData2, clubScheduleMonthData3],
    });
    genClubScheduleMonth.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club schedule by month:", error);
  }

  // 24. /v1/club-schedule/{team}/week/{date}
  try {
    const getClubScheduleWeek1 = "https://api-web.nhle.com/v1/club-schedule/TOR/week/2023-11-10";
    const getClubScheduleWeek2 = "https://api-web.nhle.com/v1/club-schedule/BOS/week/2023-11-15";
    const getClubScheduleWeek3 = "https://api-web.nhle.com/v1/club-schedule/EDM/week/2023-12-01";

    const clubScheduleWeekData1 = await getRequest(getClubScheduleWeek1);
    const clubScheduleWeekData2 = await getRequest(getClubScheduleWeek2);
    const clubScheduleWeekData3 = await getRequest(getClubScheduleWeek3);

    const genClubScheduleWeek = new Gen("IClubScheduleWeekOutput", "./output/interfaces/club/schedule", {
      backupOldFile: false,
      fileName: "ClubScheduleWeek",
      jsonVariations: [clubScheduleWeekData1, clubScheduleWeekData2, clubScheduleWeekData3],
    });
    genClubScheduleWeek.generateInterfaces();
  } catch (error) {
    console.error("Error fetching club weekly schedule:", error);
  }

  // 25. /v1/club-schedule/{team}/week/now
  try {
    const getClubScheduleWeekNow1 = "https://api-web.nhle.com/v1/club-schedule/TOR/week/now";
    const getClubScheduleWeekNow2 = "https://api-web.nhle.com/v1/club-schedule/BOS/week/now";
    const getClubScheduleWeekNow3 = "https://api-web.nhle.com/v1/club-schedule/EDM/week/now";

    const clubScheduleWeekNowData1 = await getRequest(getClubScheduleWeekNow1);
    const clubScheduleWeekNowData2 = await getRequest(getClubScheduleWeekNow2);
    const clubScheduleWeekNowData3 = await getRequest(getClubScheduleWeekNow3);

    const genClubScheduleWeekNow = new Gen("IClubScheduleWeekNowOutput", "./output/interfaces/club/schedule", {
      backupOldFile: false,
      fileName: "ClubScheduleWeekNow",
      jsonVariations: [clubScheduleWeekNowData1, clubScheduleWeekNowData2, clubScheduleWeekNowData3],
    });
    genClubScheduleWeekNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching weekly schedule for now:", error);
  }

  // 26. /v1/schedule/now
  try {
    const getScheduleNow = "https://api-web.nhle.com/v1/schedule/now";

    const scheduleNowData = await getRequest(getScheduleNow);

    const genScheduleNow = new Gen("IScheduleNowOutput", "./output/interfaces/schedule", {
      backupOldFile: false,
      fileName: "ScheduleNow",
      jsonVariations: [scheduleNowData],
    });
    genScheduleNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current schedule:", error);
  }

  // 27. /v1/schedule/{date}
  try {
    const getScheduleByDate1 = "https://api-web.nhle.com/v1/schedule/2023-11-10";
    const getScheduleByDate2 = "https://api-web.nhle.com/v1/schedule/2023-10-20";
    const getScheduleByDate3 = "https://api-web.nhle.com/v1/schedule/2024-01-01";

    const scheduleByDateData1 = await getRequest(getScheduleByDate1);
    const scheduleByDateData2 = await getRequest(getScheduleByDate2);
    const scheduleByDateData3 = await getRequest(getScheduleByDate3);

    const genScheduleByDate = new Gen("IScheduleByDateOutput", "./output/interfaces/schedule", {
      backupOldFile: false,
      fileName: "ScheduleByDate",
      jsonVariations: [scheduleByDateData1, scheduleByDateData2, scheduleByDateData3],
    });
    genScheduleByDate.generateInterfaces();
  } catch (error) {
    console.error("Error fetching schedule by date:", error);
  }

  // 28. /v1/schedule-calendar/now
  try {
    const getScheduleCalendarNow = "https://api-web.nhle.com/v1/schedule-calendar/now";

    const scheduleCalendarNowData = await getRequest(getScheduleCalendarNow);

    const genScheduleCalendarNow = new Gen("IScheduleCalendarNowOutput", "./output/interfaces/schedule/calendar", {
      backupOldFile: false,
      fileName: "ScheduleCalendarNow",
      jsonVariations: [scheduleCalendarNowData],
    });
    genScheduleCalendarNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current schedule calendar:", error);
  }

  // 29. /v1/schedule-calendar/{date}
  try {
    const getScheduleCalendar1 = "https://api-web.nhle.com/v1/schedule-calendar/2023-11-10";
    const getScheduleCalendar2 = "https://api-web.nhle.com/v1/schedule-calendar/2023-10-20";
    const getScheduleCalendar3 = "https://api-web.nhle.com/v1/schedule-calendar/2024-01-01";

    const scheduleCalendarData1 = await getRequest(getScheduleCalendar1);
    const scheduleCalendarData2 = await getRequest(getScheduleCalendar2);
    const scheduleCalendarData3 = await getRequest(getScheduleCalendar3);

    const genScheduleCalendar = new Gen("IScheduleCalendarOutput", "./output/interfaces/schedule/calendar", {
      backupOldFile: false,
      fileName: "ScheduleCalendar",
      jsonVariations: [scheduleCalendarData1, scheduleCalendarData2, scheduleCalendarData3],
    });
    genScheduleCalendar.generateInterfaces();
  } catch (error) {
    console.error("Error fetching schedule calendar by date:", error);
  }

  // 30. /v1/score/now
  try {
    const getDailyScoresNow = "https://api-web.nhle.com/v1/score/now";

    const dailyScoresNowData = await getRequest(getDailyScoresNow);

    const genDailyScoresNow = new Gen("IDailyScoresNowOutput", "./output/interfaces/score", {
      backupOldFile: false,
      fileName: "DailyScoresNow",
      jsonVariations: [dailyScoresNowData],
    });
    genDailyScoresNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current daily scores:", error);
  }

  // 31. /v1/score/{date}
  try {
    const getDailyScoresByDate1 = "https://api-web.nhle.com/v1/score/2023-11-10";
    const getDailyScoresByDate2 = "https://api-web.nhle.com/v1/score/2023-10-20";
    const getDailyScoresByDate3 = "https://api-web.nhle.com/v1/score/2024-01-01";

    const dailyScoresByDateData1 = await getRequest(getDailyScoresByDate1);
    const dailyScoresByDateData2 = await getRequest(getDailyScoresByDate2);
    const dailyScoresByDateData3 = await getRequest(getDailyScoresByDate3);

    const genDailyScoresByDate = new Gen("IDailyScoresByDateOutput", "./output/interfaces/score", {
      backupOldFile: false,
      fileName: "DailyScoresByDate",
      jsonVariations: [dailyScoresByDateData1, dailyScoresByDateData2, dailyScoresByDateData3],
    });
    genDailyScoresByDate.generateInterfaces();
  } catch (error) {
    console.error("Error fetching daily scores by date:", error);
  }

  // 32. /v1/scoreboard/now
  try {
    const getScoreboardNow = "https://api-web.nhle.com/v1/scoreboard/now";

    const scoreboardNowData = await getRequest(getScoreboardNow);

    const genScoreboardNow = new Gen("IScoreboardNowOutput", "./output/interfaces/scoreboard", {
      backupOldFile: false,
      fileName: "ScoreboardNow",
      jsonVariations: [scoreboardNowData],
    });
    genScoreboardNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current scoreboard:", error);
  }

  // 33. /v1/where-to-watch
  try {
    const getWhereToWatch = "https://api-web.nhle.com/v1/where-to-watch";

    const whereToWatchData = await getRequest(getWhereToWatch);

    const genWhereToWatch = new Gen("IWhereToWatchOutput", "./output/interfaces/where-to-watch", {
      backupOldFile: false,
      fileName: "WhereToWatch",
      jsonVariations: [whereToWatchData],
    });
    genWhereToWatch.generateInterfaces();
  } catch (error) {
    console.error("Error fetching where-to-watch information:", error);
  }

  // 34. /v1/gamecenter/{game-id}/play-by-play
  try {
    const getGamePlayByPlay1 = "https://api-web.nhle.com/v1/gamecenter/2023020204/play-by-play";
    const getGamePlayByPlay2 = "https://api-web.nhle.com/v1/gamecenter/2023020205/play-by-play";
    const getGamePlayByPlay3 = "https://api-web.nhle.com/v1/gamecenter/2023020206/play-by-play";

    const gamePlayByPlayData1 = await getRequest(getGamePlayByPlay1);
    const gamePlayByPlayData2 = await getRequest(getGamePlayByPlay2);
    const gamePlayByPlayData3 = await getRequest(getGamePlayByPlay3);

    const genGamePlayByPlay = new Gen("IGamePlayByPlayOutput", "./output/interfaces/gamecenter/play-by-play", {
      backupOldFile: false,
      fileName: "GamePlayByPlay",
      jsonVariations: [gamePlayByPlayData1, gamePlayByPlayData2, gamePlayByPlayData3],
    });
    genGamePlayByPlay.generateInterfaces();
  } catch (error) {
    console.error("Error fetching game play-by-play data:", error);
  }

  // 35. /v1/gamecenter/{game-id}/landing
  try {
    const getGameLanding1 = "https://api-web.nhle.com/v1/gamecenter/2023020204/landing";
    const getGameLanding2 = "https://api-web.nhle.com/v1/gamecenter/2023020205/landing";
    const getGameLanding3 = "https://api-web.nhle.com/v1/gamecenter/2023020206/landing";
    const getGameLanding4 = "https://api-web.nhle.com/v1/gamecenter/2023021305/landing";

    const gameLandingData1 = await getRequest(getGameLanding1);
    const gameLandingData2 = await getRequest(getGameLanding2);
    const gameLandingData3 = await getRequest(getGameLanding3);
    const gameLandingData4 = await getRequest(getGameLanding4);

    const genGameLanding = new Gen("IGameLandingOutput", "./output/interfaces/gamecenter/landing", {
      backupOldFile: false,
      fileName: "GameLanding",
      jsonVariations: [gameLandingData1, gameLandingData2, gameLandingData3, gameLandingData4],
    });
    genGameLanding.generateInterfaces();
  } catch (error) {
    console.error("Error fetching game landing data:", error);
  }

  // 36. /v1/gamecenter/{game-id}/boxscore
  try {
    const getGameBoxscore1 = "https://api-web.nhle.com/v1/gamecenter/2023020204/boxscore";
    const getGameBoxscore2 = "https://api-web.nhle.com/v1/gamecenter/2023020205/boxscore";
    const getGameBoxscore3 = "https://api-web.nhle.com/v1/gamecenter/2023020206/boxscore";

    const gameBoxscoreData1 = await getRequest(getGameBoxscore1);
    const gameBoxscoreData2 = await getRequest(getGameBoxscore2);
    const gameBoxscoreData3 = await getRequest(getGameBoxscore3);

    const genGameBoxscore = new Gen("IGameBoxscoreOutput", "./output/interfaces/gamecenter/boxscore", {
      backupOldFile: false,
      fileName: "GameBoxscore",
      jsonVariations: [gameBoxscoreData1, gameBoxscoreData2, gameBoxscoreData3],
    });
    genGameBoxscore.generateInterfaces();
  } catch (error) {
    console.error("Error fetching game boxscore data:", error);
  }

  // 37. /v1/wsc/game-story/{game-id}
  try {
    const getGameStory1 = "https://api-web.nhle.com/v1/wsc/game-story/2023020204";
    const getGameStory2 = "https://api-web.nhle.com/v1/wsc/game-story/2023020205";
    const getGameStory3 = "https://api-web.nhle.com/v1/wsc/game-story/2023020206";
    const getGameStory4 = "https://api-web.nhle.com/v1/wsc/game-story/2023021305";

    const gameStoryData1 = await getRequest(getGameStory1);
    const gameStoryData2 = await getRequest(getGameStory2);
    const gameStoryData3 = await getRequest(getGameStory3);
    const gameStoryData4 = await getRequest(getGameStory4);

    const genGameStory = new Gen("IGameStoryOutput", "./output/interfaces/wsc/game-story", {
      backupOldFile: false,
      fileName: "GameStory",
      jsonVariations: [gameStoryData1, gameStoryData2, gameStoryData3, gameStoryData4],
    });
    genGameStory.generateInterfaces();
  } catch (error) {
    console.error("Error fetching game story:", error);
  }

  // 38. /v1/network/tv-schedule/{date}
  try {
    const getTvSchedule1 = "https://api-web.nhle.com/v1/network/tv-schedule/2023-11-10";
    const getTvSchedule2 = "https://api-web.nhle.com/v1/network/tv-schedule/2023-10-15";
    const getTvSchedule3 = "https://api-web.nhle.com/v1/network/tv-schedule/2024-01-01";

    const tvScheduleData1 = await getRequest(getTvSchedule1);
    const tvScheduleData2 = await getRequest(getTvSchedule2);
    const tvScheduleData3 = await getRequest(getTvSchedule3);

    const genTvSchedule = new Gen("ITvScheduleOutput", "./output/interfaces/network/tv-schedule", {
      backupOldFile: false,
      fileName: "TvSchedule",
      jsonVariations: [tvScheduleData1, tvScheduleData2, tvScheduleData3],
    });
    genTvSchedule.generateInterfaces();
  } catch (error) {
    console.error("Error fetching TV schedule:", error);
  }

  // 39. /v1/network/tv-schedule/now
  try {
    const getTvScheduleNow = "https://api-web.nhle.com/v1/network/tv-schedule/now";

    const tvScheduleNowData = await getRequest(getTvScheduleNow);

    const genTvScheduleNow = new Gen("ITvScheduleNowOutput", "./output/interfaces/network/tv-schedule", {
      backupOldFile: false,
      fileName: "TvScheduleNow",
      jsonVariations: [tvScheduleNowData],
    });
    genTvScheduleNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current TV schedule:", error);
  }

  // 40. /v1/partner-game/{country-code}/now
  try {
    const getPartnerGameOdds1 = "https://api-web.nhle.com/v1/partner-game/US/now";
    const getPartnerGameOdds2 = "https://api-web.nhle.com/v1/partner-game/CA/now";
    const getPartnerGameOdds3 = "https://api-web.nhle.com/v1/partner-game/MX/now";

    const partnerGameOddsData1 = await getRequest(getPartnerGameOdds1);
    const partnerGameOddsData2 = await getRequest(getPartnerGameOdds2);
    const partnerGameOddsData3 = await getRequest(getPartnerGameOdds3);

    const genPartnerGameOdds = new Gen("IPartnerGameOddsOutput", "./output/interfaces/partner-game", {
      backupOldFile: false,
      fileName: "PartnerGameOdds",
      jsonVariations: [partnerGameOddsData1, partnerGameOddsData2, partnerGameOddsData3],
    });
    genPartnerGameOdds.generateInterfaces();
  } catch (error) {
    console.error("Error fetching partner game odds:", error);
  }

  // 41. /v1/playoff-series/carousel/{season}
  try {
    const getPlayoffSeriesCarousel1 = "https://api-web.nhle.com/v1/playoff-series/carousel/20232024";
    const getPlayoffSeriesCarousel2 = "https://api-web.nhle.com/v1/playoff-series/carousel/20222023";
    const getPlayoffSeriesCarousel3 = "https://api-web.nhle.com/v1/playoff-series/carousel/20212022";

    const playoffSeriesCarouselData1 = await getRequest(getPlayoffSeriesCarousel1);
    const playoffSeriesCarouselData2 = await getRequest(getPlayoffSeriesCarousel2);
    const playoffSeriesCarouselData3 = await getRequest(getPlayoffSeriesCarousel3);

    const genPlayoffSeriesCarousel = new Gen("IPlayoffSeriesCarouselOutput", "./output/interfaces/playoff-series/carousel", {
      backupOldFile: false,
      fileName: "PlayoffSeriesCarousel",
      jsonVariations: [playoffSeriesCarouselData1, playoffSeriesCarouselData2, playoffSeriesCarouselData3],
    });
    genPlayoffSeriesCarousel.generateInterfaces();
  } catch (error) {
    console.error("Error fetching playoff series carousel:", error);
  }

  // 42. /v1/schedule/playoff-series/{season}/{series_letter}
  try {
    const getPlayoffSeriesSchedule1 = "https://api-web.nhle.com/v1/schedule/playoff-series/20232024/a";
    const getPlayoffSeriesSchedule2 = "https://api-web.nhle.com/v1/schedule/playoff-series/20232024/b";
    const getPlayoffSeriesSchedule3 = "https://api-web.nhle.com/v1/schedule/playoff-series/20232024/c";

    const playoffSeriesScheduleData1 = await getRequest(getPlayoffSeriesSchedule1);
    const playoffSeriesScheduleData2 = await getRequest(getPlayoffSeriesSchedule2);
    const playoffSeriesScheduleData3 = await getRequest(getPlayoffSeriesSchedule3);

    const genPlayoffSeriesSchedule = new Gen("IPlayoffSeriesScheduleOutput", "./output/interfaces/schedule/playoff-series", {
      backupOldFile: false,
      fileName: "PlayoffSeriesSchedule",
      jsonVariations: [playoffSeriesScheduleData1, playoffSeriesScheduleData2, playoffSeriesScheduleData3],
    });
    genPlayoffSeriesSchedule.generateInterfaces();
  } catch (error) {
    console.error("Error fetching playoff series schedule:", error);
  }

  // 43. /v1/playoff-bracket/{year}
  try {
    const getPlayoffBracket1 = "https://api-web.nhle.com/v1/playoff-bracket/2022";
    const getPlayoffBracket2 = "https://api-web.nhle.com/v1/playoff-bracket/2023";
    const getPlayoffBracket3 = "https://api-web.nhle.com/v1/playoff-bracket/2024";

    const playoffBracketData1 = await getRequest(getPlayoffBracket1);
    const playoffBracketData2 = await getRequest(getPlayoffBracket2);
    const playoffBracketData3 = await getRequest(getPlayoffBracket3);

    const genPlayoffBracket = new Gen("IPlayoffBracketOutput", "./output/interfaces/playoff-bracket", {
      backupOldFile: false,
      fileName: "PlayoffBracket",
      jsonVariations: [playoffBracketData1, playoffBracketData2, playoffBracketData3],
    });
    genPlayoffBracket.generateInterfaces();
  } catch (error) {
    console.error("Error fetching playoff bracket:", error);
  }

  // 44. /v1/season
  try {
    const getSeasons = "https://api-web.nhle.com/v1/season";

    const seasonsData = await getRequest(getSeasons);

    const genSeasons = new Gen("ISeasonsOutput", "./output/interfaces/season", {
      backupOldFile: false,
      fileName: "Seasons",
      jsonVariations: [seasonsData],
    });
    genSeasons.generateInterfaces();
  } catch (error) {
    console.error("Error fetching seasons:", error);
  }

  // 45. /v1/draft/rankings/now
  try {
    const getDraftRankingsNow = "https://api-web.nhle.com/v1/draft/rankings/now";

    const draftRankingsNowData = await getRequest(getDraftRankingsNow);

    const genDraftRankingsNow = new Gen("IDraftRankingsNowOutput", "./output/interfaces/draft/rankings", {
      backupOldFile: false,
      fileName: "DraftRankingsNow",
      jsonVariations: [draftRankingsNowData],
    });
    genDraftRankingsNow.generateInterfaces();
  } catch (error) {
    console.error("Error fetching current draft rankings:", error);
  }

  // 46. /v1/draft/rankings/{season}/{prospect_category}
  try {
    const getDraftRankings1 = "https://api-web.nhle.com/v1/draft/rankings/2023/1";
    const getDraftRankings2 = "https://api-web.nhle.com/v1/draft/rankings/2022/2";
    const getDraftRankings3 = "https://api-web.nhle.com/v1/draft/rankings/2021/3";

    const draftRankingsData1 = await getRequest(getDraftRankings1);
    const draftRankingsData2 = await getRequest(getDraftRankings2);
    const draftRankingsData3 = await getRequest(getDraftRankings3);

    const genDraftRankings = new Gen("IDraftRankingsOutput", "./output/interfaces/draft/rankings", {
      backupOldFile: false,
      fileName: "DraftRankings",
      jsonVariations: [draftRankingsData1, draftRankingsData2, draftRankingsData3],
    });
    genDraftRankings.generateInterfaces();
  } catch (error) {
    console.error("Error fetching draft rankings:", error);
  }

  // 47. /v1/meta
  try {
    const getMetaInfo1 = "https://api-web.nhle.com/v1/meta?players=8478402&teams=EDM,TOR";
    const getMetaInfo2 = "https://api-web.nhle.com/v1/meta?players=8478403&teams=MTL,BOS";
    const getMetaInfo3 = "https://api-web.nhle.com/v1/meta?players=8478404&teams=NYR,CHI";

    const metaInfoData1 = await getRequest(getMetaInfo1);
    const metaInfoData2 = await getRequest(getMetaInfo2);
    const metaInfoData3 = await getRequest(getMetaInfo3);

    const genMetaInfo = new Gen("IMetaInfoOutput", "./output/interfaces/meta", {
      backupOldFile: false,
      fileName: "MetaInfo",
      jsonVariations: [metaInfoData1, metaInfoData2, metaInfoData3],
    });
    genMetaInfo.generateInterfaces();
  } catch (error) {
    console.error("Error fetching meta info:", error);
  }

  // 48. /v1/meta/game/{game-id}
  try {
    const getMetaGameInfo1 = "https://api-web.nhle.com/v1/meta/game/2023020204";
    const getMetaGameInfo2 = "https://api-web.nhle.com/v1/meta/game/2023020205";
    const getMetaGameInfo3 = "https://api-web.nhle.com/v1/meta/game/2023020206";

    const metaGameInfoData1 = await getRequest(getMetaGameInfo1);
    const metaGameInfoData2 = await getRequest(getMetaGameInfo2);
    const metaGameInfoData3 = await getRequest(getMetaGameInfo3);

    const genMetaGameInfo = new Gen("IMetaGameInfoOutput", "./output/interfaces/meta/game", {
      backupOldFile: false,
      fileName: "MetaGameInfo",
      jsonVariations: [metaGameInfoData1, metaGameInfoData2, metaGameInfoData3],
    });
    genMetaGameInfo.generateInterfaces();
  } catch (error) {
    console.error("Error fetching meta game info:", error);
  }

  // 49. /v1/location
  try {
    const getLocation = "https://api-web.nhle.com/v1/location";

    const locationData = await getRequest(getLocation);

    const genLocation = new Gen("ILocationOutput", "./output/interfaces/location", {
      backupOldFile: false,
      fileName: "Location",
      jsonVariations: [locationData],
    });
    genLocation.generateInterfaces();
  } catch (error) {
    console.error("Error fetching location info:", error);
  }

  // 50. /model/v1/openapi.json
  // Returns a 404 error
  // try {
  //   const getOpenApiSpec = "https://api-web.nhle.com/model/v1/openapi.json";

  //   const openApiSpecData = await getRequest(getOpenApiSpec);

  //   const genOpenApiSpec = new Gen("IOpenApiSpecOutput", "./output/interfaces/model/openapi", {
  //     backupOldFile: false,
  //     fileName: "OpenApiSpec",
  //     jsonVariations: [openApiSpecData],
  //   });
  //   genOpenApiSpec.generateInterfaces();
  // } catch (error) {
  //   console.error("Error fetching OpenAPI specification:", error);
  // }

  // 51. /{lang}/players
  try {
    const getPlayers1 = "https://api.nhle.com/stats/rest/en/players";
    const getPlayers2 = "https://api.nhle.com/stats/rest/fr/players";
    const getPlayers3 = "https://api.nhle.com/stats/rest/es/players";

    const playersData1 = await getRequest(getPlayers1);
    const playersData2 = await getRequest(getPlayers2);
    const playersData3 = await getRequest(getPlayers3);

    const genPlayers = new Gen("IPlayersOutput", "./output/interfaces/stats/players", {
      backupOldFile: false,
      fileName: "Players",
      jsonVariations: [playersData1, playersData2, playersData3],
    });
    genPlayers.generateInterfaces();
  } catch (error) {
    console.error("Error fetching players:", error);
  }

  // 52. /{lang}/leaders/skaters/{attribute}
  try {
    const getSkaterLeaders1 = "https://api.nhle.com/stats/rest/en/leaders/skaters/points";
    const getSkaterLeaders2 = "https://api.nhle.com/stats/rest/fr/leaders/skaters/goals";
    const getSkaterLeaders3 = "https://api.nhle.com/stats/rest/es/leaders/skaters/assists";

    const skaterLeadersData1 = await getRequest(getSkaterLeaders1);
    const skaterLeadersData2 = await getRequest(getSkaterLeaders2);
    const skaterLeadersData3 = await getRequest(getSkaterLeaders3);

    const genSkaterLeaders = new Gen("ISkaterLeadersOutput", "./output/interfaces/stats/leaders/skaters", {
      backupOldFile: false,
      fileName: "SkaterLeaders",
      jsonVariations: [skaterLeadersData1, skaterLeadersData2, skaterLeadersData3],
    });
    genSkaterLeaders.generateInterfaces();
  } catch (error) {
    console.error("Error fetching skater leaders:", error);
  }

  // 53. /{lang}/milestones/skaters
  try {
    const getSkaterMilestones1 = "https://api.nhle.com/stats/rest/en/milestones/skaters";
    const getSkaterMilestones2 = "https://api.nhle.com/stats/rest/fr/milestones/skaters";
    const getSkaterMilestones3 = "https://api.nhle.com/stats/rest/es/milestones/skaters";

    const skaterMilestonesData1 = await getRequest(getSkaterMilestones1);
    const skaterMilestonesData2 = await getRequest(getSkaterMilestones2);
    const skaterMilestonesData3 = await getRequest(getSkaterMilestones3);

    const genSkaterMilestones = new Gen("ISkaterMilestonesOutput", "./output/interfaces/stats/milestones/skaters", {
      backupOldFile: false,
      fileName: "SkaterMilestones",
      jsonVariations: [skaterMilestonesData1, skaterMilestonesData2, skaterMilestonesData3],
    });
    genSkaterMilestones.generateInterfaces();
  } catch (error) {
    console.error("Error fetching skater milestones:", error);
  }

  // 54. /{lang}/skater
  // Returns a 404 error
  // try {
  //   const getSkaterInfo1 = "https://api.nhle.com/stats/rest/en/skater";
  //   const getSkaterInfo2 = "https://api.nhle.com/stats/rest/fr/skater";
  //   const getSkaterInfo3 = "https://api.nhle.com/stats/rest/es/skater";

  //   const skaterInfoData1 = await getRequest(getSkaterInfo1);
  //   const skaterInfoData2 = await getRequest(getSkaterInfo2);
  //   const skaterInfoData3 = await getRequest(getSkaterInfo3);

  //   const genSkaterInfo = new Gen("ISkaterInfoOutput", "./output/interfaces/stats/skater", {
  //     backupOldFile: false,
  //     fileName: "SkaterInfo",
  //     jsonVariations: [skaterInfoData1, skaterInfoData2, skaterInfoData3],
  //   });
  //   genSkaterInfo.generateInterfaces();
  // } catch (error) {
  //   console.error("Error fetching skater info:", error);
  // }

  // 55. /{lang}/skater/{report}
  try {
    const getSkaterStats1 = "https://api.nhle.com/stats/rest/en/skater/summary?limit=72&start=17&cayenneExp=seasonId=20232024";
    const getSkaterStats2 = "https://api.nhle.com/stats/rest/fr/skater/summary?limit=100&start=10&cayenneExp=seasonId=20222023";
    const getSkaterStats3 = "https://api.nhle.com/stats/rest/es/skater/summary?limit=50&start=5&cayenneExp=seasonId=20212022";

    const skaterStatsData1 = await getRequest(getSkaterStats1);
    const skaterStatsData2 = await getRequest(getSkaterStats2);
    const skaterStatsData3 = await getRequest(getSkaterStats3);

    const genSkaterStats = new Gen("ISkaterStatsOutput", "./output/interfaces/stats/skater", {
      backupOldFile: false,
      fileName: "SkaterStats",
      jsonVariations: [skaterStatsData1, skaterStatsData2, skaterStatsData3],
    });
    genSkaterStats.generateInterfaces();
  } catch (error) {
    console.error("Error fetching skater stats:", error);
  }

  // 56. /{lang}/leaders/goalies/{attribute}
  try {
    const getGoalieLeaders = "https://api.nhle.com/stats/rest/fr/leaders/goalies/gaa";

    const goalieLeadersData = await getRequest(getGoalieLeaders);

    const genGoalieLeaders = new Gen("IGoalieLeadersOutput", "./output/interfaces/stats/leaders/goalies", {
      backupOldFile: false,
      fileName: "GoalieLeaders",
      jsonVariations: [goalieLeadersData],
    });
    genGoalieLeaders.generateInterfaces();
  } catch (error) {
    console.error("Error fetching goalie leaders:", error);
  }

  // 57. /{lang}/goalie/{report}
  try {
    const getGoalieStats1 = "https://api.nhle.com/stats/rest/en/goalie/summary?limit=72&start=15&cayenneExp=seasonId=20232024";
    const getGoalieStats2 = "https://api.nhle.com/stats/rest/fr/goalie/summary?limit=50&start=10&cayenneExp=seasonId=20222023";
    const getGoalieStats3 = "https://api.nhle.com/stats/rest/es/goalie/summary?limit=100&start=5&cayenneExp=seasonId=20212022";

    const goalieStatsData1 = await getRequest(getGoalieStats1);
    const goalieStatsData2 = await getRequest(getGoalieStats2);
    const goalieStatsData3 = await getRequest(getGoalieStats3);

    const genGoalieStats = new Gen("IGoalieStatsOutput", "./output/interfaces/stats/goalie", {
      backupOldFile: false,
      fileName: "GoalieStats",
      jsonVariations: [goalieStatsData1, goalieStatsData2, goalieStatsData3],
    });
    genGoalieStats.generateInterfaces();
  } catch (error) {
    console.error("Error fetching goalie stats:", error);
  }

  // 58. /{lang}/milestones/goalies
  try {
    const getGoalieMilestones1 = "https://api.nhle.com/stats/rest/en/milestones/goalies";
    const getGoalieMilestones2 = "https://api.nhle.com/stats/rest/fr/milestones/goalies";
    const getGoalieMilestones3 = "https://api.nhle.com/stats/rest/es/milestones/goalies";

    const goalieMilestonesData1 = await getRequest(getGoalieMilestones1);
    const goalieMilestonesData2 = await getRequest(getGoalieMilestones2);
    const goalieMilestonesData3 = await getRequest(getGoalieMilestones3);

    const genGoalieMilestones = new Gen("IGoalieMilestonesOutput", "./output/interfaces/stats/milestones/goalies", {
      backupOldFile: false,
      fileName: "GoalieMilestones",
      jsonVariations: [goalieMilestonesData1, goalieMilestonesData2, goalieMilestonesData3],
    });
    genGoalieMilestones.generateInterfaces();
  } catch (error) {
    console.error("Error fetching goalie milestones:", error);
  }

  // 59. /{lang}/draft
  try {
    const getDraftInfo1 = "https://api.nhle.com/stats/rest/en/draft";
    const getDraftInfo2 = "https://api.nhle.com/stats/rest/fr/draft";
    const getDraftInfo3 = "https://api.nhle.com/stats/rest/es/draft";

    const draftInfoData1 = await getRequest(getDraftInfo1);
    const draftInfoData2 = await getRequest(getDraftInfo2);
    const draftInfoData3 = await getRequest(getDraftInfo3);

    const genDraftInfo = new Gen("IDraftInfoOutput", "./output/interfaces/draft", {
      backupOldFile: false,
      fileName: "DraftInfo",
      jsonVariations: [draftInfoData1, draftInfoData2, draftInfoData3],
    });
    genDraftInfo.generateInterfaces();
  } catch (error) {
    console.error("Error fetching draft info:", error);
  }

  // 60. /{lang}/team
  try {
    const getTeams1 = "https://api.nhle.com/stats/rest/en/team";
    const getTeams2 = "https://api.nhle.com/stats/rest/fr/team";
    const getTeams3 = "https://api.nhle.com/stats/rest/es/team";

    const teamsData1 = await getRequest(getTeams1);
    const teamsData2 = await getRequest(getTeams2);
    const teamsData3 = await getRequest(getTeams3);

    const genTeams = new Gen("ITeamsOutput", "./output/interfaces/stats/teams", {
      backupOldFile: false,
      fileName: "Teams",
      jsonVariations: [teamsData1, teamsData2, teamsData3],
    });
    genTeams.generateInterfaces();
  } catch (error) {
    console.error("Error fetching teams:", error);
  }

  // 61. /{lang}/team/{report}
  try {
    const getTeamStats1 = "https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=20232024%20and%20gameTypeId=2";
    const getTeamStats2 = "https://api.nhle.com/stats/rest/fr/team/summary?cayenneExp=seasonId=20222023%20and%20gameTypeId=2";
    const getTeamStats3 = "https://api.nhle.com/stats/rest/es/team/summary?cayenneExp=seasonId=20212022%20and%20gameTypeId=2";

    const teamStatsData1 = await getRequest(getTeamStats1);
    const teamStatsData2 = await getRequest(getTeamStats2);
    const teamStatsData3 = await getRequest(getTeamStats3);

    const genTeamStats = new Gen("ITeamStatsOutput", "./output/interfaces/stats/team", {
      backupOldFile: false,
      fileName: "TeamStats",
      jsonVariations: [teamStatsData1, teamStatsData2, teamStatsData3],
    });
    genTeamStats.generateInterfaces();
  } catch (error) {
    console.error("Error fetching team stats:", error);
  }

  // 62. /{lang}/franchise
  try {
    const getFranchises1 = "https://api.nhle.com/stats/rest/en/franchise";
    const getFranchises2 = "https://api.nhle.com/stats/rest/fr/franchise";
    const getFranchises3 = "https://api.nhle.com/stats/rest/es/franchise";

    const franchisesData1 = await getRequest(getFranchises1);
    const franchisesData2 = await getRequest(getFranchises2);
    const franchisesData3 = await getRequest(getFranchises3);

    const genFranchises = new Gen("IFranchisesOutput", "./output/interfaces/stats/franchise", {
      backupOldFile: false,
      fileName: "Franchises",
      jsonVariations: [franchisesData1, franchisesData2, franchisesData3],
    });
    genFranchises.generateInterfaces();
  } catch (error) {
    console.error("Error fetching franchise info:", error);
  }

  // 63. /{lang}/componentSeason
  try {
    const getComponentSeason1 = "https://api.nhle.com/stats/rest/en/componentSeason";
    const getComponentSeason2 = "https://api.nhle.com/stats/rest/fr/componentSeason";
    const getComponentSeason3 = "https://api.nhle.com/stats/rest/es/componentSeason";

    const componentSeasonData1 = await getRequest(getComponentSeason1);
    const componentSeasonData2 = await getRequest(getComponentSeason2);
    const componentSeasonData3 = await getRequest(getComponentSeason3);

    const genComponentSeason = new Gen("IComponentSeasonOutput", "./output/interfaces/stats/component-season", {
      backupOldFile: false,
      fileName: "ComponentSeason",
      jsonVariations: [componentSeasonData1, componentSeasonData2, componentSeasonData3],
    });
    genComponentSeason.generateInterfaces();
  } catch (error) {
    console.error("Error fetching component season info:", error);
  }

  // 64. /{lang}/season
  try {
    const getSeason1 = "https://api.nhle.com/stats/rest/en/season";
    const getSeason2 = "https://api.nhle.com/stats/rest/fr/season";
    const getSeason3 = "https://api.nhle.com/stats/rest/es/season";

    const seasonData1 = await getRequest(getSeason1);
    const seasonData2 = await getRequest(getSeason2);
    const seasonData3 = await getRequest(getSeason3);

    const genSeason = new Gen("ISeasonOutput", "./output/interfaces/stats/season", {
      backupOldFile: false,
      fileName: "Season",
      jsonVariations: [seasonData1, seasonData2, seasonData3],
    });
    genSeason.generateInterfaces();
  } catch (error) {
    console.error("Error fetching season info:", error);
  }

  // 65. /{lang}/game
  try {
    const getGame1 = "https://api.nhle.com/stats/rest/en/game";
    const getGame2 = "https://api.nhle.com/stats/rest/fr/game";
    const getGame3 = "https://api.nhle.com/stats/rest/es/game";

    const gameData1 = await getRequest(getGame1);
    const gameData2 = await getRequest(getGame2);
    const gameData3 = await getRequest(getGame3);

    const genGame = new Gen("IGameOutput", "./output/interfaces/stats/game", {
      backupOldFile: false,
      fileName: "Game",
      jsonVariations: [gameData1, gameData2, gameData3],
    });
    genGame.generateInterfaces();
  } catch (error) {
    console.error("Error fetching game info:", error);
  }

  // 66. /{lang}/game/meta
  // Returns a 404 error
  // try {
  //   const getGameMeta1 = "https://api.nhle.com/stats/rest/en/game/meta";
  //   const getGameMeta2 = "https://api.nhle.com/stats/rest/fr/game/meta";
  //   const getGameMeta3 = "https://api.nhle.com/stats/rest/es/game/meta";

  //   const gameMetaData1 = await getRequest(getGameMeta1);
  //   const gameMetaData2 = await getRequest(getGameMeta2);
  //   const gameMetaData3 = await getRequest(getGameMeta3);

  //   const genGameMeta = new Gen("IGameMetaOutput", "./output/interfaces/stats/game/meta", {
  //     backupOldFile: false,
  //     fileName: "GameMeta",
  //     jsonVariations: [gameMetaData1, gameMetaData2, gameMetaData3],
  //   });
  //   genGameMeta.generateInterfaces();
  // } catch (error) {
  //   console.error("Error fetching game meta data:", error);
  // }

  // 67. /{lang}/config
  try {
    const getConfig1 = "https://api.nhle.com/stats/rest/en/config";
    const getConfig2 = "https://api.nhle.com/stats/rest/fr/config";
    const getConfig3 = "https://api.nhle.com/stats/rest/es/config";

    const configData1 = await getRequest(getConfig1);
    const configData2 = await getRequest(getConfig2);
    const configData3 = await getRequest(getConfig3);

    const genConfig = new Gen("IConfigOutput", "./output/interfaces/stats/config", {
      backupOldFile: false,
      fileName: "Config",
      jsonVariations: [configData1, configData2, configData3],
    });
    genConfig.generateInterfaces();
  } catch (error) {
    console.error("Error fetching config data:", error);
  }

  // 69. /{lang}/country
  try {
    const getCountry1 = "https://api.nhle.com/stats/rest/en/country";
    const getCountry2 = "https://api.nhle.com/stats/rest/fr/country";
    const getCountry3 = "https://api.nhle.com/stats/rest/es/country";

    const countryData1 = await getRequest(getCountry1);
    const countryData2 = await getRequest(getCountry2);
    const countryData3 = await getRequest(getCountry3);

    const genCountry = new Gen("ICountryOutput", "./output/interfaces/stats/country", {
      backupOldFile: false,
      fileName: "Country",
      jsonVariations: [countryData1, countryData2, countryData3],
    });
    genCountry.generateInterfaces();
  } catch (error) {
    console.error("Error fetching country data:", error);
  }

  // 70. /{lang}/shiftcharts?cayenneExp=gameId={game_id}
  try {
    const getShiftCharts1 = "https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=2021020001";
    const getShiftCharts2 = "https://api.nhle.com/stats/rest/fr/shiftcharts?cayenneExp=gameId=2021020002";
    const getShiftCharts3 = "https://api.nhle.com/stats/rest/es/shiftcharts?cayenneExp=gameId=2021020003";

    const shiftChartsData1 = await getRequest(getShiftCharts1);
    const shiftChartsData2 = await getRequest(getShiftCharts2);
    const shiftChartsData3 = await getRequest(getShiftCharts3);

    const genShiftCharts = new Gen("IShiftChartsOutput", "./output/interfaces/stats/shiftcharts", {
      backupOldFile: false,
      fileName: "ShiftCharts",
      jsonVariations: [shiftChartsData1, shiftChartsData2, shiftChartsData3],
    });
    genShiftCharts.generateInterfaces();
  } catch (error) {
    console.error("Error fetching shift charts:", error);
  }

  // 71. /{lang}/glossary
  try {
    const getGlossary1 = "https://api.nhle.com/stats/rest/en/glossary";
    const getGlossary2 = "https://api.nhle.com/stats/rest/fr/glossary";
    const getGlossary3 = "https://api.nhle.com/stats/rest/es/glossary";

    const glossaryData1 = await getRequest(getGlossary1);
    const glossaryData2 = await getRequest(getGlossary2);
    const glossaryData3 = await getRequest(getGlossary3);

    const genGlossary = new Gen("IGlossaryOutput", "./output/interfaces/stats/glossary", {
      backupOldFile: false,
      fileName: "Glossary",
      jsonVariations: [glossaryData1, glossaryData2, glossaryData3],
    });
    genGlossary.generateInterfaces();
  } catch (error) {
    console.error("Error fetching glossary data:", error);
  }

  // 72. /{lang}/content/module
  // Returns a 404 error
  // try {
  //   const getContentModule1 = "https://api.nhle.com/stats/rest/en/content/module";
  //   const getContentModule2 = "https://api.nhle.com/stats/rest/fr/content/module";
  //   const getContentModule3 = "https://api.nhle.com/stats/rest/es/content/module";

  //   const contentModuleData1 = await getRequest(getContentModule1);
  //   const contentModuleData2 = await getRequest(getContentModule2);
  //   const contentModuleData3 = await getRequest(getContentModule3);

  //   const genContentModule = new Gen("IContentModuleOutput", "./output/interfaces/stats/content/module", {
  //     backupOldFile: false,
  //     fileName: "ContentModule",
  //     jsonVariations: [contentModuleData1, contentModuleData2, contentModuleData3],
  //   });
  //   genContentModule.generateInterfaces();
  // } catch (error) {
  //   console.error("Error fetching content module data:", error);
  // }

  // 73. /content/module/meta
  // Returns a 404 error
  // try {
  //   const getContentModuleMeta = "https://api.nhle.com/stats/rest/content/module/meta";

  //   const contentModuleMetaData = await getRequest(getContentModuleMeta);

  //   const genContentModuleMeta = new Gen("IContentModuleMetaOutput", "./output/interfaces/stats/content/module", {
  //     backupOldFile: false,
  //     fileName: "ContentModuleMeta",
  //     jsonVariations: [contentModuleMetaData],
  //   });
  //   genContentModuleMeta.generateInterfaces();
  // } catch (error) {
  //   console.error("Error fetching content module meta data:", error);
  // }
}

main();
