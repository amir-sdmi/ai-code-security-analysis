import React from "react";
import { CgWorkAlt } from "react-icons/cg";
import { FaReact } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";
import corpcommentImg from "@/public/corpcomment.png";
import inboxInvasion from "@/public/blogs/inboxInvasion.png";
import frappeDocker from "@/public/blogs/frappeDocker.png";
import storybookIntegration from "@/public/blogs/storybookIntegration.png";
import nxMonoRepo from "@/public/blogs/nxMonoRepo.png";

import cloudFlareEamil from "@/public/project/cloudFlareEamil.png";
import javaScriptIde from "@/public/project/javaScriptIde.png";

import rmtdevImg from "@/public/rmtdev.png";
import wordanalyticsImg from "@/public/wordanalytics.png";

export const links = [
  {
    name: "Home",
    hash: "#home",
  },
  {
    name: "About",
    hash: "#about",
  },
  {
    name: "Schedule Metting",
    hash: "#cal",
  },
  {
    name: "Blogs",
    hash: "#blogs",
  },
  {
    name: "Projects",
    hash: "#projects",
  },
  {
    name: "Skills",
    hash: "#skills",
  },
  {
    name: "Experience",
    hash: "#experience",
  },
  {
    name: "Contact",
    hash: "#contact",
  },
] as const;

export const experiencesData = [
  {
    title: "Software Developer Intern",
    location: "Remote",
    description:
      "Developing and Maintaining the code - https://github.com/CryptsyTV/Streamingapp",
    icon: React.createElement(LuGraduationCap),
    date: "Jan 2020 - Feb 2020",
  },
  {
    title: "Software Developer Intern",
    location: "Remote",
    description:
      "Worked on job search portal using PHP , JavaScript and Linux and learned SCRUM",
    icon: React.createElement(CgWorkAlt),
    date: "Aug 2020 - Sep 2020",
  },
  {
    title: "Full-Stack Developer",
    location: "Wisflux , Jaipur",
    description:
      "Executed a project for BOSCH aimed at optimizing the assembly line process for staff. Utilized React JS for the frontend, enhancing user interface and interactivity. Implemented NestJS for the backend, ensuring a robust and efficient system for seamless data processing. Leveraged Electron to convert the application into a desktop solution, improving accessibility and usability for assembly line personnel.",
    icon: React.createElement(FaReact),
    date: "May 2022 - Dec 2022",
  },
  {
    title: "Frontend Lead & DevOps Develope",
    location: "ProqSmart , Bangalore",
    description:
      "Led a nuclear startup as the sole frontend developer in a 3–4-member team. - Successfully transitioned the platform API from Django to Frappe API. - Spearheaded the standardization of coding practices and CSS, emphasizing the use of types and interfaces for improved code quality. - Implemented a robust automation pipeline through GitHub Actions, streamlining development processes. - Pioneered the integration of ngRx, reducing frontend load time from 5 seconds to 500 milliseconds, significantly enhancing overall platform performance by 10x. - Create an AI pipeline using ChatGPT to categorize unstructured Construction item details into custom categories, utilizing Python and the OpenAI API. - Design a new app architecture using the NX workspace setup to house multiple applications, sharing common components across them. These components should be organized in multiple libraries, with Storybook integration for component documentation and Tailwind CSS for styling, all managed within a single repository.",
    icon: React.createElement(FaReact),
    date: "Feb 2023 - Present",
  },
  {
    title: "Software Developer",
    location: "Geekomony  , Bangalore",
    description:
      "As a team lead, I manage client interactions, breaking down their needs into clear requirements.Creating pixel-perfect UIs in React, integrating email functionalities, and designing and developing robustback-end systems.",
    icon: React.createElement(FaReact),
    date: "Feb 2023 - Present",
  },
] as const;

export const projectsData = [
  {
    title: "Cloud Flare Worker AI",
    description:
      " I have developed an AI that helps you enhance your email content, making it more spam-resistant. Let our AI do the heavy lifting, so you can reap the rewards and strike gold!",
    tags: ["CoudFlare Worder AI ", "JavaScript", "HTML", "Tailwind"],
    imageUrl: cloudFlareEamil,
  },
  {
    title: "JavaScript Ide",
    description:
      "I have create a Javascipt Ide just like Leet Code Id whic have ther own test cases to pass for a simple function   ",
    tags: ["React", "TypeScript", "Python", "Tailwind", "Postgres"],
    imageUrl: javaScriptIde,
  },
] as const;

export const blogssData = [
  {
    title: "Inbox Invasion: The Ultimate Spam Content Calculator",
    description:
      " We have developed an AI that helps you enhance your email content, making it more spam-resistant. Let our AI do the heavy lifting, so you can reap the rewards and strike gold!",
    tags: [],
    imageUrl: inboxInvasion,
  },
  {
    title: "Frappe Docker Development Setup Guide for Custom Apps",
    description:
      "This guide outlines the steps to set up a development environment using Frappe Docker, which will enable you to develop and debug Frappe and Frappe-based applications efficiently.",
    tags: [],
    imageUrl: frappeDocker,
  },
  {
    title:
      "Integrating Storybook with PrimeNG and TailwindCSS in an Nx Workspace",
    description:
      "This guide walks through integrating these tools into an existing Nx workspace, ensuring a seamless setup for building a robust and visually appealing UI",
    tags: [],
    imageUrl: storybookIntegration,
  },
  {
    title:
      "Building a Future-Proof Angular Application with NX Workspaces: A Modular Approach",
    description:
      "This blog delves into a case study of a project where the decision was made to start afresh, rather than attempting to migrate an outdated Angular application.",
    tags: [],
    imageUrl: nxMonoRepo,
  },
] as const;
export const skillsData = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Git",
  "Tailwind",
  "Sequelize",
  "Redux",
  "Express",
  "PostgreSQL",
  "Python",
  "Framer Motion",
  "Angular Js",
  "NgRx",
  "RxJs",
  "Docker",
  "Kubernetes (Beginner)",
  "Git Action",
  "OpenAI API",
  "Prompting",
  "CloudFlare Workers",
  "RAG",
] as const;
