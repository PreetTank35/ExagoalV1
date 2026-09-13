# ExaGo Presentation Script

**Total time:** 4 minutes  
**Format:** What, Why, How  
**Demo focus:** Institute portal and AI exam-generation workflow

> **Opening note:** Speak naturally. The text in `[brackets]` is a screen action, not narration.

## 1. WHAT IS EXAGO? | 0:00-1:00

**[Show the login page or institute dashboard]**

"Good morning everyone. Our project is **ExaGo**, an AI-powered academic assessment and learner management platform.

The main problem ExaGo solves is the gap between an institute's curriculum and the actual process of creating a good examination paper. Normally, teachers have to search through syllabi, notes, previous papers, and other course material manually. This takes time and can lead to papers that are not properly aligned with the course.

ExaGo brings this complete workflow into one platform. Institutes can manage students and teachers, upload course documents, connect their ERP data, configure assessment rules, and generate curriculum-aligned examination papers using AI.

For students, the platform also provides a dynamic learning profile. It brings together academic progress, verified credentials, goals, activities, and connected learning sources in one place.

So, in one line: **ExaGo converts institutional academic data into structured, configurable, and ready-to-use assessments.**"

## 2. WHY EXAGO? | 1:00-1:50

**[Show the institute dashboard and briefly point to the activity, student, and teacher areas]**

"We built ExaGo because assessment creation is still highly manual, while every institute already has a large amount of useful academic data.

A teacher should not have to start from a blank page every time. The paper should reflect the institute's own syllabus, units, learning objectives, difficulty level, marks distribution, and academic standards.

ExaGo provides three important benefits:

First, **relevance**: questions are generated from the institute's uploaded course material instead of generic AI knowledge.

Second, **control**: teachers and administrators decide the difficulty distribution, Bloom's Taxonomy levels, question types, course and program outcome mapping, time limit, marks, and diagram requirements.

Third, **efficiency with human review**: AI creates the first draft, but faculty can inspect, edit, refine, and approve it before publication. This keeps the speed of AI and the responsibility of an educator together.

This makes ExaGo useful for colleges, schools, coaching institutes, and any academic organization that wants faster and more consistent assessment creation."

## 3. HOW DOES IT WORK? | 1:50-3:40

### Step A: Add the institute's knowledge | 1:50-2:20

**[Open `Course Documents`]**

"Now I will show the working flow. First, the institute uploads its syllabus, textbook, lecture material, question bank, PDF, Word file, PowerPoint, Markdown, text, or JSON file.

ExaGo extracts the content, breaks it into meaningful curriculum sections, detects the subject, and stores those sections in the institute's knowledge repository. These sections are converted into semantic vectors, so the system can retrieve the most relevant content later.

This is important because the generated exam is grounded in the institute's own material."

### Step B: Set assessment rules | 2:20-2:45

**[Open `Control Hub`]**

"Next, the administrator can configure the assessment without writing code. Here we can choose an exam profile, set easy, medium, and hard question percentages, select Bloom's levels, decide the mix of subjective, numerical, and MCQ questions, and enable safeguards such as no duplicate topics and balanced marks.

These settings become the blueprint for the AI-generated paper."

### Step C: Generate and review the exam | 2:45-3:25

**[Open `Generate Exam`]**

"Now I select the subject and syllabus set, enter the exam title, number of questions, total marks, and unit-wise weightage. I can also choose whether diagrams should be included.

When I click **Generate Examination**, ExaGo retrieves the relevant indexed curriculum context and sends the structured requirements to the AI generation pipeline. The result is a complete examination draft with questions, marks, mathematical notation, and—where useful—generated Matplotlib diagrams.

The teacher can then review each question, edit the wording or marks directly, ask AI for a targeted refinement, and inspect the visual plot in the studio."

### Step D: Publish in the required format | 3:25-3:40

**[Scroll to the export controls]**

"Finally, the approved paper can be exported in multiple formats: print-ready PDF, Word document, PowerPoint, or LaTeX. So the workflow is complete from source material to a usable institutional exam paper."

## 4. CLOSING | 3:40-4:00

**[Return to the generated exam or dashboard]**

"To conclude, ExaGo is not just a chatbot that writes random questions. It is an end-to-end academic platform: it understands institutional content, follows administrator-defined rules, keeps faculty in control, and produces publication-ready assessments.

Our vision is to make assessment more aligned, transparent, scalable, and useful for both institutions and learners.

Thank you. I would be happy to demonstrate the document upload and exam-generation flow once more."

## Quick Demo Checklist

1. Login with the institute demo account.
2. Show the institute dashboard for 10 seconds.
3. Open **Course Documents** and show indexed material and subject counts.
4. Open **Control Hub** and show difficulty, Bloom's levels, and guardrails.
5. Open **Generate Exam** and show subject, marks, unit weights, and diagram option.
6. Generate or open a prepared exam draft.
7. Show one question, one diagram, the edit/AI refinement action, and export buttons.

## One-Line Backup Summary

**ExaGo is an AI-powered institute platform that converts a college's own curriculum and academic data into configurable, faculty-reviewed, multi-format examination papers.**
