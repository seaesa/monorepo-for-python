import { Redirect } from "expo-router"

// Stack.Protected falls back to the group root when the app guard fails.
export default function AuthIndex() {
  return <Redirect href="/login" />
}
