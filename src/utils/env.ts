export const ENV = process.env.NODE_ENV || ''
export const isPrd = ENV === 'production'
export const isDev = ENV === 'dev'
