const isDev = process.env.NODE_ENV === 'development';

const constants = {
  COL_FORMS: 'forms',
  COL_USERS: 'users',
  COL_SPACES: 'spaces',
  COL_TEMPLATES: 'templates',
  COL_SPACE_INVITES: 'spaceInvites',
  COL_ACCOUNTS: 'accounts',
  COL_SUBMISSIONS: 'submissions',
  COL_INTEGRATIONS: 'integrations',
  COL_WEBHOOK_LOGS: 'webhookLogs',
  COL_SHEETS_LOGS: 'sheetsLogs',
  COL_TIMER_ATTEMPTS: 'timerAttempts',

  COL_OAUTH_CLIENTS: 'oauthClients',
  COL_OAUTH_SESSIONS: 'oauthSessions',

  SITE_TITLE_DEFAULT: '',
  SITE_DESCRIPTION_DEFAULT: '',
  APP_NAME: 'Minform',
  SITE_NAME: 'Minform',
  SAVE_DELAY: 1000, // increase this, if you're getting heavy traffic.
  LOCAL_FORM_STATE_KEY: 'form',
  GRACE_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
  FREE_SUBMISSIONS_LIMIT: 5000,
  // TODO: Change this according to subscription plan.
  LIMITS: {
    USERS: 50,
    FORMS: 50, // per space.
    SPACES: 20,
    SUBMISSIONS: 100000, // this is soft limit, we will monitor lifetime and paid plan limits manually.
    PENDING_INVITES: 25,
    MAX_PAGES_PER_FORM: 250, // there can be one input per page.
  },
  // Email template doesn't work with process.env, so using url directly.
  LOGO_URL: `https://assets.minform.io/logo.png`,
  WAS_BROWSER_KEY: 'WAS_BROWSER',
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB  (for both free and paid plan)
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB,
  MAX_FILE_SIZE_PRO: 2050 * 1024 * 1024, // 2 GB

  // INTERNAL FORMS ID
  BUG_FORM_ID: isDev ? 'GEIO6k_' : 'zbl73cL',
  CONTACT_FORM_ID: isDev ? '7uwLICeM' : 'yQPF4PYT',

  // eashish93@gmail.com, hi@minform.io
  // NOTE: Just for temporary, once we create a backend admin panel, we will remove this.
  adminUids: isDev ? ['3oOWQCVMJFdFmM7AQLl3LB8zsKr2'] : ['iTCmADvKcHMEjE3cNRPOI1p5fBt1'],

  // Domain map CNAME
  DOMAIN_MAP_HOSTNAME: 'form.minform.io',

  // make sure to change this on `apps/web` too.
  pricing: {
    free: 0,
    /**
     * FUP for pro plans.
     * 50K submission/month
     * 100GB file storage limit
     * 50K emails/month
     */
    pro: {
      monthly: 24, // 24*12 = 288
      yearly: 228, // 19*12 = 228, discount 20.83%
    },
    /**
     * Lifetime limits (limited deal)
     * - No hard limit, occasional spikes are ok.
     * - 25K submissions/month
     * - 50GB file storage limit
     * - 25K emails/month
     * - Lifetime updates.
     */
    // not available now.
    lifetime: 179,
  },
};

export default constants;
