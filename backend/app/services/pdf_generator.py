"""
PDF generation service for creating professional policy documents.
Uses ReportLab for high-quality PDF generation with proper formatting.
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Image
)
from reportlab.lib import colors
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import re


class PDFGenerator:
    """
    Generates professional policy PDF documents with proper formatting.
    """
    
    def __init__(self, output_path: str, company_name: str):
        """
        Initialize PDF generator.
        
        Args:
            output_path: Path where PDF will be saved
            company_name: Name of the company for the document
        """
        self.output_path = output_path
        self.company_name = company_name
        
        # Create document
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Story will hold all flowables
        self.story = []
        
        # Setup styles
        self._setup_styles()
        
        # Page counter for footer
        self.page_count = 0
    
    def _setup_styles(self):
        """Setup custom styles for the document."""
        self.styles = getSampleStyleSheet()
        
        # Custom title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1F4788'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Custom heading styles
        self.styles.add(ParagraphStyle(
            name='CustomHeading1',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1F4788'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2E5C8A'),
            spaceAfter=10,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading3',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#3D6FA3'),
            spaceAfter=8,
            spaceBefore=8,
            fontName='Helvetica-Bold'
        ))
        
        # Custom body style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=11,
            leading=16,
            alignment=TA_JUSTIFY,
            spaceAfter=10
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
            alignment=TA_CENTER
        ))
    
    def add_cover_page(self, title: str, subtitle: str = None):
        """Add a cover page to the document."""
        # Add spacing from top
        self.story.append(Spacer(1, 2*inch))
        
        # Main title
        title_para = Paragraph(title, self.styles['CustomTitle'])
        self.story.append(title_para)
        self.story.append(Spacer(1, 0.3*inch))
        
        # Subtitle if provided
        if subtitle:
            subtitle_para = Paragraph(subtitle, self.styles['Heading2'])
            self.story.append(subtitle_para)
            self.story.append(Spacer(1, 0.5*inch))
        
        # Company name
        company_style = ParagraphStyle(
            name='Company',
            fontSize=16,
            textColor=colors.HexColor('#1F4788'),
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        company_para = Paragraph(self.company_name, company_style)
        self.story.append(company_para)
        self.story.append(Spacer(1, 0.5*inch))
        
        # Date
        date_str = datetime.now().strftime("%B %d, %Y")
        date_para = Paragraph(f"Generated: {date_str}", self.styles['Normal'])
        self.story.append(date_para)
        
        # Page break
        self.story.append(PageBreak())
    
    def add_table_of_contents(self, sections: List[str]):
        """Add table of contents."""
        # TOC Title
        toc_title = Paragraph("Table of Contents", self.styles['CustomHeading1'])
        self.story.append(toc_title)
        self.story.append(Spacer(1, 0.2*inch))
        
        # TOC entries
        for i, section in enumerate(sections, 1):
            toc_entry = f"{i}. {section}"
            toc_para = Paragraph(toc_entry, self.styles['CustomBody'])
            self.story.append(toc_para)
        
        self.story.append(PageBreak())
    
    def parse_and_add_markdown_content(self, content: str):
        """
        Parse markdown-style content and add to PDF.
        Supports: # headers, ## subheaders, ### sub-subheaders, paragraphs, lists
        """
        lines = content.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            if not line:
                i += 1
                continue
            
            # Check for headers
            if line.startswith('# '):
                text = line[2:].strip()
                para = Paragraph(text, self.styles['CustomHeading1'])
                self.story.append(para)
                self.story.append(Spacer(1, 0.15*inch))
            
            elif line.startswith('## '):
                text = line[3:].strip()
                para = Paragraph(text, self.styles['CustomHeading2'])
                self.story.append(para)
                self.story.append(Spacer(1, 0.1*inch))
            
            elif line.startswith('### '):
                text = line[4:].strip()
                para = Paragraph(text, self.styles['CustomHeading3'])
                self.story.append(para)
                self.story.append(Spacer(1, 0.08*inch))
            
            # Check for bullet points
            elif line.startswith('- ') or line.startswith('* '):
                text = line[2:].strip()
                bullet_text = f"• {text}"
                para = Paragraph(bullet_text, self.styles['CustomBody'])
                self.story.append(para)
            
            # Check for numbered lists
            elif re.match(r'^\d+\.\s', line):
                para = Paragraph(line, self.styles['CustomBody'])
                self.story.append(para)
            
            # Regular paragraph
            else:
                # Collect multi-line paragraph
                para_lines = [line]
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    if (not next_line or 
                        next_line.startswith('#') or 
                        next_line.startswith('-') or 
                        next_line.startswith('*') or
                        re.match(r'^\d+\.\s', next_line)):
                        break
                    para_lines.append(next_line)
                    j += 1
                
                full_para = ' '.join(para_lines)
                if full_para:
                    para = Paragraph(full_para, self.styles['CustomBody'])
                    self.story.append(para)
                    self.story.append(Spacer(1, 0.08*inch))
                
                i = j - 1
            
            i += 1
    
    def add_section(self, section_title: str, content: str):
        """Add a complete section to the document."""
        # Section title
        title_para = Paragraph(section_title, self.styles['CustomHeading1'])
        self.story.append(title_para)
        self.story.append(Spacer(1, 0.2*inch))
        
        # Parse and add content
        self.parse_and_add_markdown_content(content)
        
        # Add page break after section
        self.story.append(PageBreak())
    
    def add_footer(self, canvas, doc):
        """Add page footer with page numbers."""
        canvas.saveState()
        
        # Page number
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.grey)
        canvas.drawCentredString(
            letter[0] / 2.0,
            0.5 * inch,
            text
        )
        
        # Company name in footer
        canvas.setFont('Helvetica', 8)
        canvas.drawCentredString(
            letter[0] / 2.0,
            0.3 * inch,
            f"{self.company_name} - Confidential"
        )
        
        canvas.restoreState()
    
    def generate(self) -> str:
        """
        Generate the PDF document.
        
        Returns:
            Path to the generated PDF
        """
        # Build PDF with footer
        self.doc.build(
            self.story,
            onFirstPage=self.add_footer,
            onLaterPages=self.add_footer
        )
        
        return self.output_path


class PolicyPDFGenerator:
    """
    Specialized PDF generator for policy documents.
    Handles the complete policy structure.
    """
    
    # Default policy sections structure
    DEFAULT_SECTIONS = [
        {
            'title': 'Executive Summary',
            'description': 'High-level overview of the policy document and its importance'
        },
        {
            'title': 'Purpose & Scope',
            'description': 'Define the purpose of these policies and who they apply to'
        },
        {
            'title': 'Governance & Organizational Roles',
            'description': 'Define governance structure, key roles, and responsibilities'
        },
        {
            'title': 'Data Protection & Security Policies',
            'description': 'Comprehensive data protection, privacy, and security guidelines'
        },
        {
            'title': 'Employee Conduct & Compliance',
            'description': 'Code of conduct, ethics, and compliance requirements'
        },
        {
            'title': 'Remote Work & Operational Policies',
            'description': 'Remote work guidelines, operational procedures, and best practices'
        },
        {
            'title': 'Vendor & Third-Party Management',
            'description': 'Policies for managing vendors and third-party relationships'
        },
        {
            'title': 'Incident Reporting & Response',
            'description': 'Procedures for reporting and responding to incidents'
        },
        {
            'title': 'Audit, Review & Continuous Improvement',
            'description': 'Framework for auditing compliance and continuous improvement'
        },
        {
            'title': 'Future Outlook & Recommendations',
            'description': 'Forward-looking recommendations and policy evolution'
        }
    ]
    
    @staticmethod
    def create_policy_document(
        output_path: str,
        company_name: str,
        policy_title: str,
        sections_content: Dict[str, str],
        include_toc: bool = True
    ) -> str:
        """
        Create a complete policy document.
        
        Args:
            output_path: Where to save the PDF
            company_name: Company name
            policy_title: Title of the policy document
            sections_content: Dictionary mapping section titles to their content
            include_toc: Whether to include table of contents
            
        Returns:
            Path to generated PDF
        """
        # Create PDF generator
        pdf_gen = PDFGenerator(output_path, company_name)
        
        # Add cover page
        pdf_gen.add_cover_page(
            title=policy_title,
            subtitle="Organizational Policy Document"
        )
        
        # Add table of contents if requested
        if include_toc:
            section_titles = list(sections_content.keys())
            pdf_gen.add_table_of_contents(section_titles)
        
        # Add all sections
        for section_title, content in sections_content.items():
            pdf_gen.add_section(section_title, content)
        
        # Generate PDF
        return pdf_gen.generate()
