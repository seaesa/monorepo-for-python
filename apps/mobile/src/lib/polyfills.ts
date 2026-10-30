// Must load before i18next (imported by @workspace/*): Hermes may lack Intl.PluralRules.
// The polyfill only installs itself when the native implementation is missing.
import "intl-pluralrules"
