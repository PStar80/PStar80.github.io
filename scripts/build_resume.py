"""Build the public resume with ReportLab and Open Sans TTFs.

Run from any directory. Set RESUME_FONT_DIR when Open Sans is installed elsewhere.
"""
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "paul-sattaur-resume.pdf"
INK = colors.HexColor("#182538")
BLUE = colors.HexColor("#1764AB")
MUTED = colors.HexColor("#536174")
RULE = colors.HexColor("#D9E2EB")

# Embed actual font files so PDF viewers do not substitute their own Helvetica.
FONT_DIR = Path(os.environ.get("RESUME_FONT_DIR", "/usr/share/fonts/truetype/open-sans"))
pdfmetrics.registerFont(TTFont("ResumeSans", str(FONT_DIR / "OpenSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("ResumeSansBold", str(FONT_DIR / "OpenSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("ResumeSansItalic", str(FONT_DIR / "OpenSans-Italic.ttf")))
pdfmetrics.registerFontFamily("ResumeSans", normal="ResumeSans", bold="ResumeSansBold",
    italic="ResumeSansItalic", boldItalic="ResumeSansBold")

styles = {
    "name": ParagraphStyle("Name", fontName="Helvetica-Bold", fontSize=29,
        leading=33, textColor=INK, spaceAfter=6),
    "position": ParagraphStyle("Position", fontName="Helvetica-Bold", fontSize=11.6,
        leading=16, textColor=BLUE, spaceAfter=10),
    "contact": ParagraphStyle("Contact", fontName="Helvetica", fontSize=9.3,
        leading=13.5, textColor=MUTED, spaceAfter=3),
    "body": ParagraphStyle("Body", fontName="Helvetica", fontSize=10.5,
        leading=15, textColor=INK, spaceAfter=7),
    "bullet": ParagraphStyle("Bullet", fontName="Helvetica", fontSize=10.3,
        leading=14.7, textColor=INK, leftIndent=10, firstLineIndent=-10, spaceAfter=5),
    "section": ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=11.4,
        leading=15.5, textColor=BLUE, spaceBefore=14, spaceAfter=8),
    "role": ParagraphStyle("Role", fontName="Helvetica-Bold", fontSize=11.3,
        leading=15, textColor=INK, spaceAfter=2),
    "detail": ParagraphStyle("Detail", fontName="Helvetica", fontSize=9.7,
        leading=13.5, textColor=MUTED, spaceAfter=7),
    "project": ParagraphStyle("Project", fontName="Helvetica-Bold", fontSize=11.5,
        leading=15.5, textColor=INK, spaceAfter=2),
    "tech": ParagraphStyle("Tech", fontName="Helvetica", fontSize=9.5,
        leading=13.8, textColor=MUTED, spaceAfter=8),
    "skilllabel": ParagraphStyle("SkillLabel", fontName="Helvetica-Bold", fontSize=9.9,
        leading=14.2, textColor=INK),
    "skill": ParagraphStyle("Skill", fontName="Helvetica", fontSize=9.9,
        leading=14.2, textColor=INK),
    "pageheading": ParagraphStyle("PageHeading", fontName="Helvetica-Bold", fontSize=16,
        leading=21, textColor=INK, spaceAfter=3),
}
for style in styles.values():
    style.fontName = "ResumeSansBold" if style.fontName == "Helvetica-Bold" else "ResumeSans"

def p(text, kind="body"):
    return Paragraph(text, styles[kind])

def link(url, text):
    return f'<a href="{url}" color="#1764AB">{text}</a>'

def bullet(text):
    return p("- " + text, "bullet")

def section(title):
    return p(title.upper(), "section")

def role(title, company, dates):
    return [p(title, "role"), p(f"{company} | {dates}", "detail")]

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.6)
    canvas.line(48, 39, 564, 39)
    canvas.setFillColor(MUTED)
    canvas.setFont("ResumeSans", 8.3)
    canvas.drawString(48, 26, "Paul Sattaur  |  Full-Stack Software Engineer")
    canvas.drawRightString(564, 26, f"{doc.page} / 2")
    canvas.restoreState()

story = [
    p("Paul Sattaur", "name"),
    p("Full-Stack Software Engineer | Automation, Data &amp; AI", "position"),
    p("Brampton / Greater Toronto Area, Ontario  |  " + link("mailto:paulsattaur@hotmail.com", "paulsattaur@hotmail.com"), "contact"),
    p(link("https://pstar80.github.io/", "pstar80.github.io") + "  |  " + link("https://github.com/PStar80", "github.com/PStar80") + "  |  " + link("https://www.linkedin.com/in/paulsattaur/", "linkedin.com/in/paulsattaur"), "contact"),
    Spacer(1, 12),
    p("Software engineer with 8+ years of enterprise experience across financial and pension systems, now building full-stack applications for workflow automation, data engineering, and interactive analytics. Connects requirements, interfaces, services, and databases through maintainable software. Current independent work integrates agentic AI and MCP-connected assistants with practical tools, durable workflows, and visible execution results."),
    section("Professional Experience"),
    *role("Senior Programmer Analyst", "CAAT Pension Plan - Toronto, Ontario", "2022-2025"),
    bullet("Led systems analysis, data workflows, and requirements-to-release delivery for GROWTHplus, translating pension business needs into application changes."),
    bullet("Developed and maintained Oracle SQL/PLSQL pension rules, scheduled batches, and integrations in Java/J2EE."),
    bullet("Modernized a shared batch-wizard framework by separating generic processing from batch-specific logic."),
    bullet("Collaborated with business stakeholders, analysts, developers, and QA on requirements, troubleshooting, validation, and releases."),
    Spacer(1, 8),
    *role("Programmer Analyst", "The RecordKeeper Ltd - Vaughan, Ontario", "2014-2019"),
    bullet("Developed and enhanced Oracle-backed Java/J2EE financial applications and C# utilities."),
    bullet("Delivered enhancements through analysis, implementation, testing, deployment, and production support."),
    bullet("Created and maintained Linux/Unix scripts supporting application processes and operational work."),
    Spacer(1, 8),
    *role("Business Analyst", "CPAS Systems - Toronto, Ontario", "2011-2013"),
    bullet("Gathered and analyzed requirements for pension-system changes and translated business needs into clear implementation and test inputs."),
    bullet("Used SQL reconciliation and defect investigation to support testing, release validation, and issue resolution."),
    PageBreak(),
    p("Paul Sattaur", "pageheading"),
    p("Selected Applications &amp; Technical Expertise", "detail"),
    section("Independent Software Projects"),
    p("SkyCommand", "project"),
    p("Workflow Automation &amp; Agentic AI | 2025-Present", "detail"),
    p("Building a full-stack automation platform that brings reusable tools, durable workflows, and embedded AI agents into one operational interface. Workflow, tool, and result views expose execution state and structured outcomes. Configured coding assistants can also invoke exposed operations through MCP."),
    p("React / Node.js / TypeScript / PostgreSQL / Temporal / Docker / MCP<br/>" + link("https://github.com/PStar80/SkyCommand-Demo", "Public showcase: github.com/PStar80/SkyCommand-Demo"), "tech"),
    Spacer(1, 3),
    p("MacroAnalyzer", "project"),
    p("Macroeconomic Analytics &amp; Data Visualization | 2025-Present", "detail"),
    p("Building an application for exploring macroeconomic time series through interactive charts, personalized dashboards, saved views, alert rules, and in-app signals. The React interface connects to ASP.NET Core services and PostgreSQL-backed data."),
    p("React / ASP.NET Core / C# / PostgreSQL / ECharts / D3<br/>" + link("https://github.com/PStar80/MacroAnalyzer", "Source: github.com/PStar80/MacroAnalyzer"), "tech"),
    Spacer(1, 3),
    p("SkyDataStudio", "project"),
    p("Data Engineering &amp; Analytical Products | Current Selected Project", "detail"),
    p("Developing a data engineering workbench that turns trusted data into governed analytical products through versioned pipelines, dbt transformations, quality checks, and traceable lineage."),
    p("React / Python / FastAPI / PostgreSQL / Airflow / dbt / Docker<br/>" + link("https://github.com/PStar80/SkyDataStudio", "Source: github.com/PStar80/SkyDataStudio"), "tech"),
    section("Technical Skills"),
]

skills = [
    ("Languages", "TypeScript, JavaScript, Python, C#, Java, SQL/PLSQL"),
    ("Interfaces &amp; APIs", "React, HTML/CSS, Node.js, ASP.NET Core, FastAPI, REST APIs"),
    ("Data &amp; Workflows", "PostgreSQL, Oracle, Temporal, Airflow, dbt, ECharts, D3"),
    ("Platform &amp; Delivery", "Docker, Git/GitHub, Linux/Unix, MCP, requirements analysis, testing, production troubleshooting"),
]
skill_table = Table([[p(label, "skilllabel"), p(value, "skill")] for label, value in skills], colWidths=[112, 404])
skill_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (0, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
]))
story += [skill_table, section("Education"),
    p("<b>Advanced Diploma, Computer Programmer/Analyst (Honours)</b><br/>Seneca College | 2017", "body"),
    p("<b>Foundations in Business Analysis</b><br/>University of Toronto Mississauga | 2014", "body"),
]

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUTPUT), pagesize=letter, leftMargin=48, rightMargin=48,
    topMargin=40, bottomMargin=51, title="Paul Sattaur - Full-Stack Software Engineer",
    author="Paul Sattaur", subject="Public resume: automation, data engineering, and AI-native applications")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
