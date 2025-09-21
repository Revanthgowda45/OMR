"""
Advanced Image Quality Enhancement for OMR Processing
Professional-grade image preprocessing and quality assessment
Handles real-world challenges: poor lighting, skew, noise, shadows
"""

import cv2
import numpy as np
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass
import logging
from scipy import ndimage
from skimage import filters, morphology, measure
import math

logger = logging.getLogger(__name__)

@dataclass
class QualityMetrics:
    """Image quality assessment metrics"""
    sharpness_score: float
    contrast_score: float
    brightness_score: float
    noise_level: float
    skew_angle: float
    overall_quality: float
    recommendations: List[str]

@dataclass
class EnhancementResult:
    """Result of image enhancement process"""
    enhanced_image: np.ndarray
    quality_before: QualityMetrics
    quality_after: QualityMetrics
    applied_enhancements: List[str]
    processing_time: float

class AdvancedImageEnhancer:
    """
    Professional image enhancement system for OMR sheets
    Implements state-of-the-art computer vision techniques
    """
    
    def __init__(self):
        self.enhancement_pipeline = [
            'noise_reduction',
            'skew_correction',
            'lighting_normalization',
            'contrast_enhancement',
            'sharpening',
            'shadow_removal'
        ]
        
        # Enhancement parameters
        self.params = {
            'noise_reduction': {
                'bilateral_d': 9,
                'bilateral_sigma_color': 75,
                'bilateral_sigma_space': 75,
                'gaussian_kernel': (3, 3),
                'median_kernel': 3
            },
            'skew_correction': {
                'angle_threshold': 0.5,  # degrees
                'hough_threshold': 100,
                'min_line_length': 100,
                'max_line_gap': 10
            },
            'contrast': {
                'clahe_clip_limit': 3.0,
                'clahe_tile_size': (8, 8),
                'gamma_range': (0.5, 2.0)
            },
            'sharpening': {
                'kernel_type': 'unsharp_mask',
                'amount': 1.5,
                'radius': 1.0,
                'threshold': 0
            }
        }
    
    def enhance_image(self, image: np.ndarray, auto_enhance: bool = True) -> EnhancementResult:
        """
        Main enhancement pipeline
        Automatically detects and applies appropriate enhancements
        """
        start_time = cv2.getTickCount()
        
        # Assess initial quality
        quality_before = self.assess_image_quality(image)
        
        enhanced_image = image.copy()
        applied_enhancements = []
        
        if auto_enhance:
            # Apply enhancements based on quality assessment
            if quality_before.noise_level > 0.3:
                enhanced_image = self.reduce_noise(enhanced_image)
                applied_enhancements.append('noise_reduction')
            
            if abs(quality_before.skew_angle) > 0.5:
                enhanced_image = self.correct_skew(enhanced_image)
                applied_enhancements.append('skew_correction')
            
            if quality_before.brightness_score < 0.4 or quality_before.brightness_score > 0.8:
                enhanced_image = self.normalize_lighting(enhanced_image)
                applied_enhancements.append('lighting_normalization')
            
            if quality_before.contrast_score < 0.5:
                enhanced_image = self.enhance_contrast(enhanced_image)
                applied_enhancements.append('contrast_enhancement')
            
            if quality_before.sharpness_score < 0.6:
                enhanced_image = self.sharpen_image(enhanced_image)
                applied_enhancements.append('sharpening')
            
            # Always apply shadow removal for OMR sheets
            enhanced_image = self.remove_shadows(enhanced_image)
            applied_enhancements.append('shadow_removal')
        
        # Assess final quality
        quality_after = self.assess_image_quality(enhanced_image)
        
        # Calculate processing time
        end_time = cv2.getTickCount()
        processing_time = (end_time - start_time) / cv2.getTickFrequency()
        
        result = EnhancementResult(
            enhanced_image=enhanced_image,
            quality_before=quality_before,
            quality_after=quality_after,
            applied_enhancements=applied_enhancements,
            processing_time=processing_time
        )
        
        logger.info(f"Image enhancement completed in {processing_time:.3f}s")
        logger.info(f"Quality improvement: {quality_after.overall_quality - quality_before.overall_quality:.2f}")
        
        return result
    
    def assess_image_quality(self, image: np.ndarray) -> QualityMetrics:
        """
        Comprehensive image quality assessment
        Returns detailed metrics for enhancement decisions
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Sharpness assessment using Laplacian variance
        sharpness_score = self._calculate_sharpness(gray)
        
        # Contrast assessment using standard deviation
        contrast_score = self._calculate_contrast(gray)
        
        # Brightness assessment
        brightness_score = self._calculate_brightness(gray)
        
        # Noise level assessment
        noise_level = self._calculate_noise_level(gray)
        
        # Skew angle detection
        skew_angle = self._detect_skew_angle(gray)
        
        # Overall quality score (weighted combination)
        overall_quality = (
            sharpness_score * 0.3 +
            contrast_score * 0.25 +
            (1.0 - abs(brightness_score - 0.5) * 2) * 0.2 +
            (1.0 - noise_level) * 0.15 +
            (1.0 - abs(skew_angle) / 10.0) * 0.1
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            sharpness_score, contrast_score, brightness_score, noise_level, skew_angle
        )
        
        return QualityMetrics(
            sharpness_score=sharpness_score,
            contrast_score=contrast_score,
            brightness_score=brightness_score,
            noise_level=noise_level,
            skew_angle=skew_angle,
            overall_quality=overall_quality,
            recommendations=recommendations
        )
    
    def _calculate_sharpness(self, gray: np.ndarray) -> float:
        """Calculate image sharpness using Laplacian variance"""
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        
        # Normalize to 0-1 range (empirically determined thresholds)
        normalized = min(variance / 1000.0, 1.0)
        return normalized
    
    def _calculate_contrast(self, gray: np.ndarray) -> float:
        """Calculate image contrast using standard deviation"""
        std_dev = np.std(gray)
        
        # Normalize to 0-1 range
        normalized = min(std_dev / 128.0, 1.0)
        return normalized
    
    def _calculate_brightness(self, gray: np.ndarray) -> float:
        """Calculate average brightness (0=dark, 1=bright)"""
        mean_brightness = np.mean(gray)
        return mean_brightness / 255.0
    
    def _calculate_noise_level(self, gray: np.ndarray) -> float:
        """Estimate noise level using high-frequency content"""
        # Apply high-pass filter to detect noise
        kernel = np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])
        filtered = cv2.filter2D(gray, -1, kernel)
        
        # Calculate noise as variance of high-frequency content
        noise_variance = np.var(filtered)
        
        # Normalize to 0-1 range
        normalized = min(noise_variance / 10000.0, 1.0)
        return normalized
    
    def _detect_skew_angle(self, gray: np.ndarray) -> float:
        """Detect document skew angle using Hough line transform"""
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Hough line transform
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
        
        if lines is not None:
            angles = []
            
            for rho, theta in lines[:, 0]:
                angle = theta * 180 / np.pi
                
                # Convert to skew angle (-90 to 90 degrees)
                if angle > 90:
                    angle = angle - 180
                elif angle < -90:
                    angle = angle + 180
                
                # Filter out vertical and horizontal lines
                if abs(angle) > 5 and abs(angle) < 85:
                    angles.append(angle)
            
            if angles:
                # Return median angle to reduce outlier influence
                return np.median(angles)
        
        return 0.0  # No skew detected
    
    def _generate_recommendations(self, sharpness: float, contrast: float, 
                                brightness: float, noise: float, skew: float) -> List[str]:
        """Generate enhancement recommendations based on quality metrics"""
        recommendations = []
        
        if sharpness < 0.4:
            recommendations.append("Apply sharpening filter")
        
        if contrast < 0.3:
            recommendations.append("Enhance contrast using CLAHE")
        
        if brightness < 0.3:
            recommendations.append("Increase brightness")
        elif brightness > 0.8:
            recommendations.append("Reduce brightness")
        
        if noise > 0.4:
            recommendations.append("Apply noise reduction")
        
        if abs(skew) > 1.0:
            recommendations.append("Correct document skew")
        
        if not recommendations:
            recommendations.append("Image quality is acceptable")
        
        return recommendations
    
    def reduce_noise(self, image: np.ndarray) -> np.ndarray:
        """Advanced noise reduction using multiple techniques"""
        
        if len(image.shape) == 3:
            # Color image - use bilateral filter
            denoised = cv2.bilateralFilter(
                image,
                self.params['noise_reduction']['bilateral_d'],
                self.params['noise_reduction']['bilateral_sigma_color'],
                self.params['noise_reduction']['bilateral_sigma_space']
            )
        else:
            # Grayscale image - use combination of filters
            # Gaussian blur for general noise
            gaussian = cv2.GaussianBlur(
                image, 
                self.params['noise_reduction']['gaussian_kernel'], 
                0
            )
            
            # Median filter for salt-and-pepper noise
            median = cv2.medianBlur(
                image, 
                self.params['noise_reduction']['median_kernel']
            )
            
            # Combine filters
            denoised = cv2.addWeighted(gaussian, 0.7, median, 0.3, 0)
        
        return denoised
    
    def correct_skew(self, image: np.ndarray) -> np.ndarray:
        """Correct document skew using rotation"""
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Detect skew angle
        skew_angle = self._detect_skew_angle(gray)
        
        if abs(skew_angle) > self.params['skew_correction']['angle_threshold']:
            # Calculate rotation matrix
            height, width = image.shape[:2]
            center = (width // 2, height // 2)
            
            rotation_matrix = cv2.getRotationMatrix2D(center, skew_angle, 1.0)
            
            # Apply rotation
            corrected = cv2.warpAffine(
                image, rotation_matrix, (width, height),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
            
            logger.info(f"Corrected skew angle: {skew_angle:.2f} degrees")
            return corrected
        
        return image
    
    def normalize_lighting(self, image: np.ndarray) -> np.ndarray:
        """Normalize lighting using adaptive techniques"""
        
        if len(image.shape) == 3:
            # Convert to LAB color space for better lighting control
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel = lab[:, :, 0]
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(
                clipLimit=self.params['contrast']['clahe_clip_limit'],
                tileGridSize=self.params['contrast']['clahe_tile_size']
            )
            l_channel = clahe.apply(l_channel)
            
            # Merge channels back
            lab[:, :, 0] = l_channel
            normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            # Grayscale image
            clahe = cv2.createCLAHE(
                clipLimit=self.params['contrast']['clahe_clip_limit'],
                tileGridSize=self.params['contrast']['clahe_tile_size']
            )
            normalized = clahe.apply(image)
        
        return normalized
    
    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance image contrast using multiple techniques"""
        
        # Method 1: Histogram equalization
        if len(image.shape) == 3:
            # Convert to YUV and equalize Y channel
            yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
            yuv[:, :, 0] = cv2.equalizeHist(yuv[:, :, 0])
            equalized = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
        else:
            equalized = cv2.equalizeHist(image)
        
        # Method 2: Gamma correction
        gamma = 1.2  # Adjust based on image characteristics
        gamma_corrected = np.power(image / 255.0, gamma) * 255.0
        gamma_corrected = gamma_corrected.astype(np.uint8)
        
        # Combine methods
        enhanced = cv2.addWeighted(equalized, 0.6, gamma_corrected, 0.4, 0)
        
        return enhanced
    
    def sharpen_image(self, image: np.ndarray) -> np.ndarray:
        """Apply advanced sharpening techniques"""
        
        # Unsharp masking
        gaussian = cv2.GaussianBlur(image, (0, 0), self.params['sharpening']['radius'])
        sharpened = cv2.addWeighted(
            image, 1.0 + self.params['sharpening']['amount'],
            gaussian, -self.params['sharpening']['amount'],
            0
        )
        
        # Alternative: Laplacian sharpening
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian = np.uint8(np.absolute(laplacian))
        
        if len(image.shape) == 3:
            laplacian = cv2.cvtColor(laplacian, cv2.COLOR_GRAY2BGR)
        
        # Combine sharpening methods
        final_sharpened = cv2.addWeighted(sharpened, 0.8, laplacian, 0.2, 0)
        
        return final_sharpened
    
    def remove_shadows(self, image: np.ndarray) -> np.ndarray:
        """Remove shadows and uneven illumination"""
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Create background model using morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
        background = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
        
        # Smooth the background
        background = cv2.GaussianBlur(background, (5, 5), 0)
        
        # Subtract background to remove shadows
        shadow_removed = cv2.divide(gray, background, scale=255)
        
        # Apply additional contrast enhancement
        shadow_removed = cv2.equalizeHist(shadow_removed)
        
        if len(image.shape) == 3:
            # Convert back to color if needed
            shadow_removed = cv2.cvtColor(shadow_removed, cv2.COLOR_GRAY2BGR)
        
        return shadow_removed
    
    def adaptive_threshold(self, image: np.ndarray) -> np.ndarray:
        """Apply adaptive thresholding optimized for OMR sheets"""
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Method 1: Adaptive Gaussian threshold
        adaptive_gaussian = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Method 2: Adaptive Mean threshold
        adaptive_mean = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Method 3: Otsu's threshold
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Combine methods for robust thresholding
        combined = cv2.bitwise_and(adaptive_gaussian, adaptive_mean)
        combined = cv2.bitwise_and(combined, otsu)
        
        # Clean up with morphological operations
        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
        
        return cleaned
    
    def detect_and_enhance_bubbles(self, image: np.ndarray) -> np.ndarray:
        """Specifically enhance bubble regions for better detection"""
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply Gaussian blur to smooth noise
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Enhance circular features using morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        enhanced = cv2.morphologyEx(blurred, cv2.MORPH_TOPHAT, kernel)
        
        # Combine with original
        bubble_enhanced = cv2.add(gray, enhanced)
        
        # Apply sharpening specifically for bubble edges
        kernel_sharpen = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(bubble_enhanced, -1, kernel_sharpen)
        
        return sharpened
    
    def create_quality_report(self, result: EnhancementResult) -> Dict:
        """Create detailed quality assessment report"""
        
        report = {
            'processing_summary': {
                'processing_time': f"{result.processing_time:.3f}s",
                'enhancements_applied': result.applied_enhancements,
                'quality_improvement': result.quality_after.overall_quality - result.quality_before.overall_quality
            },
            'quality_before': {
                'overall_score': f"{result.quality_before.overall_quality:.2f}",
                'sharpness': f"{result.quality_before.sharpness_score:.2f}",
                'contrast': f"{result.quality_before.contrast_score:.2f}",
                'brightness': f"{result.quality_before.brightness_score:.2f}",
                'noise_level': f"{result.quality_before.noise_level:.2f}",
                'skew_angle': f"{result.quality_before.skew_angle:.2f}°"
            },
            'quality_after': {
                'overall_score': f"{result.quality_after.overall_quality:.2f}",
                'sharpness': f"{result.quality_after.sharpness_score:.2f}",
                'contrast': f"{result.quality_after.contrast_score:.2f}",
                'brightness': f"{result.quality_after.brightness_score:.2f}",
                'noise_level': f"{result.quality_after.noise_level:.2f}",
                'skew_angle': f"{result.quality_after.skew_angle:.2f}°"
            },
            'recommendations': {
                'before': result.quality_before.recommendations,
                'after': result.quality_after.recommendations
            }
        }
        
        return report

# Example usage and testing
if __name__ == "__main__":
    # Initialize enhancer
    enhancer = AdvancedImageEnhancer()
    
    # Example usage (uncomment when you have test images)
    # image = cv2.imread("test_omr_sheet.jpg")
    # result = enhancer.enhance_image(image)
    # 
    # print("Enhancement Report:")
    # report = enhancer.create_quality_report(result)
    # print(json.dumps(report, indent=2))
    # 
    # # Save enhanced image
    # cv2.imwrite("enhanced_omr_sheet.jpg", result.enhanced_image)
    
    print("Advanced Image Enhancer initialized successfully!")
    print("Available enhancement methods:")
    print("- Noise reduction")
    print("- Skew correction") 
    print("- Lighting normalization")
    print("- Contrast enhancement")
    print("- Image sharpening")
    print("- Shadow removal")
    print("- Adaptive thresholding")
    print("- Bubble-specific enhancement")
