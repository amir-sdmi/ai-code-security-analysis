const { query } = require("../db/sqlite");
const {
  launch,
  getPageTextContents,
  getMetaTags,
} = require("../lib/puppeteer");

const hackernews = require("./hackernews");
const googlealerts = require("./googlealerts");
const { getKeywordsAI, interestingIndexArticle } = require("../lib/openai");

module.exports = async () => {
  /*
  This function 
  1. retrieves the returned articles from hackernews() and googlealerts()
  2. creates an SQL query to update the rank on the Hacker News articles if article exists in DB -> adjustments?
  3. creates an SQL query to add the new articles to DB if the article doesn't exist in DB
   */

  let cluster = null;

  try {
    cluster = await launch({ maxConcurrency: 10 });

    const articles = [];

    try {
      // add hackernews articles to articles array
      const hackernewsArticles = await hackernews();
      if (Array.isArray(hackernewsArticles))
        articles.push(...hackernewsArticles);
    } catch (error) {
      console.log(error);
    }
    

    try {
      // add google alerts articles to array
      const googlealertsArticles = await googlealerts();
      if (Array.isArray(googlealertsArticles))
        console.log(googlealertsArticles)
        articles.push(...googlealertsArticles);
    } catch (error) {
      console.log(error);
    }

    const wheres = articles.map(({ platform_id, platform_name }) => {
      // save the unique id of the article and the corresponding platform in array
      return `(platform_id = '${platform_id}' AND platform_name = '${platform_name}')`;
    });

    // get all old articles to match with new articles and update
    const savedArticles = await query(
      `
        SELECT
          *
        FROM
          articles
        WHERE
          ${wheres.join(" OR ")}
      `
    );

    for (const article of articles) {
      console.log(article)
      console.log("here")
      const savedArticle = savedArticles.find(
        ({ platform_name, platform_id }) =>
          platform_id === article.platform_id &&
          platform_name === article.platform_name
      );

      if (
        // if article data has not changed, skip to the next article
        savedArticle &&
        article.platform_points === savedArticle.platform_points &&
        article.platform_title === savedArticle.platform_title &&
        article.website_link === savedArticle.website_link &&
        article.platform_rank >= savedArticle.platform_rank
        //proposed change: article.platform_rank === savedArticle.platform_rank 
        // @Vincent: why do we not do anything if the rank decreases?? we only update if rank increases. Any ideas?
      ) {
        continue;
      } else if (savedArticle) {
        const rank = Math.min(
          savedArticle.platform_rank,
          article.platform_rank
        );
        // the logic behind updating the rank doesn't make sense to me...we only change the rank if it increases
        // but then we choose the minimum again so we effectively haven't updated anything with the current true value, right?
        await query(
          `
            UPDATE
              articles
            SET
              platform_rank = ?,
              platform_points = ?,
              platform_title = ?,
              website_link = ?
            WHERE
              platform_name = ?
              AND platform_id = ?
          `,
          rank,
          article.platform_points,
          article.platform_title,
          article.website_link,
          article.platform_name,
          article.platform_id
        );
      } else if (!savedArticle) {
        // if the article doesn't exists, we check if it's not a hacker news article
        // to get the metadata
        let title = null;
        let description = null;

        const isHackerNews =
          article.platform_name === "hackernews" &&
          article.website_link?.startsWith("https://news.ycombinator.com/");

        // if not a hackernews article, get link, title and description
        if (!isHackerNews) {
          try {
            const meta = await cluster.execute(
              article.website_link,
              getMetaTags
            );
            if (meta.title) title = meta.title;
            if (meta.description) description = meta.description;
          } catch (error) {
            console.log(error);
          }
        }

        // get content with puppeteer
        const content = await getPageTextContents({
          link: article.website_link,
          cluster,
        });

        // get keywords with ChatGPT
        const keywords = await getKeywordsAI({
          link: article.website_link,
          content: content?.slice?.(0, 3000) || "",
        });

        // get the index with ChatGPT
        const interesting = await interestingIndexArticle({
          link: article.website_link,
          content: content?.slice?.(0, 3000) || "",
        });

        console.log(article)
        // create SQL query to insert into DB
        await query(
          `
            INSERT INTO articles
              (
                "platform_name",
                "platform_id",
                "platform_rank",
                "platform_title",
                "website_link",
                "platform_points",
                "website_title",
                "website_description",
                "keywords",
                "interesting_index",
                "interesting_reason",
                "characters"
              )
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          article.platform_name,
          article.platform_id,
          article.platform_rank,
          article.platform_title,
          article.website_link,
          article.platform_points,
          title,
          description,
          keywords.join(","),
          interesting.index,
          interesting.reason,
          content
        );
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    if (!cluster) return;
    await cluster.idle();
    await cluster.close();
  }
};
