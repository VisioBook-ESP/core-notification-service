// Template management module will contain:
// - TemplateController
// - TemplateService
// - EmailTemplate repository integration

export interface CreateTemplateRequest {
  templateId: string;
  name: string;
  subject: string;
  body: string;
  variables: Record<string, any>;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, any>;
  active?: boolean;
}

export interface TemplateResponse {
  id: string;
  templateId: string;
  name: string;
  subject: string;
  body: string;
  variables: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
