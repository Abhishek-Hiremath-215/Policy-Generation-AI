"""
URL scraping service for extracting content from web pages.
"""

import requests
from bs4 import BeautifulSoup
from typing import Optional
import time


class URLScraper:
    """Scrapes and extracts text content from URLs."""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_url(self, url: str) -> dict:
        """
        Scrape content from a URL.
        
        Args:
            url: URL to scrape
            
        Returns:
            Dictionary with title, text, and metadata
        """
        try:
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get title
            title = soup.find('title')
            title_text = title.get_text().strip() if title else "No title"
            
            # Get main content
            # Try to find main content area first
            main_content = (
                soup.find('main') or
                soup.find('article') or
                soup.find('div', class_=['content', 'main-content', 'post-content']) or
                soup.find('body')
            )
            
            if main_content:
                # Extract text from paragraphs and headings
                text_elements = []
                
                for elem in main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li']):
                    text = elem.get_text().strip()
                    if text and len(text) > 20:  # Filter out very short snippets
                        text_elements.append(text)
                
                content_text = "\n\n".join(text_elements)
            else:
                content_text = soup.get_text()
            
            # Clean up whitespace
            content_text = "\n".join([line.strip() for line in content_text.split("\n") if line.strip()])
            
            return {
                'title': title_text,
                'content': content_text,
                'url': url,
                'status': 'success',
                'char_count': len(content_text)
            }
            
        except requests.RequestException as e:
            return {
                'title': '',
                'content': '',
                'url': url,
                'status': 'error',
                'error': str(e)
            }
    
    def scrape_multiple_urls(self, urls: list[str], delay: float = 1.0) -> list[dict]:
        """
        Scrape multiple URLs with delay between requests.
        
        Args:
            urls: List of URLs to scrape
            delay: Delay in seconds between requests
            
        Returns:
            List of scraped content dictionaries
        """
        results = []
        
        for url in urls:
            result = self.scrape_url(url)
            results.append(result)
            
            if len(urls) > 1 and url != urls[-1]:
                time.sleep(delay)
        
        return results
