import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class EmailTemplateLoader {
  private static templates: Map<string, EmailTemplate> = new Map();

  static loadTemplate(language: string, templateName: string): EmailTemplate {
    const key = `${language}-${templateName}`;
    
    if (this.templates.has(key)) {
      return this.templates.get(key)!;
    }

    try {
      const templatePath = join(process.cwd(), 'server', 'email-templates', language, `${templateName}.json`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const template: EmailTemplate = JSON.parse(templateContent);
      
      this.templates.set(key, template);
      return template;
    } catch (error) {
      console.warn(`Failed to load email template ${templateName} for language ${language}, falling back to English`);
      
      // Fallback to English if the requested language template doesn't exist
      if (language !== 'en') {
        return this.loadTemplate('en', templateName);
      }
      
      throw new Error(`Email template ${templateName} not found for language ${language}`);
    }
  }

  static renderTemplate(template: EmailTemplate, variables: Record<string, string>): EmailTemplate {
    const renderContent = (content: string): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    return {
      subject: renderContent(template.subject),
      htmlContent: renderContent(template.htmlContent),
      textContent: renderContent(template.textContent),
    };
  }
}
