"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ReactStars from "react-stars";
import { useLanguage } from "../_utils/LanguageContext";

// assisted by Copilot and Claude 3 Opus
const FeedbackDashboard = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all"); // 'today', 'thisMonth', 'all'

  useEffect(() => {
    const fetchFeedbackData = async () => {
      const db = getFirestore();
      const colRef = collection(db, "feedback");
      const snapshot = await getDocs(colRef);
      let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      if (timeFilter === "today") {
        data = data.filter(
          (d) => new Date(d.feedback_time).getTime() >= todayStart.getTime()
        );
      } else if (timeFilter === "thisMonth") {
        data = data.filter(
          (d) => new Date(d.feedback_time).getTime() >= monthStart.getTime()
        );
      }

      setFeedbackData(data);
    };

    fetchFeedbackData();
  }, [timeFilter]);

  // Calculate overall score
  const calculateOverallScore = () => {
    const totalScore = feedbackData.reduce(
      (sum, feedback) => sum + feedback.overallRating,
      0
    );
    const averageScore = totalScore / feedbackData.length;
    return Math.round((averageScore / 5) * 100);
  };

  const calculateCategoryPerformance = () => {
    const categories = ["Vibe", "Service", "Product", "Price", "Cleanliness"];

    const performanceData = categories.map((category) => {
      const totalScore = feedbackData.reduce(
        (sum, feedback) => sum + feedback[`${category.toLowerCase()}Rating`],
        0
      );
      const averageScore = totalScore / feedbackData.length;
      return { category, score: averageScore };
    });
    return performanceData;
  };

  const calculateServingTimeDistribution = () => {
    const servingTimeRanges = ["0-5", "5-10", "10-15", "15-30", "30+"];
    const distributionData = servingTimeRanges.map((range) => {
      const count = feedbackData.filter(
        (feedback) => feedback.servingTime === range
      ).length;
      return { range, count };
    });
    return distributionData;
  };

  const getTopFavoriteItems = (count) => {
    const favoriteItemsCount = {};
    feedbackData.forEach((feedback) => {
      feedback.favoriteItems.forEach((item) => {
        favoriteItemsCount[item] = (favoriteItemsCount[item] || 0) + 1;
      });
    });

    const sortedFavoriteItems = Object.entries(favoriteItemsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([item, count]) => ({ item, count }));

    return sortedFavoriteItems;
  };

  const getRecentFeedbacks = (count, type) => {
    const sortedFeedbacks = [...feedbackData].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    const filteredFeedbacks = sortedFeedbacks.filter((feedback) =>
      type === "positive"
        ? feedback.overallRating >= 3
        : feedback.overallRating < 3
    );
    return filteredFeedbacks.slice(0, count);
  };

  const calculateBrowserDistribution = () => {
    const browserCounts = {};
    feedbackData.forEach((feedback) => {
      const browserInfo = feedback.browserInfo;
      const browserName = getBrowserName(browserInfo);
      browserCounts[browserName] = (browserCounts[browserName] || 0) + 1;
    });

    const totalCount = feedbackData.length;
    const browserDistributionData = Object.entries(browserCounts).map(
      ([browser, count]) => ({
        browser,
        count,
        percentage: ((count / totalCount) * 100).toFixed(2),
      })
    );

    return browserDistributionData;
  };

  const getBrowserName = (browserInfo) => {
    if (browserInfo.includes("Edg")) {
      return "Edge";
    } else if (browserInfo.includes("Chrome")) {
      return "Chrome";
    } else if (
      browserInfo.includes("Safari") &&
      !browserInfo.includes("Chrome")
    ) {
      return "Safari";
    } else if (browserInfo.includes("Firefox")) {
      return "Firefox";
    } else {
      return "Other";
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

  const [sortByEmoji, setSortByEmoji] = useState(false);

  const handleEmojiSortToggle = () => {
    setSortByEmoji(!sortByEmoji);
  };

  const sortedFeedbackData = [...feedbackData].sort((a, b) => {
    if (sortByEmoji) {
      if (a.mood && b.mood) {
        // Only compare if both moods are defined
        return a.mood.localeCompare(b.mood);
      } else if (a.mood) {
        // If a has mood but b doesn't, a comes first
        return -1;
      } else {
        // If b has mood but a doesn't, b comes first
        return 1;
      }
    } else {
      return b.feedback_time - a.feedback_time;
    }
  });

  const sortedEmojis = sortedFeedbackData
    .filter((feedback) => feedback.mood !== undefined) // Filter for valid emojis
    .map((feedback) => feedback.mood);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const { t } = useLanguage();

  return (
    <div>
      <div className="items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {t("feedbackDashboard")}
          <button
            className={`text-sm mr-2 p-2 ml-6 ${
              timeFilter === "all" ? "bg-blue-500 text-white" : "bg-gray-600"
            }`}
            onClick={() => setTimeFilter("all")}
          >
            {t("allTime")}
          </button>
          <button
            className={`text-sm mr-2 p-2 ${
              timeFilter === "today" ? "bg-blue-500 text-white" : "bg-gray-600"
            }`}
            onClick={() => setTimeFilter("today")}
          >
            {t("today")}
          </button>
          <button
            className={`text-sm p-2 ${
              timeFilter === "thisMonth"
                ? "bg-blue-500 text-white"
                : "bg-gray-600"
            }`}
            onClick={() => setTimeFilter("thisMonth")}
          >
            {t("thisMonth")}
          </button>
        </h1>

        <div></div>
      </div>
      <div className="containerdash mx-auto mt-8 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="bg-gray-700 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">{t("overallScore")}</h2>
            <div style={{ width: 120, height: 120, margin: "auto" }}>
              <CircularProgressbar
                value={calculateOverallScore()}
                text={`${calculateOverallScore()}%`}
                styles={buildStyles({
                  textColor: "white",
                  pathColor: "turquoise",
                  trailColor: "gray",
                })}
              />
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-gray-700 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">
              {t("categoryPerformance")}
            </h2>
            <div className="space-y-2">
              {calculateCategoryPerformance().map((item) => (
                <div key={item.category} className="flex items-center">
                  <span className="text-white font-semibold w-24">
                    {t(item.category)}:
                  </span>
                  <ReactStars
                    count={5}
                    value={Math.round(item.score * 2) / 2}
                    size={20}
                    color1={"#FFFFFF"}
                    color2={"#FCD34D"}
                    edit={false}
                    half={true}
                  />
                  <span className="ml-2 text-white text-sm">
                    ({item.score.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Serving Time Distribution */}
          <div className="bg-gray-700 p-4 rounded shadow col-span-2 md:col-span-1 text-xs">
            <h2 className="text-lg font-bold mb-2 ">
              {t("servingTimeDistribution")}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={calculateServingTimeDistribution()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: "white" }} />
                <YAxis tick={{ fill: "white" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Favorite Items */}
          <div className="bg-gray-700 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">{t("topFavoriteItems")}</h2>
            <ol className="list-decimal list-inside">
              {getTopFavoriteItems(3).map((item) => (
                <li key={item.item} className="text-sm">
                  {item.item} ({item.count})
                </li>
              ))}
            </ol>
          </div>

          {/* Recent Positive Feedbacks */}
          <div className="bg-gray-700 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">
              {t("recentPositiveFeedback")}
            </h2>
            <ul className="list-disc list-inside">
              {getRecentFeedbacks(3, "positive").map((feedback, index) => (
                <li key={index} className="text-sm mb-1">
                  👍{feedback.customerFeedback}
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Negative Feedbacks */}
          <div className="bg-gray-700 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">
              {t("recentNegativeFeedback")}
            </h2>
            <ul className="list-disc list-inside">
              {getRecentFeedbacks(3, "negative").map((feedback, index) => (
                <li key={index} className="text-sm mb-1">
                  👎{feedback.customerFeedback}
                </li>
              ))}
            </ul>
          </div>

          {/* Browser Distribution */}
          <div className="bg-gray-700 p-4 rounded shadow col-span-2 md:col-span-1">
            <h2 className="text-lg font-bold mb-2">
              {t("browserDistribution")}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={calculateBrowserDistribution()}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {calculateBrowserDistribution().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  formatter={(value, entry, index) => entry.payload.browser}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Emoji Display */}
          <div className="bg-gray-700 p-4 rounded shadow col-span-2 md:col-span-1">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">{t("collectedEmojis")}</h2>
              <div className="flex items-center">
                {" "}
                {/* Container for text and button */}
                <span className="mr-2">{t("sortBy")}:</span> {/* Text label */}
                <button
                  onClick={handleEmojiSortToggle}
                  className="font-bold bg-blue-500 text-white hover:bg-blue-400"
                >
                  {sortByEmoji ? t("time") : t("emoji")}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-left">
              {sortedEmojis.map((emoji, index) => (
                <span key={index} className="text-3xl inline-block">
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
