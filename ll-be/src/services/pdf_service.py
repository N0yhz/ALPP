import os
import re
import tempfile
import latex2mathml.converter
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from src.schemas.lesson import LessonPlanResponse

class PdfService:
    def __init__(self):
        # Setup Jinja2 environment
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))

    def _convert_latex(self, html_content: str) -> str:
        """
        Finds LaTeX formulas ($...$ and $$...$$) and converts them to MathML.
        """
        # Block formulas $$...$$
        def replace_block(match):
            latex = match.group(1).strip()
            try:
                # Use display="block" for $$...$$
                return latex2mathml.converter.convert(latex).replace('display="inline"', 'display="block"')
            except Exception:
                return match.group(0)

        # Inline formulas $...$
        def replace_inline(match):
            latex = match.group(1).strip()
            try:
                return latex2mathml.converter.convert(latex)
            except Exception:
                return match.group(0)

        # 1. Replace block formulas first (to avoid matching $ inside $$)
        # Using DOTALL to handle multi-line block formulas
        content = re.sub(r'\$\$(.*?)\$\$', replace_block, html_content, flags=re.DOTALL)
        
        # 2. Replace inline formulas
        # We look for $...$ but try to avoid matching escaped \$ or single $ used for currency
        # A simple heuristic for inline LaTeX: $ followed by non-space and ending with non-space before $
        content = re.sub(r'\$([^\s$](?:.*?[^\s$])?)\$', replace_inline, content)

        return content

    def generate_lesson_pdf(self, lesson_data: LessonPlanResponse) -> str:
        """
        Renders a LessonPlanResponse into a PDF using WeasyPrint.
        Returns the path to the temporary PDF file.
        """
        # 1. Render HTML
        template = self.jinja_env.get_template("lesson_plan.html")
        html_content = template.render(lesson_data.model_dump())

        # 2. Convert LaTeX to MathML
        html_content = self._convert_latex(html_content)

        # 3. Create Temporary File
        fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd) # Close file descriptor so WeasyPrint can write to it

        # 4. Convert to PDF
        HTML(string=html_content).write_pdf(temp_path)

        return temp_path

pdf_service = PdfService()
