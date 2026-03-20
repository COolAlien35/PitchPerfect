import { NextRequest, NextResponse } from 'next/server'

// Proxies to FastAPI backend for LangChain-powered question generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      resumeText,
      industry,
      role,
      experienceLevel,
      skills,
    } = body || {}

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const resp = await fetch(`${apiUrl}/api/v1/questions/behavioral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: resumeText || '',
        job_description: [
          industry && `Industry: ${industry}`,
          experienceLevel && `Experience: ${experienceLevel}`,
          skills?.length && `Skills: ${skills.join(', ')}`,
        ].filter(Boolean).join('. ') || 'General behavioral interview',
        job_role: role || 'General',
        num_questions: 10,
      }),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.detail || `FastAPI error: ${resp.status}`)
    }

    const data = await resp.json()

    // Map to the format the frontend expects: { success: true, questions: string[] }
    const questions = data.questions?.map((q: any) => q.text || q) || []

    if (questions.length === 0) {
      // Fallback questions
      return NextResponse.json({
        success: true,
        questions: [
          'Tell me about a time you handled a difficult stakeholder and what you learned.',
          'Describe a situation when you had to prioritize conflicting tasks under time pressure.',
          'Share an example of receiving tough feedback and how you responded.',
          'Tell me about a time you led without formal authority.',
          'Describe a time you adapted quickly to an unexpected change.',
          'Give an example of a conflict you resolved within a team.',
          'Tell me about a time you made a mistake and how you handled it.',
          'Describe a time you influenced a decision with data.',
          'Share an example of mentoring or supporting a teammate.',
          'Tell me about a time you improved a process end-to-end.',
        ],
      })
    }

    return NextResponse.json({ success: true, questions })
  } catch (error) {
    console.error('Error generating behavioral questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
