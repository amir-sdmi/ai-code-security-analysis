"use client";
import React, { useState, useEffect } from "react";
import QuickreaderApi from "../api";
import SummaryBox from "../components/SummaryBox";
import { Card, CardTitle } from "reactstrap";
import LoadingCard from "../components/LoadingCard";
import ChoicesForm from "../components/ChoicesForm";
import Footer from "../home/Footer";
import RecentEntries from "../components/RecentEntries";
import ErrorAlert from "../components/ErrorAlert";

const Home = () => {
  const [articles, setArticles] = useState(null);
  const [section, setSection] = useState("home");
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(null);
  const [error, setError] = useState(null);

  // get articles from API on mount.
  useEffect(() => {
    searchArticles(section);
    setSection(section);
  }, [section]);

  function updateSection(section) {
    setError(null); // Clear any existing errors
    setSection(section);
  }

  // search articles from API.
  async function searchArticles(section) {
    try {
      let articles = await QuickreaderApi.getArticles(section);
      setArticles(articles);
      setError(null); // Clear any existing errors on success
    } catch (err) {
      setError(err);
      setArticles(null);
    }
  }

  // summarize articles with ChatGPT.
  async function summarize(data) {
    try {
      let summary = await QuickreaderApi.summarize(data);
      setSummary(summary);
      setError(null); // Clear any existing errors on success
    } catch (err) {
      setError(err);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }

  // helper to reset page.
  const resetPage = () => {
    setSummary(null);
    setSection("home");
    setError(null); // Clear any existing errors
  };

  return (
    <div className="container text-center">
      <Card
        body
        className="HomeCard text-center"
        style={{
          width: "50vw",
          minWidth: "20rem",
          backgroundColor: "mintcream",
        }}
      >
        <CardTitle>
          <div className="title">
            <h3 className="title-text">paper-route</h3>
            <i>AI-Assisted Summaries for your Favorite Newspapers</i>
          </div>
        </CardTitle>

        <ErrorAlert error={error} />

        {!articles || isLoading ? (
          <LoadingCard />
        ) : (
          <>
            {summary ? (
              <SummaryBox
                summary={summary}
                section={section}
                resetPage={resetPage}
              />
            ) : (
              <ChoicesForm
                updateSection={updateSection}
                summarize={summarize}
                setIsLoading={setIsLoading}
                articles={articles}
              />
            )}
          </>
        )}

        <RecentEntries />
        <Footer />
      </Card>
    </div>
  );
};

export default Home;
