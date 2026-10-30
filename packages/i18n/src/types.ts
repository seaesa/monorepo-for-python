import type en from "./locales/en"

/** Same keys as `en`, any string values — other locales must match this shape exactly. */
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> }

export type Messages = DeepStrings<typeof en>
