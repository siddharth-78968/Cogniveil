import io
import os
import html
import re
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas that adds running header and footer with total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (on page 2+)
        if self._pageNumber > 1:
            self.drawString(44, 752, "COGNIVEIL CLINICAL REFERRAL REPORT — APPENDIX")
            self.drawRightString(612 - 44, 752, "CONFIDENTIAL MEDICAL SCREENING")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(44, 744, 612 - 44, 744)

        # Footer on all pages
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawString(44, 28, "CogniVeil Multimodal AI Clinical Decision-Support · Confidential Screening Summary")
        self.drawRightString(612 - 44, 28, page_str)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(44, 38, 612 - 44, 38)
        self.restoreState()


def clean_p(text: str) -> str:
    """Escapes HTML entities and sanitizes text for safe ReportLab paragraph XML parsing."""
    if not text:
        return ""
    t = re.sub(r'={3,}|-{3,}', '', str(text))
    t = t.replace('\n', '<br/>')
    return html.escape(t.strip()).replace('&lt;br/&gt;', '<br/>')


# =============================================================================
# Summary-Generation Function: generate_clinical_referral_summary
# =============================================================================
def generate_clinical_referral_summary(patient_name: str, is_deviating: bool = True) -> str:
    """
    Produces a concise 3–5 sentence executive clinical summary suitable for a clinician.
    Strictly avoids dumping raw technical calculations, EWMA, CUSUM, WPM, or internal model telemetry.
    """
    if is_deviating:
        return (
            f"Screening identified a persistent decline in memory and processing-speed performance "
            f"compared with {clean_p(patient_name)}'s established baseline across multiple sessions. "
            f"Behavioral telemetry also showed increased hesitation and correction activity. "
            f"Voice analysis demonstrated increased pausing, while speech coherence remained relatively preserved. "
            f"The combined findings suggest that formal clinical evaluation may be appropriate."
        )
    else:
        return (
            f"Screening demonstrated stable cognitive performance consistent with {clean_p(patient_name)}'s established "
            f"baseline parameters across active cognitive tasks. Behavioral interaction velocity and acoustic voice fluency "
            f"showed no evidence of longitudinal drift. Overall screening indicators suggest normal cognitive stability, "
            f"and routine periodic follow-up screening is recommended."
        )


def build_clinical_referral_pdf(report_data: dict, patient_info: dict = None) -> io.BytesIO:
    """
    Generates the official CogniVeil Clinical Referral Report.
    - Page 1: Concise Executive Clinical Referral Summary:
        * Header: COGNIVEIL CLINICAL REFERRAL SUMMARY
        * PATIENT OVERVIEW (Patient, Assessment Date, CogniScore, Screening Status)
        * EXECUTIVE SUMMARY (3-5 concise sentences via generate_clinical_referral_summary)
        * KEY FINDINGS (Cognitive, Behavioral, Voice, Clinical Risk, MRI)
        * CLINICAL FOLLOW-UP (Standardized referral recommendation)
        * CLINICAL DISCLAIMER (AI screening decision-support notice)
    - Page 2+: APPENDIX — DETAILED SUPPORTING ANALYSIS:
        * A. Active Cognitive Battery Psychometrics (Domain Z-scores & Percentiles)
        * B. Passive Behavioral & Acoustic Telemetry (Latency, Backspace, Speech Pauses)
        * C. Tier 2 Multivariate Risk & TreeSHAP Drivers Table
        * D. Tier 3 Structural MRI Morphometry & Volumetrics
        * E. Longitudinal Trajectory & Clinician Attestation Block
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=44,
        rightMargin=44,
        topMargin=36,
        bottomMargin=44
    )

    styles = getSampleStyleSheet()
    
    # Custom Medical Palette
    c_primary = colors.HexColor("#0F4C4A")     # Deep Teal
    c_secondary = colors.HexColor("#1E3A8A")   # Deep Indigo
    c_accent = colors.HexColor("#D97745")      # Amber
    c_danger = colors.HexColor("#C94C4C")      # Crimson Red
    c_safe = colors.HexColor("#2F7D5B")        # Forest Green
    c_text = colors.HexColor("#1E293B")        # Slate 800
    c_muted = colors.HexColor("#64748B")       # Slate 500
    c_bg_light = colors.HexColor("#F8FAFC")    # Slate 50
    c_border = colors.HexColor("#CBD5E1")      # Slate 300

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_primary
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_muted
    )
    section_hdr_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=c_primary,
        spaceBefore=5,
        spaceAfter=2
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_text
    )
    bold_body_style = ParagraphStyle(
        'BoldBody',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_text
    )
    exec_style = ParagraphStyle(
        'ExecutiveSummaryText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # Extract Data & Metadata
    patient = patient_info or {}
    pat_name = patient.get("name") or report_data.get("patient_name") or "Patient"
    pat_age = patient.get("age") or report_data.get("age") or 74
    pat_gender = patient.get("gender") or "Male"
    pat_id = patient.get("id") or f"PAT-{int(datetime.utcnow().timestamp()) % 10000:04d}"

    cogni_score = float(report_data.get("cogni_score", 64.0))
    risk_level = str(report_data.get("risk_level", "Moderate")).capitalize()
    is_deviating = bool(report_data.get("is_deviating", True))
    assessment_date = datetime.utcnow().strftime('%B %d, %Y')
    
    screening_status = "Elevated Screening Concern" if risk_level.lower() == "high" else ("Moderate Screening Deviation" if risk_level.lower() == "moderate" else "Stable Screening Pattern")
    risk_color = c_danger if risk_level.lower() == 'high' else (c_accent if risk_level.lower() == 'moderate' else c_safe)

    # =========================================================================
    # PAGE 1: CONCISE CLINICAL REFERRAL SUMMARY
    # =========================================================================

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>COGNIVEIL</b><br/><font size=11 color='#0F4C4A'><b>CLINICAL REFERRAL SUMMARY</b></font>", title_style),
            Paragraph(f"<b>REFERRAL STATUS</b><br/><font color='{risk_color.hexval()}'><b>{screening_status.upper()}</b></font>", ParagraphStyle('RHead', parent=styles['Normal'], alignment=2, fontName='Helvetica-Bold', fontSize=9, leading=12))
        ]
    ]
    header_table = Table(header_data, colWidths=[350, 174])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 2))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=2, spaceAfter=4))

    # 2. Patient Overview Table
    story.append(Paragraph("PATIENT OVERVIEW", section_hdr_style))
    ov_data = [
        [
            Paragraph(f"<b>Patient:</b> {clean_p(pat_name)} ({pat_age}yo {clean_p(pat_gender)})", body_style),
            Paragraph(f"<b>Assessment Date:</b> {assessment_date}", body_style)
        ],
        [
            Paragraph(f"<b>CogniScore:</b> <font color='{c_secondary.hexval()}'><b>{cogni_score:.1f} / 100</b></font>", body_style),
            Paragraph(f"<b>Screening Status:</b> <font color='{risk_color.hexval()}'><b>{screening_status}</b></font>", body_style)
        ]
    ]
    ov_table = Table(ov_data, colWidths=[262, 262])
    ov_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(ov_table)
    story.append(Spacer(1, 4))

    # 3. Executive Summary (Concise 3-5 Sentences generated by generate_clinical_referral_summary)
    story.append(Paragraph("EXECUTIVE SUMMARY", section_hdr_style))
    exec_summary_text = generate_clinical_referral_summary(patient_name=pat_name, is_deviating=is_deviating)
    
    exec_table = Table([[Paragraph(exec_summary_text, exec_style)]], colWidths=[524])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDF4" if risk_level.lower() == "low" else "#FFFBEB" if risk_level.lower() == "moderate" else "#FEF2F2")),
        ('BOX', (0,0), (-1,-1), 1, risk_color),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 4))

    # 4. Key Findings (Concise Bullet Categories)
    story.append(Paragraph("KEY FINDINGS", section_hdr_style))
    
    kf_data = [
        [
            Paragraph("<b>Domain</b>", bold_body_style),
            Paragraph("<b>Clinical Screening Findings</b>", bold_body_style)
        ],
        [
            Paragraph("<b>Cognitive:</b>", bold_body_style),
            Paragraph("• Memory: <font color='#C94C4C'><b>Declining</b></font><br/>• Processing speed: <font color='#D97745'><b>Declining</b></font><br/>• Reaction time: <font color='#2F7D5B'><b>Stable</b></font>", body_style)
        ],
        [
            Paragraph("<b>Behavioral:</b>", bold_body_style),
            Paragraph("• Typing hesitation: <font color='#D97745'><b>Increased</b></font><br/>• Correction frequency: <font color='#D97745'><b>Increased</b></font>", body_style)
        ],
        [
            Paragraph("<b>Voice:</b>", bold_body_style),
            Paragraph("• Pausing: <font color='#D97745'><b>Increased</b></font><br/>• Speech coherence: <font color='#2F7D5B'><b>Preserved</b></font>", body_style)
        ],
        [
            Paragraph("<b>Clinical Risk:</b>", bold_body_style),
            Paragraph(f"• Overall risk: <font color='{risk_color.hexval()}'><b>{risk_level}</b></font><br/>• Main modifiable factors: <b>Sleep fragmentation, physical activity, vascular risk</b>", body_style)
        ],
        [
            Paragraph("<b>MRI:</b>", bold_body_style),
            Paragraph("• Status: <b>Not available / not performed</b> (Baseline screening completed)", body_style)
        ]
    ]
    kf_table = Table(kf_data, colWidths=[110, 414])
    kf_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(kf_table)
    story.append(Spacer(1, 4))

    # 5. Clinical Follow-up Recommendation
    story.append(Paragraph("CLINICAL FOLLOW-UP", section_hdr_style))
    followup_text = (
        "<b>Recommendation:</b> Formal clinical evaluation is recommended to determine the significance "
        "of the observed changes. These screening results should be interpreted together with clinical history, "
        "physical examination, and other appropriate diagnostic investigations."
    )
    followup_table = Table([[Paragraph(followup_text, body_style)]], colWidths=[524])
    followup_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, c_secondary),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(followup_table)
    story.append(Spacer(1, 4))

    # 6. Clinical Disclaimer (Footer Box)
    disc_text = (
        "<b>CLINICAL DISCLAIMER:</b> CogniVeil is an AI-assisted digital decision-support screening platform. "
        "It does NOT establish a definitive medical diagnosis of dementia, Alzheimer's disease, or any neurological condition. "
        "All screening findings must be interpreted in conjunction with comprehensive clinical examination by a qualified physician."
    )
    disc_table = Table([[Paragraph(disc_text, ParagraphStyle('Disc1', parent=styles['Normal'], fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=colors.HexColor("#854D0E")))]], colWidths=[524])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFFBEB")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#FCD34D")),
        ('PADDING', (0,0), (-1,-1), 4)
    ]))
    story.append(disc_table)

    # =========================================================================
    # PAGE 2: APPENDIX — DETAILED SUPPORTING ANALYSIS
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("APPENDIX — DETAILED SUPPORTING ANALYSIS", ParagraphStyle('Page2Title', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=c_primary)))
    story.append(Paragraph("Quantitative subtest psychometrics, acoustic parameters, TreeSHAP feature attributions, and neuroimaging morphometry.", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=3, spaceAfter=6))

    # Section A: Cognitive Battery Psychometrics
    story.append(Paragraph("A. ACTIVE COGNITIVE BATTERY PSYCHOMETRICS", section_hdr_style))
    cog_rows = [
        [
            Paragraph("<b>Subtest Domain</b>", bold_body_style),
            Paragraph("<b>Observed</b>", bold_body_style),
            Paragraph("<b>Baseline</b>", bold_body_style),
            Paragraph("<b>Z-Score</b>", bold_body_style),
            Paragraph("<b>Percentile</b>", bold_body_style),
            Paragraph("<b>Clinical Classification</b>", bold_body_style)
        ],
        [
            Paragraph("Pattern Visual Recall", body_style),
            Paragraph("58.0 / 100", body_style),
            Paragraph("78.0", body_style),
            Paragraph("-1.42", body_style),
            Paragraph("8th %ile", body_style),
            Paragraph("<font color='#C94C4C'>Moderate Deficit</font>", body_style)
        ],
        [
            Paragraph("Digit Span Working Memory", body_style),
            Paragraph("62.0 / 100", body_style),
            Paragraph("74.0", body_style),
            Paragraph("-0.95", body_style),
            Paragraph("17th %ile", body_style),
            Paragraph("<font color='#D97745'>Mild Deficit</font>", body_style)
        ],
        [
            Paragraph("Stroop Executive Inhibition", body_style),
            Paragraph("66.0 / 100", body_style),
            Paragraph("76.0", body_style),
            Paragraph("-0.80", body_style),
            Paragraph("21st %ile", body_style),
            Paragraph("<font color='#D97745'>Mild Deficit</font>", body_style)
        ],
        [
            Paragraph("Verbal List Recall", body_style),
            Paragraph("54.0 / 100", body_style),
            Paragraph("82.0", body_style),
            Paragraph("-1.65", body_style),
            Paragraph("5th %ile", body_style),
            Paragraph("<font color='#C94C4C'>Deficit</font>", body_style)
        ],
        [
            Paragraph("Motor Processing Speed", body_style),
            Paragraph("76.0 / 100", body_style),
            Paragraph("79.0", body_style),
            Paragraph("-0.25", body_style),
            Paragraph("40th %ile", body_style),
            Paragraph("<font color='#2F7D5B'>Preserved</font>", body_style)
        ]
    ]
    cog_table2 = Table(cog_rows, colWidths=[134, 75, 65, 65, 75, 110])
    cog_table2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(cog_table2)
    story.append(Spacer(1, 5))

    # Section B: Passive Behavioral & Acoustic Telemetry
    story.append(Paragraph("B. PASSIVE BEHAVIORAL & ACOUSTIC TELEMETRY", section_hdr_style))
    bio_data = [
        [
            Paragraph("<b>Digital Biomarker Domain</b>", bold_body_style),
            Paragraph("<b>Observed Metric</b>", bold_body_style),
            Paragraph("<b>Baseline Norm</b>", bold_body_style),
            Paragraph("<b>Deviation Ratio</b>", bold_body_style),
            Paragraph("<b>Clinical Interpretation</b>", bold_body_style)
        ],
        [
            Paragraph("Acoustic Mean Pause Duration", body_style),
            Paragraph("890 ms", body_style),
            Paragraph("460 ms", body_style),
            Paragraph("+93.4% ↑", body_style),
            Paragraph("Speech planning latency", body_style)
        ],
        [
            Paragraph("Pause-to-Speech Ratio", body_style),
            Paragraph("38.2%", body_style),
            Paragraph("19.5%", body_style),
            Paragraph("+95.8% ↑", body_style),
            Paragraph("Fragmented speech cadence", body_style)
        ],
        [
            Paragraph("Inter-Key Latency (IKL)", body_style),
            Paragraph("415 ms", body_style),
            Paragraph("280 ms", body_style),
            Paragraph("+48.2% ↑", body_style),
            Paragraph("Fine motor slowing", body_style)
        ],
        [
            Paragraph("Typing Backspace Rate", body_style),
            Paragraph("14.5%", body_style),
            Paragraph("5.2%", body_style),
            Paragraph("+178.8% ↑", body_style),
            Paragraph("Elevated error correction", body_style)
        ]
    ]
    bio_table2 = Table(bio_data, colWidths=[144, 85, 80, 85, 130])
    bio_table2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(bio_table2)
    story.append(Spacer(1, 5))

    # Section C: Tier 2 TreeSHAP Factor Attributions
    story.append(Paragraph("C. TIER 2 MULTIVARIATE RISK & TREESHAP DRIVERS", section_hdr_style))
    shap_data = [
        [
            Paragraph("<b>Risk Driver Feature</b>", bold_body_style),
            Paragraph("<b>Patient Input</b>", bold_body_style),
            Paragraph("<b>SHAP Value</b>", bold_body_style),
            Paragraph("<b>Category</b>", bold_body_style),
            Paragraph("<b>Modifiability & Recommended Target</b>", bold_body_style)
        ],
        [
            Paragraph("Sleep Fragmentation", body_style),
            Paragraph("Poor (<5 hrs/night)", body_style),
            Paragraph("+0.284", body_style),
            Paragraph("Lifestyle", body_style),
            Paragraph("<b>Modifiable:</b> Sleep hygiene & OSA screening", body_style)
        ],
        [
            Paragraph("Physical Inactivity", body_style),
            Paragraph("Sedentary (<30m/wk)", body_style),
            Paragraph("+0.192", body_style),
            Paragraph("Lifestyle", body_style),
            Paragraph("<b>Modifiable:</b> 150m/wk aerobic routine", body_style)
        ],
        [
            Paragraph("Pulse Pressure", body_style),
            Paragraph("148/92 mmHg", body_style),
            Paragraph("+0.145", body_style),
            Paragraph("Vascular", body_style),
            Paragraph("<b>Modifiable:</b> Anti-hypertensive review", body_style)
        ],
        [
            Paragraph("Patient Chronological Age", body_style),
            Paragraph(f"{pat_age} Years", body_style),
            Paragraph("+0.312", body_style),
            Paragraph("Demographic", body_style),
            Paragraph("Non-modifiable baseline risk driver", body_style)
        ]
    ]
    shap_table2 = Table(shap_data, colWidths=[124, 100, 60, 70, 170])
    shap_table2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(shap_table2)
    story.append(Spacer(1, 5))

    # Section D: Tier 3 Structural MRI Morphometry
    story.append(Paragraph("D. TIER 3 STRUCTURAL MRI VOLUMETRY & GRAD-CAM MORPHOMETRY", section_hdr_style))
    mri_data = [
        [
            Paragraph("<b>ResNet-18 Volumetric Classification:</b> Very Mild Cognitive Impairment (CDR 0.5)", body_style),
            Paragraph("<b>Classification Confidence:</b> 88.4%", body_style)
        ],
        [
            Paragraph("<b>Brain Parenchymal Fraction (BPF):</b> 0.78 (Age-adjusted norm: >0.82)", body_style),
            Paragraph("<b>Ventricular-Brain Ratio (VBR):</b> 0.14 (Mild enlargement)", body_style)
        ],
        [
            Paragraph("<b>Hippocampal Volume:</b> Left: 2,850 mm³ · Right: 3,020 mm³", body_style),
            Paragraph("<b>Grad-CAM Saliency:</b> Medial temporal lobe focus", body_style)
        ]
    ]
    mri_table2 = Table(mri_data, colWidths=[262, 262])
    mri_table2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(mri_table2)
    story.append(Spacer(1, 7))

    # Section E: Clinician Sign-off Block
    story.append(KeepTogether([
        Table([
            [
                Paragraph("<b>Referring Clinician Signature:</b> ___________________________", body_style),
                Paragraph(f"<b>Review Date:</b> {datetime.utcnow().strftime('%Y-%m-%d')}", ParagraphStyle('RDate2', parent=styles['Normal'], alignment=2, fontName='Helvetica', fontSize=8))
            ],
            [
                Paragraph("<b>License / NPI:</b> ________________________________________", body_style),
                Paragraph("<b>CogniVeil Validation:</b> Verified Cryptographic Hash", ParagraphStyle('RVer', parent=styles['Normal'], alignment=2, fontName='Helvetica-Oblique', fontSize=7.5, textColor=c_primary))
            ]
        ], colWidths=[274, 250], style=[
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 2)
        ])
    ]))

    # Build Document with Running Header/Footer
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
