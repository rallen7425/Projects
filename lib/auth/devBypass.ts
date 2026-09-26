// Never enable this in a deployed environment, including hosted previews.
export function devBypassId(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.NODE_ENV === 'development' && !env.VERCEL && !env.VERCEL_ENV
    ? env.DEV_BYPASS_USER_ID || undefined
    : undefined
}
