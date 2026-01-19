import React from "react";
import useMobile from "./mobile";
import Image from "next/image";
import Link from "next/link";

function Portfolio() {
  const isMobile = useMobile();
  return (
    <div id="portfolio" className="portfolio-section sm:mx-12  relative">
      <h1
        data-aos="fade-up"
        data-aos-duration="500"
        className="text-white text-center mb-12 font-bebas text-5xl drop-shadow-xl"
      >
        Portfolio
      </h1>
      <div className=" mx-auto flex flex-col">
        {/* <div
          className="sm:mx-6 mb-12 flex flex-row-reverse items-center justify-center flex-wrap-reverse"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="text-white  z-10 w-96">
            <h2 className="text-indigo-500 ml-6 text-xl mt-3">
              {`Personal Fitness Made Easy`}
            </h2>
            <h3 className="text-3xl mb-3 ml-6 font-bold">
              {"AI Fitness Trainer "}
            </h3>
            <div className="bg-main opacity-95 lg:shadow-xl  p-6 text-md mb-3">
              <p className="mb-3">
                {
                  "A Personal trainer powered by ChatGPT's powerfull AI. With the AI Trainer you can"
                }
              </p>
              <ul className="portfolio">
                <li>{`Track workouts and personal records`}</li>
                <li> {`chat with the AI trainer 24/7`}</li>
                <li> {`get detailed workout advice`}</li>
                <li>
                  {
                    " Get a custom workout plan curated just for you based on your lifestyle. "
                  }
                </li>
              </ul>

              <p className="mt-2 text-lg">
                {`Next Js`} <span className="text-indigo-500">{`+`}</span>{" "}
                {`MongoDB `}
                <span className="text-indigo-500">+</span>
                {` ChatGPT API`}
              </p>
            </div>
            <Link href="https://www.aifitnesstrainer.io" target="_blank">
              <button className="bg-indigo-500 py-2 px-4 rounded shadow hover:bg-indigo-700 hover:scale-105 duration-300  w-2/3 flex items-center justify-center mx-auto">
                View Site
              </button>
            </Link>
          </div>
          <div
            className="relative  
          shadow-lg border-2 border-indigo-500 port-img"
          >
            <Image
              src={`/ai-app.svg`}
              alt="AI Fitness Trainer"
              height={384}
              width={384}
            />
          </div>
        </div> */}

        {/* <div
          className="sm:mx-6 mb-12 flex flex-row-reverse items-center justify-center flex-wrap-reverse"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="text-white  z-10 w-96">
            <h2 className="text-indigo-500 ml-6 text-xl mt-3">
              {`Improve Your Game`}
            </h2>
            <h3 className="text-3xl mb-3 ml-6 font-bold">
              {"LoL Skill Check "}
            </h3>
            <div className="bg-main opacity-95 lg:shadow-xl  p-6 text-md mb-3">
              <p className="mb-3">
                {`A powerful tool for avid League of Legends
                players, providing personalized game analysis and performance
                insights. 
                `}
              </p>
              <ul className="portfolio mb-3">
                <li>{`View a comprehensive game summary`} </li>
                <li>
                  {`Get individual stats tailored just for the player searched`}
                </li>
                <li>
                  {`Highlights your strengths and areas for improvement,
                  allowing you to fine-tune your gameplay strategy.`}
                </li>
              </ul>

              <p className="text-lg">
                {`Svelte`} <span className="text-indigo-500">+</span>
                {` Express `}
                <span className="text-indigo-500">+</span> {`Riot Games API`}
              </p>
            </div>
            <Link href="https://www.lolskillcheck.com" target="_blank">
              <button className="bg-indigo-500 py-2 px-4 rounded shadow hover:bg-indigo-700 hover:scale-105 duration-300  w-2/3 flex items-center justify-center mx-auto">
                View Site
              </button>
            </Link>
          </div>
          <div
            className="relative  
          shadow-lg border-2 border-indigo-500 port-img"
          >
            <Image
              src={`/league-app2.svg`}
              alt="LoL Skill Scheck"
              height={384}
              width={384}
            />
          </div>
        </div> */}

        <div
          className="sm:mx-6 mb-12 flex flex-row-reverse items-center justify-center flex-wrap-reverse"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="text-white  z-10 w-96">
            <h2 className="text-indigo-500 ml-6 text-xl mt-3">
              {`Skip The Nonsense`}
            </h2>
            <h3 className="text-3xl mb-3 ml-6 font-bold">{"Camo To Code "}</h3>
            <div className="bg-main opacity-95 lg:shadow-xl p-6 text-md mb-3">
              <p className="mb-3">
                {`As a United States Marine Corps veteran I wanted to provide the
                best free learning resources available for veterans and
                civilians interested in pursuing a career in tech.`}
              </p>
              <p className="">{`The platform
                offers comprehensive training and mentorship programs, equipping
                users with the necessary skills and knowledge to excel in
                various tech-related fields. `}</p>
            </div>
            <Link href="https://www.camotocode.com" target="_blank">
              <button className="bg-indigo-500 py-2 px-4 rounded shadow hover:bg-indigo-700 hover:scale-105 duration-300  w-2/3 flex items-center justify-center mx-auto">
                View Site
              </button>
            </Link>
          </div>
          <div
            className="relative  
          shadow-lg border-2 border-indigo-500 port-img"
          >
            <Image
              src={`/c2c-guy.svg`}
              alt="Camo To Code"
              height={384}
              width={384}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
