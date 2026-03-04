from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
from ...repositories.interview_repo import InterviewRepository, SessionRepository
from ...repositories.qa_repo import QARecordRepository
from ...models.interview import InterviewStatus
from ..ai.service import AIService


class InterviewCreateDTO(BaseModel):
    title: str
    job_role: str
    job_description: str


class InterviewService:
    def __init__(
        self,
        ai_service: AIService,
        interview_repo: InterviewRepository,
        session_repo: SessionRepository,
        qa_repo: QARecordRepository
    ):
        self.ai_service = ai_service
        self.interview_repo = interview_repo
        self.session_repo = session_repo
        self.qa_repo = qa_repo

    async def create_interview_from_resume(
        self, user_id: UUID, resume_text: str, interview_data: InterviewCreateDTO
    ) -> UUID:
        """
        Orchestrates resume analysis, question generation, and DB initialization.
        Note: File reading (PDF/Docx) should be handled by a document parser before passing text here.
        """
        # 1. Generate Questions via AI
        generated_data = await self.ai_service.generate_questions(
            resume_text=resume_text,
            job_description=interview_data.job_description,
            job_role=interview_data.job_role
        )

        # 2. Create Interview Entry
        interview_obj = await self.interview_repo.create(
            obj_in={
                "user_id": user_id,
                "title": interview_data.title,
                "job_role": interview_data.job_role,
                "resume_data": {"text": resume_text},
                "status": InterviewStatus.PENDING
            }
        )

        # 3. Initialize first session or pre-generate records
        session_obj = await self.session_repo.create(
            obj_in={
                "interview_id": interview_obj.id,
                "overall_score": 0.0,
                "detailed_metrics": {}
            }
        )

        # 4. Prepare batch insert for QA records
        qa_inputs = [
            {
                "session_id": session_obj.id,
                "question": q.text,
                "transcript": "",
                "ai_feedback": {},
                "audio_metrics": {},
                "video_metrics": {}
            }
            for q in generated_data.questions
        ]
        
        await self.qa_repo.create_batch(obj_in_list=qa_inputs)
        
        # 5. Commit all changes (handled by session.commit() normally outside)
        # Assuming our repositories do atomic flush/refresh
        return interview_obj.id

    async def process_answer(
        self, session_id: UUID, record_id: UUID, transcript: str
    ) -> dict:
        """
        Evaluates the answer and updates session metrics.
        """
        # 1. Get current record
        record = await self.qa_repo.get(record_id)
        if not record:
            raise ValueError("QA Record not found")

        # 2. AI Evaluation
        feedback = await self.ai_service.evaluate_response(
            question=record.question,
            transcript=transcript
        )

        # 3. Update Record
        updated_data = {
            "transcript": transcript,
            "ai_feedback": feedback.model_dump()
        }
        await self.qa_repo.update(db_obj=record, obj_in=updated_data)

        # 4. Recalculate Session Overall Score (Basic average for now)
        all_records = await self.qa_repo.get_by_session_id(session_id=session_id)
        
        total_score = 0
        evaluated_count = 0
        
        for r in all_records:
            if r.ai_feedback:
                # Average of the 3 scores
                avg = (
                    r.ai_feedback.get("clarity_score", 0) + 
                    r.ai_feedback.get("tech_depth_score", 0) + 
                    r.ai_feedback.get("communication_score", 0)
                ) / 3.0
                total_score += avg
                evaluated_count += 1
                
        if evaluated_count > 0:
            overall = round(total_score / evaluated_count, 2)
            session = await self.session_repo.get(session_id)
            if session:
                await self.session_repo.update(
                    db_obj=session, 
                    obj_in={"overall_score": overall}
                )

        return feedback.model_dump()
