"""
OMR Answer Key Evaluator
Handles evaluation of OMR responses against answer keys with subject-wise scoring
"""

import json
import os
from typing import Dict, List, Tuple, Any

class OMREvaluator:
    def __init__(self, answer_key_path: str = None):
        """Initialize the OMR evaluator with answer keys"""
        if answer_key_path is None:
            answer_key_path = os.path.join(os.path.dirname(__file__), '..', 'answer_keys.json')
        
        self.answer_keys = self._load_answer_keys(answer_key_path)
        self.subjects = ["Python", "EDA", "SQL", "PowerBI", "Statistics"]
        
    def _load_answer_keys(self, path: str) -> Dict:
        """Load answer keys from JSON file"""
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Answer key file not found at {path}")
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON format in answer key file")
    
    def evaluate_responses(self, student_responses: List[str], exam_set: str = "setA") -> Dict[str, Any]:
        """
        Evaluate student responses against answer key
        
        Args:
            student_responses: List of 100 student answers (a, b, c, d, or empty)
            exam_set: Exam set identifier (setA, setB, etc.)
            
        Returns:
            Dictionary containing detailed evaluation results
        """
        if exam_set not in self.answer_keys:
            raise ValueError(f"Exam set '{exam_set}' not found in answer keys")
        
        if len(student_responses) != 100:
            raise ValueError(f"Expected 100 responses, got {len(student_responses)}")
        
        answer_key = self.answer_keys[exam_set]
        correct_answers = answer_key["rawAnswers"]
        special_cases = answer_key.get("specialCases", {})
        
        # Initialize results
        results = {
            "totalQuestions": 100,
            "totalScore": 0,
            "percentage": 0.0,
            "subjectScores": {},
            "detailedResults": [],
            "summary": {
                "correct": 0,
                "incorrect": 0,
                "unanswered": 0
            }
        }
        
        # Evaluate each question
        for i, (student_answer, correct_answer) in enumerate(zip(student_responses, correct_answers)):
            question_num = i + 1
            subject = self._get_subject_for_question(question_num)
            
            # Handle special cases (multiple correct answers)
            if str(question_num) in special_cases:
                is_correct = self._evaluate_special_case(student_answer, question_num, special_cases)
            else:
                is_correct = self._evaluate_single_answer(student_answer, correct_answer)
            
            # Determine answer status
            if not student_answer or student_answer.strip() == "":
                status = "unanswered"
                is_correct = False
            elif is_correct:
                status = "correct"
                results["totalScore"] += 1
                results["summary"]["correct"] += 1
            else:
                status = "incorrect"
                results["summary"]["incorrect"] += 1
            
            if status == "unanswered":
                results["summary"]["unanswered"] += 1
            
            # Add to detailed results
            results["detailedResults"].append({
                "questionNumber": question_num,
                "subject": subject,
                "studentAnswer": student_answer,
                "correctAnswer": correct_answer,
                "isCorrect": is_correct,
                "status": status
            })
            
            # Update subject scores
            if subject not in results["subjectScores"]:
                results["subjectScores"][subject] = {
                    "correct": 0,
                    "total": 20,
                    "percentage": 0.0,
                    "questions": []
                }
            
            results["subjectScores"][subject]["questions"].append({
                "questionNumber": question_num,
                "isCorrect": is_correct,
                "status": status
            })
            
            if is_correct:
                results["subjectScores"][subject]["correct"] += 1
        
        # Calculate percentages
        results["percentage"] = (results["totalScore"] / 100) * 100
        
        for subject in results["subjectScores"]:
            subject_data = results["subjectScores"][subject]
            subject_data["percentage"] = (subject_data["correct"] / subject_data["total"]) * 100
        
        return results
    
    def _get_subject_for_question(self, question_num: int) -> str:
        """Get subject name for a given question number"""
        if 1 <= question_num <= 20:
            return "Python"
        elif 21 <= question_num <= 40:
            return "EDA"
        elif 41 <= question_num <= 60:
            return "SQL"
        elif 61 <= question_num <= 80:
            return "PowerBI"
        elif 81 <= question_num <= 100:
            return "Statistics"
        else:
            raise ValueError(f"Invalid question number: {question_num}")
    
    def _evaluate_single_answer(self, student_answer: str, correct_answer: str) -> bool:
        """Evaluate a single answer question"""
        if not student_answer:
            return False
        return student_answer.lower().strip() == correct_answer.lower().strip()
    
    def _evaluate_special_case(self, student_answer: str, question_num: int, special_cases: Dict) -> bool:
        """Evaluate special case questions (multiple correct answers)"""
        if not student_answer:
            return False
        
        case_info = special_cases[str(question_num)]
        accepted_answers = case_info["acceptedAnswers"]
        
        # Check if student answer is in accepted answers
        return student_answer.lower().strip() in [ans.lower().strip() for ans in accepted_answers]
    
    def generate_report(self, evaluation_results: Dict, student_info: Dict = None) -> Dict:
        """Generate a comprehensive report from evaluation results"""
        report = {
            "studentInfo": student_info or {},
            "examResults": evaluation_results,
            "recommendations": self._generate_recommendations(evaluation_results),
            "timestamp": self._get_timestamp()
        }
        
        return report
    
    def _generate_recommendations(self, results: Dict) -> List[str]:
        """Generate recommendations based on performance"""
        recommendations = []
        
        # Overall performance recommendations
        if results["percentage"] >= 80:
            recommendations.append("Excellent performance! Keep up the good work.")
        elif results["percentage"] >= 60:
            recommendations.append("Good performance. Focus on weak areas for improvement.")
        elif results["percentage"] >= 40:
            recommendations.append("Average performance. Significant improvement needed.")
        else:
            recommendations.append("Below average performance. Intensive study required.")
        
        # Subject-wise recommendations
        for subject, data in results["subjectScores"].items():
            if data["percentage"] < 50:
                recommendations.append(f"Focus on improving {subject} - scored {data['percentage']:.1f}%")
        
        return recommendations
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

# Example usage and testing
if __name__ == "__main__":
    # Test the evaluator
    evaluator = OMREvaluator()
    
    # Sample student responses (all correct for testing)
    sample_responses = [
        "a", "c", "c", "c", "c", "a", "c", "c", "b", "c",  # Python (1-10)
        "a", "a", "d", "a", "b", "a", "c", "d", "a", "b",  # Python (11-20)
        "a", "d", "b", "a", "c", "b", "a", "b", "d", "c",  # EDA (21-30)
        "c", "a", "b", "c", "a", "b", "d", "b", "a", "b",  # EDA (31-40)
        "c", "c", "c", "b", "b", "a", "c", "b", "d", "a",  # SQL (41-50)
        "c", "b", "c", "c", "a", "b", "b", "a", "a", "b",  # SQL (51-60)
        "b", "c", "a", "b", "c", "b", "b", "c", "c", "b",  # PowerBI (61-70)
        "b", "b", "d", "b", "a", "b", "b", "b", "b", "b",  # PowerBI (71-80)
        "a", "b", "c", "b", "c", "b", "b", "b", "a", "b",  # Statistics (81-90)
        "c", "b", "c", "b", "b", "b", "c", "a", "b", "c"   # Statistics (91-100)
    ]
    
    # Evaluate responses
    results = evaluator.evaluate_responses(sample_responses)
    
    print("Evaluation Results:")
    print(f"Total Score: {results['totalScore']}/100 ({results['percentage']:.1f}%)")
    print("\nSubject-wise Scores:")
    for subject, data in results["subjectScores"].items():
        print(f"{subject}: {data['correct']}/20 ({data['percentage']:.1f}%)")
