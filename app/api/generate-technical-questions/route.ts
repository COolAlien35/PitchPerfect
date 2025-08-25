import { NextRequest, NextResponse } from 'next/server'

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

    // Convert file to buffer for Python service
    const buffer = Buffer.from(await resume.arrayBuffer())
    
    // Create data to send to Python service
    const pythonServiceData = {
      resume: buffer.toString('base64'),
      resumeFileName: resume.name,
      preferredIndustry,
      desiredRole,
      jobDescription
    }

    // Call Python service to process resume and generate questions
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8002/generate-questions'
    
    const response = await fetch(pythonServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonServiceData)
    })

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      questions: data.questions,
      ideal_answers: data.ideal_answers,
      success: true
    })

  } catch (error) {
    console.error('Error generating technical questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
