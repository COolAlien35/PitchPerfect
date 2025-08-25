import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from PyPDF2 import PdfReader
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@app.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400

    resume_file = request.files['resume']
    if resume_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if resume_file and resume_file.filename.endswith('.pdf'):
        try:
            pdf_reader = PdfReader(resume_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()

            model = genai.GenerativeModel('gemini-pro')
            prompt = f"""
            Analyze the following resume and generate 10 technical questions based on the skills and experience mentioned.

            Resume Text:
            {text}
            """
            response = model.generate_content(prompt)

            return jsonify({'questions': response.text})

        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file type, please upload a PDF'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5002)