from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from .prompts import question_prompt, evaluation_prompt


class Question(BaseModel):
    id: int = Field(description="Unique question identifier")
    text: str = Field(description="The interview question")
    type: str = Field(description="Question type: technical, behavioral, or resume-specific")


class QuestionList(BaseModel):
    questions: List[Question]


class FeedbackModel(BaseModel):
    clarity_score: int = Field(description="Score for answer clarity (1-10)", ge=1, le=10)
    tech_depth_score: int = Field(description="Score for technical depth (1-10)", ge=1, le=10)
    communication_score: int = Field(description="Score for communication (1-10)", ge=1, le=10)
    detailed_feedback: str = Field(description="Constructive and actionable feedback")
    suggested_answer_points: List[str] = Field(description="Key points that should have been covered")


class AIService:
    def __init__(self, api_key: str = None, model_name: str = "gemini-1.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.7,
            max_retries=3,
        )
        self.question_parser = PydanticOutputParser(pydantic_object=QuestionList)
        self.evaluation_parser = PydanticOutputParser(pydantic_object=FeedbackModel)

    async def generate_questions(
        self, resume_text: str, job_description: str, job_role: str, num_questions: int = 5
    ) -> QuestionList:
        chain = question_prompt | self.llm | self.question_parser
        try:
            result = await chain.ainvoke({
                "resume_text": resume_text,
                "job_description": job_description,
                "job_role": job_role,
                "num_questions": num_questions,
                "format_instructions": self.question_parser.get_format_instructions()
            })
            return result
        except Exception as e:
            # Handle rate limits, safety filters, etc.
            # In a real environment, you might log this and raise a custom exception
            raise RuntimeError(f"AI Question Generation failed: {str(e)}")

    async def evaluate_response(self, question: str, transcript: str) -> FeedbackModel:
        chain = evaluation_prompt | self.llm | self.evaluation_parser
        try:
            result = await chain.ainvoke({
                "question": question,
                "transcript": transcript,
                "format_instructions": self.evaluation_parser.get_format_instructions()
            })
            return result
        except Exception as e:
            raise RuntimeError(f"AI Answer Evaluation failed: {str(e)}")
