import React, { Key } from 'react';
import type { FieldValues } from 'react-hook-form';
import type {
  EmailSelfIntegrationConfig,
  EmailRespondentIntegrationConfig,
  WebhookIntegrationConfig,
  NotionIntegrationConfig,
  GoogleAnalyticsIntegrationConfig,
} from './connect-types';

// All DB Collections

export type FormIntegrationType =
  | 'webhook'
  | 'notion'
  | 'zapier'
  | 'email-self'
  | 'email-respondent'
  | 'google-analytics'
  | 'google-sheets'
  | 'slack'
  | 'airtable';

export type SpaceRoles = 'member' | 'admin' | 'owner';
export type PlanType = 'free' | 'pro' | 'lifetime';
// see: // see: https://docs.lemonsqueezy.com/api/subscriptions#the-subscription-object
export type PlanStatus =
  | 'active'
  | 'on_trial'
  | 'paused'
  | 'past_due'
  | 'unpaid'
  | 'paid'
  | 'cancelled'
  | 'expired';

// Because we are not storing email in spaceMembers, so we have to use firebase auth methods for getting full user data.
// Also, if we add email here then we need to update it on multiple spaces if user change their email.
export type SpaceMember = {
  uid: string;
  accepted: boolean;
  role: SpaceRoles;
};

export type FormPages = {
  id: string;
  name?: string;
  isEnding?: boolean;
}[];

export interface FormActionState {
  ok: boolean;
  data: any;
  errors: Record<string, string | string[] | undefined>;
  timestamp: number;
  message: string;
  status: number;
}

export type FormTheme = Partial<{
  layout: 'left' | 'center' | 'right';
  // pages: { id: string,  image?: string, background?: string}[]; // later.
  // only google fonts supported. Either using link or directly using font name.
  fontFamily: string;
  // if this is defined, then we will use this for font weights instead of default variable weights.
  // NOTE: we can't use variable weights for static fonts, otherwise that will not work.
  fontWeights: {
    type: 'variable' | 'static';
    value: number[] | null;
  };
  // all variables. Auto-generated via material-color-utilities or any other lib from server. This will not be stored on server.
  vars: Partial<{
    'color-primary': string;
    'color-secondary': string;
    'color-tertiary': string;
    'color-surface': string;
    'color-on-surface': string;
    'color-surface-variant': string;
    'color-on-surface-variant': string;
    'color-outline': string;
    'color-outline-variant': string;
    'color-primary-container': string;
    'color-on-primary-container': string;
    'color-secondary-container': string;
    'color-on-secondary-container': string;
    'color-tertiary-container': string;
    'color-on-tertiary-container': string;
  }>;
  color: Partial<{
    // must follow tailwind 'r g b' format.
    // https://github.com/material-foundation/material-color-utilities
    // source color. On backend we will use the material-color-utilities lib to generate other colors.
    source: string;
    background: string; // this will be override by pages.background if defined for particular page.
  }>;
}>;

// Logic builder
export type LogicOperator = 'and' | 'or';
export type TextConditionType =
  | 'empty'
  | 'not_empty'
  | 'equal'
  | 'not_equal'
  | 'starts_with'
  | 'ends_with'
  | 'contains'
  | 'does_not_contain';
export type NumberConditionType =
  | 'empty'
  | 'not_empty'
  | 'equal'
  | 'not_equal'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_equal'
  | 'less_than_equal';

// NOTE: Currently we are supporting only show_block and hide_block with just one block. We may not support multiple show/hide block in future. But people can add multiple then statement for multiple show/hide block.
export type LogicActionType =
  | 'show_block'
  | 'hide_block'
  | 'go_to_page'
  | 'require_answer'
  | 'calculate';

export type FormulaOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '('
  | ')'
  | '^' // exponentiation
  | '%' // modulo
  // NOTE: If we not use mathjs, then we need to support these function in form renderer.
  | 'sqrt' // square root
  | 'abs' // absolute value
  | 'round' // round to nearest integer
  | 'floor' // round down
  | 'ceil' // round up
  | 'min' // minimum of values
  | 'max' // maximum of values
  | 'avg' // average of values
  | 'sum' // sum of values
  | 'log'; // logarithm
export type FormulaValueType = 'field' | 'number' | 'operator' | 'variable';

export interface FormulaItem {
  type: FormulaValueType;
  value: string | number;
  id?: string; // if type is variable or field, then we store the id of that variable or field instead of value for realtime changes.
}

export interface CalculateAction {
  type: 'calculate';
  target: string; // Variable name to store result
  // if type is variable or field, then we store the id of that variable or field instead of value for realtime changes.
  formula: {
    raw: string; // raw string format.
    json: FormulaItem[]; // Array representing the formula expression
  };
}

export interface LogicRules {
  fieldId: string; // can be variable id or field id.
  type: TextConditionType | NumberConditionType;
  value: string | number; // if value starts with @, then it's a variable or custom field.
  operator: LogicOperator; // default is `and` operator if single condition is provided.
  // we avoid grouping for now, we follow operator precedence. `AND` then `OR`. Check typeform logic for reference.
  // We also write the formula with grouping for visual clarity for user on ui.
  // groupId?: string; // Optional group identifier
}

export interface Logic {
  id: string;
  type: 'if' | 'always';
  // NOTE: With `always`, rules are always empty and action will always be `calculate` action.
  // NOTE: When multiple Logic rules target the same action (same target and type),
  // they will be combined with an OR operator. The action will execute if ANY of
  // the matching rules evaluate to true.
  // NOTE: Also it can be possible that we have same rule with different action in different logic.
  // NOTE: This is also possible that we have same rule with different action which contradicts each other like show_block and hide_block. In this case, last one will overwrite all previous.
  // NOTE: Instead of grouping, we will follow standard operator precedence which is `and` then `or`. So for eg: `a and b or c and d` will be `(a and b) or (c and d)` automatically.
  rules: LogicRules[];
  actions: (
    | CalculateAction
    | {
        type: Exclude<LogicActionType, 'calculate'>;
        target: string;
      }
  )[];
  enabled: boolean;
}

export interface FormVariable {
  id: string; /// unique id for variable, since variable can have same name.
  name: string; // if user provide multiple same name, then it's also not a problem.
  type: 'text' | 'number' | 'hidden';
  value: string | number; // this is default value.
}

// Eg of logic
// See more examples in README.md
/**
const logicExample = [{
  id: "rule1",
  type: "if",
  rules: [
    { fieldId: "field_a", type: "equal", value: "yes", operator: "and" },
    { fieldId: "field_b", type: "equal", value: "yes", operator: "or"},
    { fieldId: "field_c", type: "equal", value: "yes", operator: "or"},
    { fieldId: "field_d", type: "equal", value: "yes", operator: "and" }
  ],
  actions: [{
    type: "show_block",
    target: "some_block"
  }],
  enabled: true 
}, ...];
 */

// NEW TYPES
// DB Collections
// ----------
export interface ColAccounts {
  uid: string; // uid is required here to attach firebase user data with account.
  pid: string;
  plan: PlanType;
  subscription: {
    status: PlanStatus;
    customerId: string; // can be stripe or paypal or lemonsqueezy or any other payment provider,
    // product subscription id in case of subscription or order id in case of one time payment.
    // With just this, we can get full subscription details via payment api.
    paymentId: string; // can be stripeId or paypalId or lemonsqueezy.
    // will be used internally, incase we want to migrate to other payment gateway.
    paymentMethod: 'stripe' | 'paypal' | 'lemonsqueezy' | 'paddle';
    startsAt: string;
    renewsAt: string;
    endsAt: string | null; // mostly null, except when status is cancelled or expired.
  } | null;
  updatedAt: string | null;
  limits: {
    users: number;
    forms: number;
    spaces: number;
    submissions: number;
  };
  // For now we are only supporting one domain per account.
  domains?:
    | {
        id: string; // hostname id
        name: string; // hostname
        status: 'pending' | 'active' | 'error';
        createdAt: string;
        lastChecked?: string | null;
      }[]
    | null;
}

export interface ColSpaces {
  pid: string;
  accountId: string;
  name: string;
  slug: string;
  logo: string | null;
  // We can also seperate this, but we will probably have less than 100+ members, so not required.
  // This also include `owner` as member when we first create space for owner.
  members: SpaceMember[];
  // forms: string[]; // forms slug
}

export interface ColSpaceInvites {
  pid: string;
  spaceId: string;
  email: string;
  token: string;
  expires: Date | string;
}

export interface ColForms {
  pid: string;
  name: string;
  slug: string;
  spaceId: string; // public space Id.
  responseCount: number;
  lastModified: Date | string | number | null;
  lastPublished: Date | string | number | null;
  settings: FormSettings | null;
  theme: FormTheme | null;
  previewURL: string;
  draft: {
    pages: FormPages;
    schema: FormSchema | null; // { [pageId]: [ { ... }, ...]} | null
  };
  live: {
    pages: FormPages;
    schema: FormSchema | null;
  };
  // calculated variables (can be used via mentions using @ symbol)
  // this also used for hidden fields.
  variables?: FormVariable[];

  logic?: Logic[];
  // We can have atmost 100+ integration in a form, so we can store it in form collection itself.
  // NOTE: When we introduce multiple webhooks per form. Then we will move webhook to new field named webhooks. But we will probably not introduce that feature soon.
  // don't store sensitive info (integration api keys) in this. Instead create a new collection for that.
  connects?: {
    id: string;
    type: FormIntegrationType;
    enabled: boolean;
    // integration specific data.
    config:
      | EmailSelfIntegrationConfig
      | EmailRespondentIntegrationConfig
      | WebhookIntegrationConfig
      | NotionIntegrationConfig
      | GoogleAnalyticsIntegrationConfig;
  }[];
}

// We don't need to attach spaceId here (optional), as it's a part of a form.
export interface ColWebhookLogs {
  pid: string; // this is public id. Can be use for event id.
  webhookId: string; // connect id.
  url: string; // url requested by webhook.
  statusCode: number;
  payload: {
    formId: string;
    submissionId: string;
    submittedAt: Date;
    formName: string;
    schema: {
      key: string;
      value: unknown;
      label: string;
      type: string;
    }[];
  };
}

// Define the Google Sheets log type
export interface ColSheetsLogs {
  pid: string;
  connectId: string; // Google Sheets connect ID
  spreadsheetId: string;
  sheetName: string;
  statusCode: number;
  error?: string | null;
  payload: {
    formId: string;
    submissionId: string;
    submittedAt: Date;
    formName: string;
    schema: {
      key: string;
      value: unknown;
      label: string;
      type: string;
    }[];
  };
}

export interface ColSubmissions {
  pid: string; // submission id.
  spaceId: string;
  submissionId?: string; // deprecated (for backward compatibility), use newer pid.
  formSlug: string;
  formName: string;
  // flatten structure from all pages in order.
  // This schema can be different if live form changes again.
  // So, to display in response page (UI), we will first get form data and filter out keys which are not there.
  // If label (title) is undefined for key, then we will use default label like : `Untitled Rating`, `Untitled Short Form` etc..
  // Case: when user reduce the live form data after submission. In that case, extra keys in response schema will not be displayed, but during export we can ask user to export that keys also. For this purpose, we will store `label` and `type` also.
  // NOTE: We are now also storing calculated form variables in this. For variable, label is `name` of variable and key is `id` of variable.
  schema: {
    key: string;
    value: unknown;
    label: string;
    type: FormElementType;
  }[];
}

// Timer attempts for timer enabled form.
export type ColTimerAttempts = {
  pid: string;
  formSlug: string;
  startedAt: Date;
  submissionId?: string | null;
  completedAt: Date | null;
  status: 'in-progress' | 'completed' | 'timed-out';
  lastSavedProgress: Record<string, unknown>; // key-value pair of last saved
  duration: number; // Total allowed duration in seconds for the whole formschema.
  accessCode?: string; // if timer is enabled, then we will store the access code here. Access code is generated using secret key and limit the timer form to be used only once with that access code.
};

// Form templates - to display in main gallery website.
// not tied to any personal/team account.
export interface ColTemplates {
  pid: string;
  formId: string; // the form slug from which this template is attached to.
  name: string;
  description?: string; // for metadata (seo)
  slug: string; // generated from name
  screenshot: string;
  tags: string[];
  featured?: boolean; // if we want to showcase this template on main website.
  isPublished: boolean; // we can publish/unpublish template any time.
  usedCount: number; // initially 0.
}

// specific to personal/team account. Just store it in different db.
// will introduce this later.
// When we approve any of user template to showcase on main website gallery, then we simply copy the doc from this to `templates` collection which will do by first copy the form and create in our own main account and then publish that template. This is required, otherwise if use user form then it can be changed by user later which we don't want.
// export type ColTeamTemplates = templates & { accountId: string; isPrivate: boolean; }

// NOTE: All input elements (which user use for filling form) must start with word `input`. This is to differentiate between input elements and other elements like image, embed, divider etc.
export type FormElementType =
  | 'text'
  | 'inputShort'
  | 'inputLong'
  | 'inputNumber'
  | 'inputPhoneNumber'
  | 'inputEmail'
  | 'inputRadio'
  | 'inputCheckbox'
  | 'inputMultipleChoice' // checkbox, radio in one.
  | 'inputMultiSelect' // multiple select dropdown
  | 'inputSignature'
  | 'inputPayment'
  | 'inputRating'
  | 'inputOpinionScale'
  | 'inputSlider'
  | 'inputDropdown' // select dropdown (single choice)
  | 'inputFileUpload'
  | 'inputSignature'
  | 'inputURL'
  | 'inputDate'
  | 'inputTime'
  | 'image'
  | 'embed'
  | 'divider'
  | 'submitButton'
  | 'variable';

export type FormSettings = {
  private: boolean;
  redirect?: string | null;
  disableSubmission?: boolean;
  // save form response for later so that user can continue later, if browser accidently closed.
  saveForLater?: boolean;
  meta: Partial<{
    title: string;
    description: string;
    image: string;
    allowIndexing: boolean;
  }>;
  messages: Partial<{
    backButtonText: string;
    nextButtonText: string;
    submitButtonText: string;
    startButtonText: string; // basically next button for first page.
  }>;
  timer: Partial<{
    enable: boolean;
    visibility: boolean;
    warnAt: number; // seconds remaining when warning appears
    warnMessage: string; // message to show when warning appears
    secretKey: string; // secret key for timer to create unique codes for each form. Useful to stop multiple timer attempts for same form.
    config: {
      type: 'full';
      duration: number; // in seconds
      expirePage: string; // page id where timer will redirect to after time expires
      triggerPage: string; // page id where timer will start
    };
  }>;
};

export type FormMessages = Partial<{
  backButtonText: string;
  nextButtonText: string;
  submitButtonText: string;
}>;

export type FormElementSchema = {
  key: string;
  type: FormElementType;
  css?: unknown | null;
  // TODO: replace any with better type. Unknown doesn't work here.
  props: Record<string, any> | null;
  // validation?: {
  //   text: string;
  //   required: boolean;
  // };
  actions?: unknown | null;
  rowId?: string;
};

export type ElementRendererProps = {
  el: FormElementSchema;
  mode?: 'edit' | 'draft' | 'live';
};

export type FormPageSchema = FormElementSchema[];

export type FormPageSchemaByRowId = Record<string | number, FormElementSchema[]>;

// This is complete form schema. Eg:  { [pageId]: [ ... ], ... }
export type FormSchema = Record<string, FormPageSchema>;

export type FormRendererProps = {
  onSubmitFn?: (data: { key: string; value: unknown }[], isTimerExpired?: boolean) => Promise<void>;
  onPageChange?: (page: number) => void;
  onTimerStart?: (formSlug: string, accessCode?: string) => Promise<any>;
  onTimerSaveProgress?: (progress: Record<string, unknown>) => Promise<any>;
  getTimerAttemptStatusFn?: (
    attemptId: string
  ) => Promise<{ valid: boolean; officialEndTime?: string; status?: string }>;
  mode: 'live' | 'draft' | 'edit';
  isPlanActive?: boolean;
  pages: FormPages;
  variables?: FormVariable[];
  logic?: Logic[];
  settings: FormSettings | null;
  skipValidation?: boolean;
  schema: FormSchema | null;
  theme: FormTheme | null;
  className?: string;
  name?: string;
  mock?: boolean; // good for template preview
  slug?: string;
};

// OAuth Client types
export interface ColOAuthClients {
  clientId: string;
  clientSecret: string;
  name: string;
  description?: string;
  redirectUris: string[];
  allowedScopes: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // uid of creator
}

export interface ColOAuthSessions {
  uid: string;
  clientId: string;
  authCode: string | null;
  authCodeExpires: Date | null;
  refreshToken: string | null;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}
