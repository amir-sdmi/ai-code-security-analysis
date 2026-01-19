import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Applicant } from './entities/applicant.entity';
import { Repository } from 'typeorm';
import { OdooService } from 'src/odoo/odoo.service';
import { Resume } from './entities/resume.entity';
import { HttpService } from '@nestjs/axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { join } from 'path';
import { JobVacanyService } from 'src/job-vacany/job-vacany.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import * as bcrypt from 'bcrypt';
import { ResumeScreeningQuestionsAnswers } from './entities/resume-screening-questions-answers.entity';
import { ChatgptService } from 'src/chatgpt/chatgpt.service';

const chatPrompt = `{question}. For this question this is the following answer provided: {answer}. 
I want the answer provided as a JSON data following this structure: { isAcceptable: boolean; explanation: string; }. Evaluate the answer if it fits wth the question then accept it, and also this is a reference key answer to use as guideline: 
{key_answer}`;

const feedbackPrompt = `Provided below is the job description for a job screening system. 
And also provided is a parsed resume data. Please compare both, and give me conclusion of the matching for this candidate. 
Write the result as json with only the conclusion that will be shown to the candidate, so I need to show him what is good, and what needs to be improved better. Make the json follow this structure: { conclusion: string; needsToImprove: string }
This is the job description: {job_description}
This is the parsed resume: {parsed_resume}`;

@Injectable()
export class ApplicantService implements OnModuleInit {
  constructor(
    @InjectRepository(Applicant)
    private applicantRepository: Repository<Applicant>,
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(ResumeScreeningQuestionsAnswers)
    private resumeScreeningQuestions: Repository<ResumeScreeningQuestionsAnswers>,
    private readonly httpService: HttpService,
    private readonly odooService: OdooService,
    private readonly jobVacancyService: JobVacanyService,
    private readonly chatGptService: ChatgptService,
  ) {}

  //runs with startup of the application and creates admin details in database (seeding database)
  async onModuleInit() {
    await this.register({
      firstName: 'test',
      lastName: 'man',
      userName: 'test',
      password: 'test',
      phoneNumber: '123456',
      email: 'test@test.com',
    });
  }

  async create(
    createApplicantDto: CreateApplicantDto,
    resumeFile: Express.Multer.File,
  ) {
    const {
      firstName,
      lastName,
      education,
      phoneNumber,
      email,
      language,
      yearsOfExperience,
      jobVacancyId,
      screeningQuestions,
      userName,
    } = createApplicantDto;

    const screeningQuestionsParsed = JSON.parse(screeningQuestions) as {
      question: string;
      answer: string;
      key_answer: string;
    }[];

    const jobVacancy = await this.jobVacancyService.findOne(
      parseInt(jobVacancyId),
    );

    const job_keywords = {};
    jobVacancy.skills.forEach((x) => {
      job_keywords[x.title] = x.weight;
    });

    const filePath = join(process.cwd(), 'uploads', resumeFile.filename);
    const formData = new FormData();
    const file = createReadStream(filePath);
    formData.append('file', file);

    // Call parse endpoint
    const { data: resumeData } = await this.httpService.axiosRef.post(
      'http://127.0.0.1:8000/parse-resume',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    // call the similarity endpoint
    const { data: similarityData } = await this.httpService.axiosRef.post(
      'http://127.0.0.1:8000/rank-resume',
      {
        job_keywords,
        resume_keywords: resumeData?.extracted_keywords,
      },
    );

    // evalute screeing questions with ChatGPT
    const validation_result: {
      isAcceptable: boolean;
      explanation: string;
    }[] = await Promise.all(
      screeningQuestionsParsed.map(({ question, answer, key_answer }) => {
        const prompt = chatPrompt
          .replace('{question}', question)
          .replace('{answer}', answer)
          .replace('{key_answer}', key_answer);
        return this.chatGptService.promptChat(prompt);
      }),
    );

    const resume_rating = Math.round((similarityData.percantage * 5) / 100);

    const screening_rating = Math.round(
      (validation_result.filter((q) => q.isAcceptable).length /
        validation_result.length) *
        5,
    );
    const formattedFeedbackPrompt = feedbackPrompt
      .replace('{job_description}', jobVacancy.jobDescription)
      .replace('{parsed_resume}', resumeData?.resume_data);

    const feedback_result: { conclusion: string; needsToImprove: string } =
      await this.chatGptService.promptChat(formattedFeedbackPrompt);

    resumeData.resume_data = this.escapeString(resumeData?.resumeData ?? '');

    const total_rating = Math.round((resume_rating + screening_rating) / 2);

    // Store applicant in Odoo
    const odooResult = await this.odooService.createApplicant({
      firstName,
      lastName,
      rating: total_rating.toString(),
      resumeData: resumeData?.resume_data,
      job_id: jobVacancy.odooJobId.toString(),
    });

    let newResume = this.resumeRepository.create({
      filename: resumeFile.filename,
      education,
      language,
      yearsOfExperience,
      rating: total_rating.toString(),
      resume_rating: resume_rating.toString(),
      screening_questions_rating: screening_rating.toString(),
      extracted_keywords: '',
      resume_data: resumeData?.resume_data,
      resume_feedback_conclusion: feedback_result?.conclusion,
      resume_feedback_needsToImprove: feedback_result?.needsToImprove,
      phoneNumber,
      email,
      jobVacancy,
      odooApplicantId: odooResult as number,
    });

    newResume = await this.resumeRepository.save(newResume);

    // Store the screening questions answers
    await Promise.all(
      screeningQuestionsParsed.map(async (skill, index) => {
        const newSkill = this.resumeScreeningQuestions.create({
          resume: newResume,
          answer_feedback: validation_result?.[index]?.explanation ?? '',
          ...skill,
        });
        await this.resumeScreeningQuestions.save(newSkill);
      }),
    );

    let applicant: Applicant;
    if (email) {
      applicant = await this.findOneByUsername(email);
      applicant.resumes.push(newResume);
    } else {
      applicant = this.applicantRepository.create({
        firstName,
        lastName,
        phoneNumber,
        email,
        resumes: [newResume],
      });
    }
    await this.applicantRepository.save(applicant);

    return { resumeId: newResume.id };
  }

  async register(registerApplicantDto: RegisterApplicantDto) {
    const userExists = await this.findOneByUsername(
      registerApplicantDto.userName,
    );
    if (userExists) {
      return null;
    }
    const saltRounds = 10;
    const password = await bcrypt.hash(
      registerApplicantDto.password,
      saltRounds,
    );
    const user = this.applicantRepository.create({
      ...registerApplicantDto,
      password,
    });
    return await this.applicantRepository.save(user);
  }

  async findAll() {
    return await this.applicantRepository.find();
  }
  async findOneByUsername(userName: string) {
    return await this.applicantRepository.findOne({
      relations: ['resumes'],
      where: { userName },
    });
  }
  async findOne(id: number) {
    return await this.applicantRepository.findOne({
      relations: ['resumes', 'resumes.jobVacancy'],
      where: { id },
    });
  }

  async update(id: number, updateApplicantDto: UpdateApplicantDto) {
    const applicant = await this.findOne(id);

    if (!applicant) {
      throw new NotFoundException(`Applicant with ID ${id} not found`);
    }

    return this.applicantRepository.save({ id, ...updateApplicantDto });
  }

  async remove(id: number) {
    return await this.applicantRepository.delete({ id });
  }

  async getResumeForJobVacancy({
    userName,
    jobVacancyId,
  }: {
    userName: string;
    jobVacancyId: number;
  }) {
    return await this.jobVacancyService.getApplicantByJobVacancyId(
      jobVacancyId,
      userName,
    );
  }
  async getUserProfile(userId: number) {
    return this.applicantRepository.findOne({
      where: { id: userId },
      relations: ['resumes', 'resumes.jobVacancy'],
    });
  }

  escapeString(str: string) {
    if (typeof str !== 'string') {
      throw new Error('Input must be a string');
    }

    // Regular expression to match all characters that need to be escaped
    const re = /[\0\x08\x09\x1a\n\r"'\\\%]|[^\x00-\x7F]/g;

    // This uses the global flag to replace all occurrences
    return str.replace(re, '');
  }
}
