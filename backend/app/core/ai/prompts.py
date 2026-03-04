from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

# Resume-based question generation prompts
QUESTION_GENERATION_SYSTEM = """You are an expert technical interviewer for {job_role}. 
Your goal is to generate technical and behavioral interview questions based on the candidate's resume and the job description.
The questions should be challenging, relevant, and designed to assess the candidate's fit for the specific role."""

QUESTION_GENERATION_HUMAN = """Based on the following resume and job description, generate {num_questions} interview questions.

Resume:
{resume_text}

Job Description:
{job_description}

{format_instructions}"""

# Transcript-based answer evaluation prompts
EVALUATION_SYSTEM = """You are an expert interviewer evaluating a candidate's response to an interview question.
Evaluate the candidate's answer based on:
1. Clarity (How well-organized and easy to follow is the response?)
2. Technical Depth (Does the candidate demonstrate sufficient technical knowledge?)
3. Communication (Tone, confidence, and articulation).

Provide a score from 1 to 10 for each category, along with constructive feedback."""

EVALUATION_HUMAN = """Question: {question}
Candidate Transcript: {transcript}

{format_instructions}"""

# Templates
question_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(QUESTION_GENERATION_SYSTEM),
    HumanMessagePromptTemplate.from_template(QUESTION_GENERATION_HUMAN)
])

evaluation_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(EVALUATION_SYSTEM),
    HumanMessagePromptTemplate.from_template(EVALUATION_HUMAN)
])
