import { NextRequest, NextResponse } from 'next/server'

// Proxies to FastAPI backend for LangChain-powered question generation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const resume = formData.get('resume') as File
    const preferredIndustry = formData.get('preferredIndustry') as string
    const desiredRole = formData.get('desiredRole') as string
    const jobDescription = formData.get('jobDescription') as string

    if (!resume || !preferredIndustry || !desiredRole || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract resume text from the uploaded file
    const resumeText = await resume.text()

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const resp = await fetch(`${apiUrl}/api/v1/questions/technical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
        job_role: desiredRole,
        num_questions: 10,
      }),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.detail || `FastAPI error: ${resp.status}`)
    }

    const data = await resp.json()

    return NextResponse.json({
      questions: data.questions?.map((q: any) => q.text || q) || [],
      success: true,
    })
  } catch (error) {
    console.error('Error generating technical questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
