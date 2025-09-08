import { NextRequest, NextResponse } from 'next/server'

// Uses Gemini REST API to generate tailored behavioral interview questions
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

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      )
    }

    const systemContext = `You are an expert interviewer creating realistic behavioral interview questions using the STAR method focus. Return diverse, non-repetitive questions.`

    const userContext = `
Candidate context:
- Industry: ${industry || 'general'}
- Target role: ${role || 'general'}
- Experience level: ${experienceLevel || 'unspecified'}
- Skills: ${(skills && Array.isArray(skills) && skills.join(', ')) || 'N/A'}
${resumeText ? `\nResume (text):\n${resumeText.slice(0, 8000)}` : ''}
`

    const prompt = `${systemContext}\n\n${userContext}\n\nTask: Generate 10 behavioral interview questions tailored to the above context.\n- Make them varied and challenging.\n- Do NOT include answers.\n- Do NOT number them.\n- Output strictly in JSON: {\n  \"questions\": [\"q1\", \"q2\", ...]\n}`

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Gemini API error: ${resp.status} ${text}`)
    }

    const data = await resp.json()
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let questions: string[] = []
    try {
      const parsed = JSON.parse(candidateText)
      if (Array.isArray(parsed?.questions)) {
        questions = parsed.questions.filter((q: any) => typeof q === 'string')
      }
    } catch (_) {
      // Fallback: parse lines
      const lines = candidateText
        .split('\n')
        .map((l: string) => l.replace(/^[-*\d\.)\s]+/, '').trim())
        .filter((l: string) => l.length > 0)
      questions = lines.slice(0, 10)
    }

    if (!questions || questions.length === 0) {
      questions = [
        'Tell me about a time you handled a difficult stakeholder and what you learned.',
        'Describe a situation when you had to prioritize conflicting tasks under time pressure.',
        'Share an example of receiving tough feedback and how you responded.',
        'Tell me about a time you led without formal authority.',
        'Describe a time you adapted quickly to an unexpected change.',
        'Give an example of a conflict you resolved within a team.',
        'Tell me about a time you made a mistake and how you handled it.',
        'Describe a time you influenced a decision with data.',
        'Share an example of mentoring or supporting a teammate.',
        'Tell me about a time you improved a process end-to-end.'
      ]
    }

    // Shuffle to keep it fresh each call
    questions = questions.sort(() => Math.random() - 0.5).slice(0, 10)

    return NextResponse.json({ success: true, questions })
  } catch (error) {
    console.error('Error generating behavioral questions:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate questions' }, { status: 500 })
  }
}


