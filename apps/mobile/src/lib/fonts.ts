import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from "@expo-google-fonts/be-vietnam-pro"
import type { FontFamilyDefinition } from "expo-font"

import { fontFamily } from "@workspace/theme"

/**
 * One family with real weights, so `font-sans font-medium` resolves like on the web
 * (instead of a separate family name per weight).
 */
export const FONTS: FontFamilyDefinition[] = [
  {
    fontFamily: fontFamily.sans,
    fontDefinitions: [
      { path: BeVietnamPro_400Regular, weight: 400 },
      { path: BeVietnamPro_500Medium, weight: 500 },
      { path: BeVietnamPro_600SemiBold, weight: 600 },
      { path: BeVietnamPro_700Bold, weight: 700 },
    ],
  },
]
