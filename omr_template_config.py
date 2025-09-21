"""
OMR Template Configuration System
Professional template management for different OMR sheet layouts
Supports multiple formats and adaptive detection
"""

import json
import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

@dataclass
class BubbleTemplate:
    """Template for individual bubble configuration"""
    x: int
    y: int
    width: int
    height: int
    option_letter: str
    question_number: int

@dataclass
class QuestionTemplate:
    """Template for question layout"""
    question_number: int
    bubbles: List[BubbleTemplate]
    region_bounds: Tuple[int, int, int, int]  # x, y, width, height
    expected_answers: int = 1  # Number of expected answers (1 for single, >1 for multiple)

@dataclass
class OMRTemplate:
    """Complete OMR sheet template"""
    name: str
    description: str
    total_questions: int
    questions_per_page: int
    options_per_question: int
    page_dimensions: Tuple[int, int]  # width, height
    questions: List[QuestionTemplate]
    reference_points: List[Tuple[int, int]]  # Corner markers for alignment
    set_indicators: Dict[str, Tuple[int, int, int, int]]  # Set A/B detection regions

class OMRTemplateManager:
    """
    Professional OMR template management system
    Handles multiple template formats and automatic detection
    """
    
    def __init__(self, templates_dir: str = "templates"):
        self.templates_dir = Path(templates_dir)
        self.templates_dir.mkdir(exist_ok=True)
        self.templates: Dict[str, OMRTemplate] = {}
        self.load_templates()
        
    def load_templates(self):
        """Load all available templates"""
        template_files = list(self.templates_dir.glob("*.json"))
        
        for template_file in template_files:
            try:
                template = self.load_template_from_file(str(template_file))
                self.templates[template.name] = template
                logger.info(f"Loaded template: {template.name}")
            except Exception as e:
                logger.error(f"Failed to load template {template_file}: {e}")
        
        # Create default templates if none exist
        if not self.templates:
            self.create_default_templates()
    
    def load_template_from_file(self, file_path: str) -> OMRTemplate:
        """Load template from JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Convert dictionary data to template objects
        questions = []
        for q_data in data['questions']:
            bubbles = [BubbleTemplate(**b) for b in q_data['bubbles']]
            question = QuestionTemplate(
                question_number=q_data['question_number'],
                bubbles=bubbles,
                region_bounds=tuple(q_data['region_bounds']),
                expected_answers=q_data.get('expected_answers', 1)
            )
            questions.append(question)
        
        template = OMRTemplate(
            name=data['name'],
            description=data['description'],
            total_questions=data['total_questions'],
            questions_per_page=data['questions_per_page'],
            options_per_question=data['options_per_question'],
            page_dimensions=tuple(data['page_dimensions']),
            questions=questions,
            reference_points=[tuple(p) for p in data['reference_points']],
            set_indicators={k: tuple(v) for k, v in data['set_indicators'].items()}
        )
        
        return template
    
    def save_template(self, template: OMRTemplate, file_path: Optional[str] = None):
        """Save template to JSON file"""
        if file_path is None:
            file_path = self.templates_dir / f"{template.name}.json"
        
        # Convert template to dictionary
        data = {
            'name': template.name,
            'description': template.description,
            'total_questions': template.total_questions,
            'questions_per_page': template.questions_per_page,
            'options_per_question': template.options_per_question,
            'page_dimensions': template.page_dimensions,
            'reference_points': template.reference_points,
            'set_indicators': template.set_indicators,
            'questions': []
        }
        
        for question in template.questions:
            q_data = {
                'question_number': question.question_number,
                'region_bounds': question.region_bounds,
                'expected_answers': question.expected_answers,
                'bubbles': [asdict(bubble) for bubble in question.bubbles]
            }
            data['questions'].append(q_data)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Template saved: {file_path}")
    
    def create_default_templates(self):
        """Create default templates for common OMR formats"""
        
        # Standard 100-question template (4 columns, 25 questions each)
        standard_template = self.create_standard_100q_template()
        self.templates[standard_template.name] = standard_template
        self.save_template(standard_template)
        
        # Compact 50-question template
        compact_template = self.create_compact_50q_template()
        self.templates[compact_template.name] = compact_template
        self.save_template(compact_template)
        
        logger.info("Created default templates")
    
    def create_standard_100q_template(self) -> OMRTemplate:
        """Create standard 100-question template for hackathon"""
        
        # Page dimensions (A4 size in pixels at 300 DPI)
        page_width, page_height = 2480, 3508
        
        # Grid configuration
        columns = 4
        rows_per_column = 25
        options_per_question = 4
        
        # Calculate spacing
        margin_x = 200
        margin_y = 400
        column_width = (page_width - 2 * margin_x) // columns
        row_height = (page_height - 2 * margin_y) // rows_per_column
        
        # Bubble dimensions
        bubble_width = 30
        bubble_height = 30
        bubble_spacing = 40
        
        questions = []
        
        for col in range(columns):
            for row in range(rows_per_column):
                question_num = col * rows_per_column + row + 1
                
                # Calculate question region
                region_x = margin_x + col * column_width
                region_y = margin_y + row * row_height
                region_width = column_width - 20
                region_height = row_height - 10
                
                # Create bubbles for this question
                bubbles = []
                bubble_start_x = region_x + 60  # Space for question number
                bubble_y = region_y + (region_height - bubble_height) // 2
                
                for option in range(options_per_question):
                    bubble_x = bubble_start_x + option * bubble_spacing
                    
                    bubble = BubbleTemplate(
                        x=bubble_x,
                        y=bubble_y,
                        width=bubble_width,
                        height=bubble_height,
                        option_letter=chr(ord('a') + option),
                        question_number=question_num
                    )
                    bubbles.append(bubble)
                
                question = QuestionTemplate(
                    question_number=question_num,
                    bubbles=bubbles,
                    region_bounds=(region_x, region_y, region_width, region_height),
                    expected_answers=1
                )
                questions.append(question)
        
        # Reference points for alignment (corners of the sheet)
        reference_points = [
            (100, 100),      # Top-left
            (page_width - 100, 100),      # Top-right
            (page_width - 100, page_height - 100),  # Bottom-right
            (100, page_height - 100)      # Bottom-left
        ]
        
        # Set indicators (regions where "SET A" or "SET B" appear)
        set_indicators = {
            'A': (page_width // 2 - 100, 200, 200, 50),
            'B': (page_width // 2 + 100, 200, 200, 50)
        }
        
        template = OMRTemplate(
            name="standard_100q",
            description="Standard 100-question OMR sheet (4 columns, 25 rows)",
            total_questions=100,
            questions_per_page=100,
            options_per_question=4,
            page_dimensions=(page_width, page_height),
            questions=questions,
            reference_points=reference_points,
            set_indicators=set_indicators
        )
        
        return template
    
    def create_compact_50q_template(self) -> OMRTemplate:
        """Create compact 50-question template"""
        
        page_width, page_height = 2480, 3508
        
        # Grid configuration for 50 questions (2 columns, 25 rows each)
        columns = 2
        rows_per_column = 25
        options_per_question = 4
        
        # Calculate spacing
        margin_x = 300
        margin_y = 500
        column_width = (page_width - 2 * margin_x) // columns
        row_height = (page_height - 2 * margin_y) // rows_per_column
        
        # Bubble dimensions
        bubble_width = 35
        bubble_height = 35
        bubble_spacing = 50
        
        questions = []
        
        for col in range(columns):
            for row in range(rows_per_column):
                question_num = col * rows_per_column + row + 1
                
                region_x = margin_x + col * column_width
                region_y = margin_y + row * row_height
                region_width = column_width - 20
                region_height = row_height - 10
                
                bubbles = []
                bubble_start_x = region_x + 80
                bubble_y = region_y + (region_height - bubble_height) // 2
                
                for option in range(options_per_question):
                    bubble_x = bubble_start_x + option * bubble_spacing
                    
                    bubble = BubbleTemplate(
                        x=bubble_x,
                        y=bubble_y,
                        width=bubble_width,
                        height=bubble_height,
                        option_letter=chr(ord('a') + option),
                        question_number=question_num
                    )
                    bubbles.append(bubble)
                
                question = QuestionTemplate(
                    question_number=question_num,
                    bubbles=bubbles,
                    region_bounds=(region_x, region_y, region_width, region_height),
                    expected_answers=1
                )
                questions.append(question)
        
        reference_points = [
            (150, 150),
            (page_width - 150, 150),
            (page_width - 150, page_height - 150),
            (150, page_height - 150)
        ]
        
        set_indicators = {
            'A': (page_width // 2 - 150, 250, 300, 60),
            'B': (page_width // 2 + 150, 250, 300, 60)
        }
        
        template = OMRTemplate(
            name="compact_50q",
            description="Compact 50-question OMR sheet (2 columns, 25 rows)",
            total_questions=50,
            questions_per_page=50,
            options_per_question=4,
            page_dimensions=(page_width, page_height),
            questions=questions,
            reference_points=reference_points,
            set_indicators=set_indicators
        )
        
        return template
    
    def detect_template(self, image: np.ndarray) -> Optional[OMRTemplate]:
        """
        Automatically detect which template matches the given image
        Uses feature matching and geometric analysis
        """
        best_template = None
        best_score = 0
        
        for template_name, template in self.templates.items():
            score = self._calculate_template_match_score(image, template)
            
            if score > best_score:
                best_score = score
                best_template = template
        
        if best_score > 0.7:  # Threshold for acceptable match
            logger.info(f"Detected template: {best_template.name} (score: {best_score:.2f})")
            return best_template
        
        logger.warning("Could not reliably detect template")
        return None
    
    def _calculate_template_match_score(self, image: np.ndarray, template: OMRTemplate) -> float:
        """Calculate how well an image matches a template"""
        
        # Resize image to template dimensions for comparison
        target_width, target_height = template.page_dimensions
        resized_image = cv2.resize(image, (target_width, target_height))
        
        score = 0.0
        total_checks = 0
        
        # Check reference points
        for ref_point in template.reference_points:
            x, y = ref_point
            
            # Look for corner markers or alignment marks
            region = resized_image[max(0, y-20):y+20, max(0, x-20):x+20]
            
            if region.size > 0:
                # Simple check for dark regions (markers)
                marker_intensity = np.mean(region)
                if marker_intensity < 100:  # Dark region detected
                    score += 1
                total_checks += 1
        
        # Check bubble regions for consistent patterns
        sample_questions = template.questions[::10]  # Sample every 10th question
        
        for question in sample_questions:
            region_x, region_y, region_w, region_h = question.region_bounds
            
            # Extract question region
            question_region = resized_image[region_y:region_y+region_h, region_x:region_x+region_w]
            
            if question_region.size > 0:
                # Look for circular patterns (bubbles)
                circles = cv2.HoughCircles(
                    question_region, cv2.HOUGH_GRADIENT, 1, 20,
                    param1=50, param2=30, minRadius=10, maxRadius=25
                )
                
                if circles is not None and len(circles[0]) >= 2:
                    score += 1
                total_checks += 1
        
        # Normalize score
        return score / total_checks if total_checks > 0 else 0.0
    
    def create_template_from_image(self, image_path: str, template_name: str) -> OMRTemplate:
        """
        Create a new template by analyzing an image
        Interactive template creation with user guidance
        """
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape
        
        # Detect potential bubble regions using contour analysis
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours that look like bubbles
        bubble_candidates = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 200 <= area <= 2000:  # Reasonable bubble size
                # Check circularity
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    circularity = 4 * np.pi * area / (perimeter * perimeter)
                    if circularity > 0.6:
                        x, y, w, h = cv2.boundingRect(contour)
                        bubble_candidates.append((x, y, w, h, area))
        
        # Group bubbles into questions based on proximity
        bubble_candidates.sort(key=lambda b: (b[1], b[0]))  # Sort by y, then x
        
        # This is a simplified version - in practice, you'd want interactive GUI
        # for precise template creation
        
        questions = []
        current_y = -1
        current_question = 1
        current_bubbles = []
        
        for x, y, w, h, area in bubble_candidates:
            if abs(y - current_y) > 30:  # New row detected
                if current_bubbles:
                    # Create question from current bubbles
                    question = self._create_question_from_bubbles(
                        current_question, current_bubbles
                    )
                    questions.append(question)
                    current_question += 1
                
                current_bubbles = []
                current_y = y
            
            current_bubbles.append((x, y, w, h))
        
        # Add last question
        if current_bubbles:
            question = self._create_question_from_bubbles(current_question, current_bubbles)
            questions.append(question)
        
        # Create template
        template = OMRTemplate(
            name=template_name,
            description=f"Auto-generated template from {image_path}",
            total_questions=len(questions),
            questions_per_page=len(questions),
            options_per_question=4,  # Assume 4 options
            page_dimensions=(width, height),
            questions=questions,
            reference_points=[(50, 50), (width-50, 50), (width-50, height-50), (50, height-50)],
            set_indicators={'A': (width//2-100, 100, 200, 50), 'B': (width//2+100, 100, 200, 50)}
        )
        
        return template
    
    def _create_question_from_bubbles(self, question_num: int, bubble_coords: List[Tuple[int, int, int, int]]) -> QuestionTemplate:
        """Create a question template from bubble coordinates"""
        
        # Sort bubbles left to right
        bubble_coords.sort(key=lambda b: b[0])
        
        bubbles = []
        for i, (x, y, w, h) in enumerate(bubble_coords):
            bubble = BubbleTemplate(
                x=x,
                y=y,
                width=w,
                height=h,
                option_letter=chr(ord('a') + i),
                question_number=question_num
            )
            bubbles.append(bubble)
        
        # Calculate region bounds
        if bubbles:
            min_x = min(b.x for b in bubbles)
            max_x = max(b.x + b.width for b in bubbles)
            min_y = min(b.y for b in bubbles)
            max_y = max(b.y + b.height for b in bubbles)
            
            region_bounds = (min_x - 10, min_y - 10, max_x - min_x + 20, max_y - min_y + 20)
        else:
            region_bounds = (0, 0, 100, 50)
        
        question = QuestionTemplate(
            question_number=question_num,
            bubbles=bubbles,
            region_bounds=region_bounds,
            expected_answers=1
        )
        
        return question
    
    def get_template(self, name: str) -> Optional[OMRTemplate]:
        """Get template by name"""
        return self.templates.get(name)
    
    def list_templates(self) -> List[str]:
        """List all available template names"""
        return list(self.templates.keys())
    
    def visualize_template(self, template: OMRTemplate, output_path: str):
        """Create a visual representation of the template"""
        
        # Create blank image with template dimensions
        width, height = template.page_dimensions
        image = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Draw reference points
        for point in template.reference_points:
            cv2.circle(image, point, 10, (255, 0, 0), -1)
        
        # Draw questions and bubbles
        for question in template.questions:
            region_x, region_y, region_w, region_h = question.region_bounds
            
            # Draw question region
            cv2.rectangle(image, (region_x, region_y), 
                         (region_x + region_w, region_y + region_h), (0, 255, 0), 2)
            
            # Draw question number
            cv2.putText(image, str(question.question_number), 
                       (region_x + 5, region_y + 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            # Draw bubbles
            for bubble in question.bubbles:
                cv2.circle(image, (bubble.x + bubble.width//2, bubble.y + bubble.height//2), 
                          bubble.width//2, (0, 0, 255), 2)
                
                # Draw option letter
                cv2.putText(image, bubble.option_letter, 
                           (bubble.x + bubble.width//2 - 5, bubble.y + bubble.height//2 + 5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
        
        # Draw set indicators
        for set_name, (x, y, w, h) in template.set_indicators.items():
            cv2.rectangle(image, (x, y), (x + w, y + h), (255, 0, 255), 2)
            cv2.putText(image, f"SET {set_name}", (x + 5, y + h//2), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 255), 2)
        
        cv2.imwrite(output_path, image)
        logger.info(f"Template visualization saved: {output_path}")

# Example usage
if __name__ == "__main__":
    # Initialize template manager
    manager = OMRTemplateManager()
    
    # List available templates
    print("Available templates:", manager.list_templates())
    
    # Get standard template
    template = manager.get_template("standard_100q")
    if template:
        print(f"Template: {template.name}")
        print(f"Questions: {template.total_questions}")
        print(f"Dimensions: {template.page_dimensions}")
        
        # Create visualization
        manager.visualize_template(template, "template_visualization.jpg")
