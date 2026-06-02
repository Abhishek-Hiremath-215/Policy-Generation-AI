"""
LLM service for policy generation using Ollama (Free & Open Source).
No paid APIs - runs completely locally.
"""

import json
from typing import List, Dict, Any, Optional
from app.config import settings

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    raise ImportError("Ollama not available. Install with: pip install ollama")


class LLMService:
    """
    LLM service for generating policy content using Ollama.
    100% Free - runs locally on your machine.
    """
    
    def __init__(self):
        """Initialize Ollama client."""
        if not OLLAMA_AVAILABLE:
            raise ImportError("Ollama package not installed. Run: pip install ollama")
        
        self.model = settings.OLLAMA_MODEL
        self.client = ollama.Client(host=settings.OLLAMA_HOST)
        
        # Verify Ollama is running and model is available
        self._verify_setup()
    
    def _verify_setup(self):
        """Verify Ollama is running and model is available."""
        try:
            # Check if Ollama is running
            models_response = self.client.list()
            
            # Handle object response from ollama library
            available_models = []
            if hasattr(models_response, 'models'):
                for model in models_response.models:
                    # Extract model name from object
                    if hasattr(model, 'model'):
                        available_models.append(model.model)
                    elif hasattr(model, 'name'):
                        available_models.append(model.name)
            
            print(f"✅ Ollama connected. Available models: {available_models}")
            
            # Check if our model exists (match base name)
            model_base = self.model.split(':')[0]
            model_found = any(model_base in model for model in available_models)
            
            if not model_found:
                print(f"⚠️  Model '{self.model}' not found.")
                print(f"📥 Available models: {', '.join(available_models)}")
                print(f"💡 To install: ollama pull {self.model}")
                
                # Try to pull the model automatically
                print(f"🔄 Attempting to pull model '{self.model}'...")
                self.client.pull(self.model)
                print(f"✅ Model '{self.model}' pulled successfully!")
            else:
                print(f"✅ Using model: {self.model}")
        
        except Exception as e:
            raise ConnectionError(
                f"Cannot connect to Ollama at {settings.OLLAMA_HOST}. "
                f"Make sure Ollama is installed and running.\n\n"
                f"Installation instructions:\n"
                f"1. Visit: https://ollama.com\n"
                f"2. Download and install Ollama\n"
                f"3. Run: ollama pull {self.model}\n"
                f"4. Start Ollama service\n\n"
                f"Error: {str(e)}"
            )
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000
    ) -> str:
        """
        Generate text using Ollama.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text
        """
        messages = []
        
        if system_prompt:
            messages.append({
                'role': 'system',
                'content': system_prompt
            })
        
        messages.append({
            'role': 'user',
            'content': prompt
        })
        
        try:
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    'temperature': temperature,
                    'num_predict': max_tokens,
                    'top_p': 0.9,
                    'top_k': 40
                }
            )
            
            # Handle object response from ollama library
            if hasattr(response, 'message'):
                if hasattr(response.message, 'content'):
                    return response.message.content
                return str(response.message)
            
            # Fallback for dict response
            return response.get('message', {}).get('content', '')
        
        except Exception as e:
            raise Exception(f"Error generating with Ollama: {str(e)}")
    
    def generate_policy_section(
        self,
        section_title: str,
        section_description: str,
        context_data: List[str],
        company_info: Dict[str, Any]
    ) -> str:
        """
        Generate a specific policy section.
        
        Args:
            section_title: Title of the section
            section_description: Description of what to include
            context_data: Relevant data chunks from vector store
            company_info: Company metadata
            
        Returns:
            Generated section content
        """
        # Build context from retrieved data
        context = "\n\n".join([
            f"Context {i+1}:\n{chunk}"
            for i, chunk in enumerate(context_data[:10])  # Limit to top 10
        ])
        
        system_prompt = """You are an expert policy writer specializing in comprehensive organizational policies.
Your task is to write professional, detailed, and actionable policy sections.
Use formal business language, include specific guidelines, and provide realistic examples.
Ensure all content is based on the provided context and company information.
Write in a clear, structured format suitable for a professional policy document."""
        
        user_prompt = f"""Write a comprehensive policy section with the following details:

Section Title: {section_title}
Section Purpose: {section_description}

Company Information:
- Company Name: {company_info.get('company_name', 'Our Organization')}
- Industry: {company_info.get('industry', 'Technology')}
- Additional Context: {company_info.get('description', '')}

Relevant Context from Company Data:
{context}

Requirements:
1. Write 2-3 pages of detailed content for this section
2. Include specific policies, procedures, and guidelines
3. Use the company name and industry context appropriately
4. Include realistic examples based on the company's context
5. Structure content with subsections using ### headings
6. Make it actionable and implementable
7. Ensure professional tone and formatting
8. Include bullet points for clarity where appropriate

Write the complete section now:"""
        
        return self.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=4000
        )
    
    def generate_executive_summary(
        self,
        company_info: Dict[str, Any],
        policy_overview: str
    ) -> str:
        """Generate executive summary for the policy document."""
        system_prompt = """You are an expert at writing executive summaries for policy documents.
Create concise yet comprehensive summaries that capture key points.
Write in a formal, professional style suitable for executive leadership."""
        
        user_prompt = f"""Create an executive summary for an organizational policy document.

Company: {company_info.get('company_name', 'Our Organization')}
Industry: {company_info.get('industry', 'Technology')}
Description: {company_info.get('description', '')}

Policy Overview: {policy_overview}

Write a 1-page executive summary that:
1. Introduces the purpose of this policy document
2. Highlights key policy areas covered
3. Emphasizes the importance of compliance
4. Sets the tone for the document
5. Addresses stakeholders appropriately

Write in a formal, professional style suitable for executive leadership."""
        
        return self.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.6,
            max_tokens=2000
        )
    
    def list_available_models(self) -> List[str]:
        """Get list of available Ollama models."""
        try:
            models_response = self.client.list()
            available = []
            
            if hasattr(models_response, 'models'):
                for model in models_response.models:
                    if hasattr(model, 'model'):
                        available.append(model.model)
                    elif hasattr(model, 'name'):
                        available.append(model.name)
            
            return available
        except Exception as e:
            print(f"Error listing models: {str(e)}")
            return []
