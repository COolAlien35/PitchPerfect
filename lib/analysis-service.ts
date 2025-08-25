export interface InterviewData {
  type: string;
  personality: string;
  questions: string[];
  responses: string[];
  recoveryScore: number;
  sessionTime: number;
  interruptionsHandled: number;
  deepfakeMode: boolean;
  hostileMode: boolean;
  voiceAnalysisHistory?: any[];
  emotionHistory?: any[];
  questionStartTimes?: number[];
  sessionStartTime?: number;
  confidenceScore?: number;
  audioLevel?: number;
  avatarReaction?: any;
}

export interface CalculatedScores {
  communication: number;
  confidence: number;
  clarity: number;
  engagement: number;
  storytelling: number;
  professionalism: number;
  technicalKnowledge: number;
  problemSolving: number;
  leadership: number;
  adaptability: number;
}

export interface QuestionAnalysis {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  aiAnalysis: string;
  improvementAreas: string[];
  score: number;
}

export class AnalysisService {
  static calculateScores(data: InterviewData): CalculatedScores {
    const scores: CalculatedScores = {
      communication: 75,
      confidence: 70,
      clarity: 75,
      engagement: 70,
      storytelling: 75,
      professionalism: 75,
      technicalKnowledge: 70,
      problemSolving: 75,
      leadership: 70,
      adaptability: 75,
    };

    // Analyze voice data
    if (data.voiceAnalysisHistory && data.voiceAnalysisHistory.length > 0) {
      const voiceData = data.voiceAnalysisHistory;
      const avgWPM = voiceData.reduce((sum: number, item: any) => sum + (item.wpm || 0), 0) / voiceData.length;
      const avgVolume = voiceData.reduce((sum: number, item: any) => sum + (item.volume || 0), 0) / voiceData.length;
      const fillerWords = voiceData.reduce((sum: number, item: any) => sum + (item.fillerWords || 0), 0);

      // Adjust scores based on voice metrics
      if (avgWPM >= 140 && avgWPM <= 160) scores.communication += 10;
      else if (avgWPM < 120 || avgWPM > 180) scores.communication -= 5;

      if (avgVolume >= 60) scores.confidence += 8;
      else if (avgVolume < 30) scores.confidence -= 10;

      if (fillerWords < 5) scores.clarity += 10;
      else if (fillerWords > 10) scores.clarity -= 8;

      // Analyze confidence from voice data
      const highConfidenceCount = voiceData.filter((item: any) => item.confidence === "High").length;
      const confidenceRatio = highConfidenceCount / voiceData.length;
      scores.confidence += Math.round(confidenceRatio * 15);
    }

    // Analyze emotion data
    if (data.emotionHistory && data.emotionHistory.length > 0) {
      const emotionData = data.emotionHistory;
      const avgHappy = emotionData.reduce((sum: number, item: any) => sum + (item.happy || 0), 0) / emotionData.length;
      const avgNeutral = emotionData.reduce((sum: number, item: any) => sum + (item.neutral || 0), 0) / emotionData.length;

      if (avgHappy > 0.3) scores.engagement += 10;
      if (avgNeutral > 0.4) scores.professionalism += 8;
    }

    // Analyze responses
    if (data.responses && data.responses.length > 0) {
      const responses = data.responses.filter((r: string) => r && r.length > 0);
      const avgResponseLength = responses.reduce((sum: number, r: string) => sum + r.length, 0) / responses.length;

      // Score based on response quality
      responses.forEach((response: string, index: number) => {
        const wordCount = response.split(' ').length;
        const hasSTAR = response.toLowerCase().includes('situation') || 
                       response.toLowerCase().includes('task') || 
                       response.toLowerCase().includes('action') || 
                       response.toLowerCase().includes('result');
        
        if (wordCount >= 50 && wordCount <= 200) scores.storytelling += 5;
        if (hasSTAR) scores.storytelling += 10;
        
        if (wordCount >= 30) scores.communication += 3;
        if (response.includes('led') || response.includes('managed') || response.includes('coordinated')) {
          scores.leadership += 5;
        }
        if (response.includes('problem') || response.includes('solve') || response.includes('challenge')) {
          scores.problemSolving += 5;
        }
      });
    }

    // Analyze session metrics
    if (data.sessionTime) {
      const timePerQuestion = data.sessionTime / (data.questions?.length || 1);
      if (timePerQuestion >= 120 && timePerQuestion <= 300) scores.engagement += 5;
    }

    if (data.interruptionsHandled) {
      if (data.interruptionsHandled <= 2) scores.adaptability += 10;
      else if (data.interruptionsHandled > 5) scores.adaptability -= 5;
    }

    // Cap all scores at 100
    Object.keys(scores).forEach(key => {
      const scoreKey = key as keyof CalculatedScores;
      scores[scoreKey] = Math.min(100, Math.max(0, scores[scoreKey]));
    });

    return scores;
  }

  static calculateOverallScore(scores: CalculatedScores): number {
    const total = Object.values(scores).reduce((sum: number, score: number) => sum + score, 0);
    const average = total / Object.keys(scores).length;
    return Math.round((average / 10) * 10) / 10;
  }

  static generateQuestionAnalysis(question: string, userAnswer: string): QuestionAnalysis {
    if (!userAnswer || userAnswer.length < 10) {
      return {
        question,
        userAnswer,
        correctAnswer: this.getIdealAnswer(question),
        aiAnalysis: "No response detected. Please ensure your microphone is working and try speaking clearly.",
        improvementAreas: ["Speak clearly and at a good pace", "Ensure your microphone is properly connected", "Try to provide detailed responses"],
        score: 5.0
      };
    }

    const wordCount = userAnswer.split(' ').length;
    const hasSTAR = userAnswer.toLowerCase().includes('situation') || 
                   userAnswer.toLowerCase().includes('task') || 
                   userAnswer.toLowerCase().includes('action') || 
                   userAnswer.toLowerCase().includes('result');
    const hasMetrics = /\d+%|\d+ percent|\$\d+|\d+ dollars|\d+ people|\d+ team/.test(userAnswer);
    const hasLeadership = /led|managed|coordinated|supervised|directed/.test(userAnswer.toLowerCase());

    let score = 6.0;
    let analysis = "";
    let improvements: string[] = [];

    // Score based on response characteristics
    if (wordCount >= 50 && wordCount <= 200) score += 1.5;
    else if (wordCount < 30) {
      score -= 1.0;
      improvements.push("Provide more detailed responses");
    }
    else if (wordCount > 300) {
      score -= 0.5;
      improvements.push("Be more concise in your responses");
    }

    if (hasSTAR) {
      score += 1.5;
      analysis += "Good use of STAR method structure. ";
    } else {
      score -= 1.0;
      improvements.push("Use the STAR method (Situation, Task, Action, Result)");
    }

    if (hasMetrics) {
      score += 1.0;
      analysis += "Excellent use of quantifiable metrics. ";
    } else {
      score -= 0.5;
      improvements.push("Include specific numbers and metrics");
    }

    if (hasLeadership) {
      score += 0.5;
      analysis += "Good demonstration of leadership. ";
    }

    // Generate contextual analysis
    if (question.toLowerCase().includes('difficult') || question.toLowerCase().includes('challenge')) {
      if (userAnswer.toLowerCase().includes('problem') || userAnswer.toLowerCase().includes('solve')) {
        score += 0.5;
        analysis += "Good problem-solving approach. ";
      }
    }

    if (question.toLowerCase().includes('deadline') || question.toLowerCase().includes('pressure')) {
      if (userAnswer.toLowerCase().includes('prioritize') || userAnswer.toLowerCase().includes('organize')) {
        score += 0.5;
        analysis += "Good time management demonstration. ";
      }
    }

    // Cap score at 10
    score = Math.min(10, Math.max(0, score));

    if (!analysis) {
      analysis = "Your response shows good structure but could be enhanced with more specific details and metrics.";
    }

    return {
      question,
      userAnswer,
      correctAnswer: this.getIdealAnswer(question),
      aiAnalysis: analysis,
      improvementAreas: improvements,
      score: Math.round(score * 10) / 10
    };
  }

  private static getIdealAnswer(question: string): string {
    const idealAnswers: { [key: string]: string } = {
      "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?": 
        "A strong answer should follow the STAR method (Situation, Task, Action, Result). Start with a specific situation, explain your role and the challenges, detail the actions you took, and quantify the results. Focus on leadership, problem-solving, and measurable outcomes.",
      "Describe a situation where you had to meet a tight deadline. What was your approach?":
        "Demonstrate your ability to stay calm, prioritize tasks, and make quick decisions. Show how you managed stress, communicated with stakeholders, and maintained quality under pressure. Include the outcome and what you learned.",
      "Can you give me an example of a time when you had to adapt to a significant change at work?":
        "Show your flexibility and resilience. Describe the change, your initial reaction, how you adapted your approach, and the positive outcomes. Emphasize learning and growth.",
      "Tell me about a project you're particularly proud of. What made it successful?":
        "Choose a project that demonstrates your key strengths. Explain the context, your role, the challenges, your contributions, and quantifiable results. Show passion and ownership.",
      "Describe a time when you had to give constructive feedback to a colleague.":
        "Show your communication skills and emotional intelligence. Explain the situation, your approach to delivering feedback, how you ensured it was constructive, and the positive outcome."
    };
    
    return idealAnswers[question] || "Provide a detailed response using the STAR method with specific examples and quantifiable results.";
  }
}
