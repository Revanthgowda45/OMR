"""
Professional OMR System - Complete Integration
World-class OMR detection system combining all advanced components
Built for Code4Edtech Hackathon 2025 - Innomatics Research Labs
"""

import cv2
import numpy as np
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import streamlit as st
from concurrent.futures import ThreadPoolExecutor
import pandas as pd

# Import our custom modules
from omr_detection_engine import ProfessionalOMRDetector, OMRResult
from omr_template_config import OMRTemplateManager, OMRTemplate
from image_quality_enhancer import AdvancedImageEnhancer, EnhancementResult

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class ProcessingSession:
    """Complete OMR processing session data"""
    session_id: str
    timestamp: str
    images_processed: int
    total_processing_time: float
    average_quality_score: float
    results: List[Dict[str, Any]]
    batch_statistics: Dict[str, Any]

class ProfessionalOMRSystem:
    """
    Complete professional OMR processing system
    Integrates detection, enhancement, and template management
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the complete OMR system"""
        
        logger.info("Initializing Professional OMR System...")
        
        # Initialize components
        self.detector = ProfessionalOMRDetector(config_path)
        self.template_manager = OMRTemplateManager()
        self.image_enhancer = AdvancedImageEnhancer()
        
        # System configuration
        self.config = self._load_system_config(config_path)
        
        # Processing statistics
        self.processing_stats = {
            'total_processed': 0,
            'successful_processing': 0,
            'failed_processing': 0,
            'average_processing_time': 0.0,
            'average_quality_score': 0.0
        }
        
        # Results storage
        self.results_history = []
        
        logger.info("Professional OMR System initialized successfully!")
    
    def _load_system_config(self, config_path: Optional[str]) -> Dict:
        """Load system configuration"""
        default_config = {
            'processing': {
                'auto_enhance': True,
                'quality_threshold': 0.6,
                'confidence_threshold': 0.7,
                'batch_processing': True,
                'parallel_processing': True,
                'max_workers': 4
            },
            'output': {
                'save_debug_images': True,
                'generate_reports': True,
                'export_formats': ['json', 'csv', 'excel'],
                'results_directory': 'omr_results'
            },
            'quality_control': {
                'min_image_resolution': (800, 600),
                'max_file_size_mb': 50,
                'supported_formats': ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']
            }
        }
        
        if config_path and Path(config_path).exists():
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def process_single_image(self, image_path: str, template_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a single OMR image with complete pipeline
        Returns comprehensive results including quality metrics
        """
        start_time = time.time()
        
        try:
            logger.info(f"Processing image: {image_path}")
            
            # Step 1: Load and validate image
            image = self._load_and_validate_image(image_path)
            
            # Step 2: Enhance image quality if enabled
            enhancement_result = None
            if self.config['processing']['auto_enhance']:
                enhancement_result = self.image_enhancer.enhance_image(image)
                processed_image = enhancement_result.enhanced_image
            else:
                processed_image = image
            
            # Step 3: Detect or use specified template
            if template_name:
                template = self.template_manager.get_template(template_name)
                if not template:
                    raise ValueError(f"Template '{template_name}' not found")
            else:
                template = self.template_manager.detect_template(processed_image)
                if not template:
                    template = self.template_manager.get_template("standard_100q")
            
            # Step 4: Process OMR with detected template
            omr_result = self.detector.process_omr_sheet_with_template(
                processed_image, template
            )
            
            # Step 5: Quality control check
            quality_passed = self._quality_control_check(omr_result, enhancement_result)
            
            # Step 6: Generate comprehensive result
            processing_time = time.time() - start_time
            
            result = {
                'file_path': image_path,
                'processing_status': 'SUCCESS' if quality_passed else 'WARNING',
                'processing_time': processing_time,
                'template_used': template.name,
                'omr_results': asdict(omr_result),
                'enhancement_results': asdict(enhancement_result) if enhancement_result else None,
                'quality_passed': quality_passed,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Update statistics
            self._update_statistics(result)
            
            # Save debug images if enabled
            if self.config['output']['save_debug_images']:
                self._save_debug_images(image_path, processed_image, omr_result, template)
            
            logger.info(f"Successfully processed {image_path} in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            error_result = {
                'file_path': image_path,
                'processing_status': 'ERROR',
                'error_message': str(e),
                'processing_time': time.time() - start_time,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            logger.error(f"Failed to process {image_path}: {e}")
            return error_result
    
    def process_batch(self, image_paths: List[str], template_name: Optional[str] = None) -> ProcessingSession:
        """
        Process multiple OMR images in batch
        Supports parallel processing for efficiency
        """
        session_id = f"batch_{int(time.time())}"
        start_time = time.time()
        
        logger.info(f"Starting batch processing: {len(image_paths)} images")
        
        results = []
        
        if self.config['processing']['parallel_processing'] and len(image_paths) > 1:
            # Parallel processing
            with ThreadPoolExecutor(max_workers=self.config['processing']['max_workers']) as executor:
                future_to_path = {
                    executor.submit(self.process_single_image, path, template_name): path 
                    for path in image_paths
                }
                
                for future in future_to_path:
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        path = future_to_path[future]
                        logger.error(f"Batch processing error for {path}: {e}")
                        results.append({
                            'file_path': path,
                            'processing_status': 'ERROR',
                            'error_message': str(e)
                        })
        else:
            # Sequential processing
            for image_path in image_paths:
                result = self.process_single_image(image_path, template_name)
                results.append(result)
        
        # Calculate batch statistics
        total_time = time.time() - start_time
        successful = len([r for r in results if r['processing_status'] == 'SUCCESS'])
        failed = len([r for r in results if r['processing_status'] == 'ERROR'])
        
        # Calculate average quality score
        quality_scores = []
        for result in results:
            if result['processing_status'] == 'SUCCESS' and 'omr_results' in result:
                quality_scores.append(result['omr_results']['quality_metrics']['overall_quality'])
        
        avg_quality = np.mean(quality_scores) if quality_scores else 0.0
        
        batch_stats = {
            'total_images': len(image_paths),
            'successful': successful,
            'failed': failed,
            'success_rate': successful / len(image_paths) * 100,
            'total_processing_time': total_time,
            'average_time_per_image': total_time / len(image_paths),
            'average_quality_score': avg_quality
        }
        
        session = ProcessingSession(
            session_id=session_id,
            timestamp=time.strftime('%Y-%m-%d %H:%M:%S'),
            images_processed=len(image_paths),
            total_processing_time=total_time,
            average_quality_score=avg_quality,
            results=results,
            batch_statistics=batch_stats
        )
        
        # Save session results
        self._save_session_results(session)
        
        logger.info(f"Batch processing completed: {successful}/{len(image_paths)} successful")
        return session
    
    def _load_and_validate_image(self, image_path: str) -> np.ndarray:
        """Load and validate image file"""
        
        # Check file existence
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # Check file extension
        file_ext = Path(image_path).suffix.lower()
        if file_ext not in self.config['quality_control']['supported_formats']:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Check file size
        file_size_mb = Path(image_path).stat().st_size / (1024 * 1024)
        if file_size_mb > self.config['quality_control']['max_file_size_mb']:
            raise ValueError(f"File too large: {file_size_mb:.1f}MB")
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        # Check resolution
        height, width = image.shape[:2]
        min_width, min_height = self.config['quality_control']['min_image_resolution']
        
        if width < min_width or height < min_height:
            raise ValueError(f"Image resolution too low: {width}x{height}")
        
        return image
    
    def _quality_control_check(self, omr_result: OMRResult, 
                              enhancement_result: Optional[EnhancementResult]) -> bool:
        """Perform quality control checks on processing results"""
        
        # Check overall quality score
        if omr_result.quality_metrics.get('overall_quality', 0) < self.config['processing']['quality_threshold']:
            return False
        
        # Check confidence scores
        avg_confidence = np.mean(list(omr_result.confidence_scores.values()))
        if avg_confidence < self.config['processing']['confidence_threshold']:
            return False
        
        # Check for processing errors
        if omr_result.processing_status != 'SUCCESS':
            return False
        
        return True
    
    def _update_statistics(self, result: Dict[str, Any]):
        """Update system processing statistics"""
        
        self.processing_stats['total_processed'] += 1
        
        if result['processing_status'] == 'SUCCESS':
            self.processing_stats['successful_processing'] += 1
            
            # Update average processing time
            total_time = (self.processing_stats['average_processing_time'] * 
                         (self.processing_stats['successful_processing'] - 1) + 
                         result['processing_time'])
            self.processing_stats['average_processing_time'] = total_time / self.processing_stats['successful_processing']
            
            # Update average quality score
            if 'omr_results' in result:
                quality_score = result['omr_results']['quality_metrics'].get('overall_quality', 0)
                total_quality = (self.processing_stats['average_quality_score'] * 
                               (self.processing_stats['successful_processing'] - 1) + 
                               quality_score)
                self.processing_stats['average_quality_score'] = total_quality / self.processing_stats['successful_processing']
        else:
            self.processing_stats['failed_processing'] += 1
    
    def _save_debug_images(self, original_path: str, processed_image: np.ndarray, 
                          omr_result: OMRResult, template: OMRTemplate):
        """Save debug images for troubleshooting"""
        
        debug_dir = Path(self.config['output']['results_directory']) / 'debug_images'
        debug_dir.mkdir(parents=True, exist_ok=True)
        
        base_name = Path(original_path).stem
        
        # Save processed image
        cv2.imwrite(str(debug_dir / f"{base_name}_processed.jpg"), processed_image)
        
        # Create and save detection visualization
        visualization = self._create_detection_visualization(processed_image, omr_result, template)
        cv2.imwrite(str(debug_dir / f"{base_name}_detection.jpg"), visualization)
    
    def _create_detection_visualization(self, image: np.ndarray, 
                                     omr_result: OMRResult, template: OMRTemplate) -> np.ndarray:
        """Create visualization of detection results"""
        
        if len(image.shape) == 2:
            vis_image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        else:
            vis_image = image.copy()
        
        # Draw detected bubbles and answers
        for question_num, answers in omr_result.student_responses.items():
            if question_num <= len(template.questions):
                question_template = template.questions[question_num - 1]
                
                # Draw question region
                x, y, w, h = question_template.region_bounds
                cv2.rectangle(vis_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
                
                # Draw question number
                cv2.putText(vis_image, str(question_num), (x + 5, y + 20),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                # Draw detected answers
                if answers:
                    answer_text = ','.join(answers)
                    cv2.putText(vis_image, answer_text, (x + 5, y + h - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        return vis_image
    
    def _save_session_results(self, session: ProcessingSession):
        """Save session results in multiple formats"""
        
        results_dir = Path(self.config['output']['results_directory'])
        results_dir.mkdir(parents=True, exist_ok=True)
        
        # Save as JSON
        if 'json' in self.config['output']['export_formats']:
            json_path = results_dir / f"{session.session_id}_results.json"
            with open(json_path, 'w') as f:
                json.dump(asdict(session), f, indent=2, default=str)
        
        # Save as CSV
        if 'csv' in self.config['output']['export_formats']:
            csv_data = []
            for result in session.results:
                if result['processing_status'] == 'SUCCESS' and 'omr_results' in result:
                    omr_data = result['omr_results']
                    row = {
                        'file_path': result['file_path'],
                        'processing_time': result['processing_time'],
                        'total_score': omr_data['total_score'],
                        'detected_set': omr_data['detected_set'],
                        'quality_score': omr_data['quality_metrics'].get('overall_quality', 0)
                    }
                    
                    # Add subject scores
                    for subject, scores in omr_data['subject_scores'].items():
                        row[f'{subject}_score'] = scores['percentage']
                        row[f'{subject}_grade'] = scores['grade']
                    
                    csv_data.append(row)
            
            if csv_data:
                df = pd.DataFrame(csv_data)
                csv_path = results_dir / f"{session.session_id}_results.csv"
                df.to_csv(csv_path, index=False)
        
        # Save as Excel
        if 'excel' in self.config['output']['export_formats']:
            self._create_excel_report(session, results_dir)
    
    def _create_excel_report(self, session: ProcessingSession, output_dir: Path):
        """Create comprehensive Excel report"""
        
        excel_path = output_dir / f"{session.session_id}_comprehensive_report.xlsx"
        
        with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
            
            # Summary sheet
            summary_data = {
                'Metric': ['Total Images', 'Successful', 'Failed', 'Success Rate (%)', 
                          'Total Time (s)', 'Avg Time per Image (s)', 'Avg Quality Score'],
                'Value': [
                    session.batch_statistics['total_images'],
                    session.batch_statistics['successful'],
                    session.batch_statistics['failed'],
                    f"{session.batch_statistics['success_rate']:.1f}",
                    f"{session.batch_statistics['total_processing_time']:.2f}",
                    f"{session.batch_statistics['average_time_per_image']:.2f}",
                    f"{session.batch_statistics['average_quality_score']:.2f}"
                ]
            }
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Detailed results sheet
            detailed_data = []
            for result in session.results:
                if result['processing_status'] == 'SUCCESS' and 'omr_results' in result:
                    omr_data = result['omr_results']
                    
                    row = {
                        'File Path': result['file_path'],
                        'Processing Time (s)': result['processing_time'],
                        'Total Score (%)': omr_data['total_score'],
                        'Detected Set': omr_data['detected_set'],
                        'Quality Score': omr_data['quality_metrics'].get('overall_quality', 0)
                    }
                    
                    # Add subject scores
                    for subject, scores in omr_data['subject_scores'].items():
                        row[f'{subject} Score (%)'] = scores['percentage']
                        row[f'{subject} Grade'] = scores['grade']
                    
                    detailed_data.append(row)
            
            if detailed_data:
                detailed_df = pd.DataFrame(detailed_data)
                detailed_df.to_excel(writer, sheet_name='Detailed Results', index=False)
    
    def get_system_statistics(self) -> Dict[str, Any]:
        """Get current system processing statistics"""
        return self.processing_stats.copy()
    
    def create_streamlit_interface(self):
        """Create Streamlit web interface for the OMR system"""
        
        st.set_page_config(
            page_title="Professional OMR System",
            page_icon="📝",
            layout="wide"
        )
        
        st.title("🎯 Professional OMR Detection System")
        st.markdown("**World-class OMR processing for Code4Edtech Hackathon 2025**")
        
        # Sidebar for configuration
        st.sidebar.header("⚙️ Configuration")
        
        auto_enhance = st.sidebar.checkbox("Auto Image Enhancement", value=True)
        template_name = st.sidebar.selectbox(
            "Template", 
            ["Auto-detect"] + self.template_manager.list_templates()
        )
        
        # Main interface
        tab1, tab2, tab3, tab4 = st.tabs(["📤 Upload & Process", "📊 Results", "📈 Statistics", "🔧 System Info"])
        
        with tab1:
            st.header("Upload OMR Sheets")
            
            uploaded_files = st.file_uploader(
                "Choose OMR images", 
                accept_multiple_files=True,
                type=['jpg', 'jpeg', 'png', 'tiff', 'bmp']
            )
            
            if uploaded_files:
                if st.button("🚀 Process Images", type="primary"):
                    
                    # Save uploaded files temporarily
                    temp_paths = []
                    for uploaded_file in uploaded_files:
                        temp_path = f"temp_{uploaded_file.name}"
                        with open(temp_path, "wb") as f:
                            f.write(uploaded_file.getbuffer())
                        temp_paths.append(temp_path)
                    
                    # Process images
                    with st.spinner("Processing OMR sheets..."):
                        template = None if template_name == "Auto-detect" else template_name
                        session = self.process_batch(temp_paths, template)
                    
                    # Display results
                    st.success(f"✅ Processed {session.images_processed} images in {session.total_processing_time:.2f}s")
                    
                    # Show batch statistics
                    col1, col2, col3, col4 = st.columns(4)
                    
                    with col1:
                        st.metric("Success Rate", f"{session.batch_statistics['success_rate']:.1f}%")
                    
                    with col2:
                        st.metric("Avg Quality", f"{session.average_quality_score:.2f}")
                    
                    with col3:
                        st.metric("Avg Time/Image", f"{session.batch_statistics['average_time_per_image']:.2f}s")
                    
                    with col4:
                        st.metric("Total Time", f"{session.total_processing_time:.2f}s")
                    
                    # Store session in session state for other tabs
                    st.session_state['last_session'] = session
                    
                    # Clean up temp files
                    for temp_path in temp_paths:
                        Path(temp_path).unlink(missing_ok=True)
        
        with tab2:
            st.header("📊 Processing Results")
            
            if 'last_session' in st.session_state:
                session = st.session_state['last_session']
                
                # Results summary
                st.subheader("Results Summary")
                
                successful_results = [r for r in session.results if r['processing_status'] == 'SUCCESS']
                
                if successful_results:
                    # Create results DataFrame
                    results_data = []
                    for result in successful_results:
                        omr_data = result['omr_results']
                        
                        row = {
                            'File': Path(result['file_path']).name,
                            'Total Score (%)': f"{omr_data['total_score']:.1f}",
                            'Set': omr_data['detected_set'],
                            'Quality': f"{omr_data['quality_metrics'].get('overall_quality', 0):.2f}",
                            'Time (s)': f"{result['processing_time']:.2f}"
                        }
                        
                        # Add subject scores
                        for subject, scores in omr_data['subject_scores'].items():
                            row[f'{subject} (%)'] = f"{scores['percentage']:.1f}"
                        
                        results_data.append(row)
                    
                    results_df = pd.DataFrame(results_data)
                    st.dataframe(results_df, use_container_width=True)
                    
                    # Download results
                    csv = results_df.to_csv(index=False)
                    st.download_button(
                        "📥 Download Results (CSV)",
                        csv,
                        f"omr_results_{session.session_id}.csv",
                        "text/csv"
                    )
                
                else:
                    st.warning("No successful results to display")
            
            else:
                st.info("No results available. Please process some images first.")
        
        with tab3:
            st.header("📈 System Statistics")
            
            stats = self.get_system_statistics()
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric("Total Processed", stats['total_processed'])
                st.metric("Successful", stats['successful_processing'])
                st.metric("Failed", stats['failed_processing'])
            
            with col2:
                success_rate = (stats['successful_processing'] / max(stats['total_processed'], 1)) * 100
                st.metric("Success Rate", f"{success_rate:.1f}%")
                st.metric("Avg Processing Time", f"{stats['average_processing_time']:.2f}s")
                st.metric("Avg Quality Score", f"{stats['average_quality_score']:.2f}")
        
        with tab4:
            st.header("🔧 System Information")
            
            st.subheader("Available Templates")
            templates = self.template_manager.list_templates()
            for template_name in templates:
                template = self.template_manager.get_template(template_name)
                st.write(f"**{template.name}**: {template.description}")
            
            st.subheader("System Configuration")
            st.json(self.config)

# Example usage and main execution
if __name__ == "__main__":
    
    # Initialize the professional OMR system
    omr_system = ProfessionalOMRSystem()
    
    # Check if running in Streamlit
    try:
        import streamlit as st
        # Create Streamlit interface
        omr_system.create_streamlit_interface()
    
    except ImportError:
        # Command line interface
        print("🎯 Professional OMR System - Command Line Interface")
        print("=" * 50)
        
        # Example batch processing
        sample_images = [
            "sample_omr_1.jpg",
            "sample_omr_2.jpg", 
            "sample_omr_3.jpg"
        ]
        
        # Filter existing images
        existing_images = [img for img in sample_images if Path(img).exists()]
        
        if existing_images:
            print(f"Processing {len(existing_images)} sample images...")
            session = omr_system.process_batch(existing_images)
            
            print(f"\n✅ Batch Processing Complete!")
            print(f"Session ID: {session.session_id}")
            print(f"Images Processed: {session.images_processed}")
            print(f"Success Rate: {session.batch_statistics['success_rate']:.1f}%")
            print(f"Average Quality: {session.average_quality_score:.2f}")
            print(f"Total Time: {session.total_processing_time:.2f}s")
            
        else:
            print("No sample images found. System ready for processing!")
            print("\nTo use the system:")
            print("1. Place OMR images in the current directory")
            print("2. Run: python professional_omr_system.py")
            print("3. Or use: streamlit run professional_omr_system.py")
        
        print(f"\n📊 System Statistics:")
        stats = omr_system.get_system_statistics()
        for key, value in stats.items():
            print(f"  {key}: {value}")
