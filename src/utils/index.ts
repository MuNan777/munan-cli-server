/* eslint-disable no-console */
/* eslint-disable prefer-spread */
export function log(...argv: ({} | undefined)[]) {
  console.log.apply(console, argv)
}
