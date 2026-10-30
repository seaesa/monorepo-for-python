import { describe, expect, it, vi } from "vitest"

import { applyServerErrors, translateApiCode } from "./form"

/** The shape `isAxiosError` recognises, so no real HTTP call is needed. */
function apiError(data: unknown) {
  return { isAxiosError: true, response: { data } }
}

function setErrorSpy() {
  return vi.fn<(name: string, error: { type: string; message: string }) => void>()
}

describe("translateApiCode", () => {
  it("translates a backend error code", () => {
    expect(translateApiCode("email_taken", "Email already registered")).toBe(
      "This email is already registered"
    )
  })

  it("translates a pydantic error type with its params", () => {
    expect(translateApiCode("string_too_short", "too short", { min_length: 8 })).toBe(
      "Must be at least 8 characters"
    )
  })

  it("falls back to the server message for an unknown code", () => {
    expect(translateApiCode("not_a_real_code", "Server said no")).toBe("Server said no")
  })
})

describe("applyServerErrors", () => {
  it("puts a field error on that field", () => {
    const setError = setErrorSpy()

    applyServerErrors(
      apiError({
        code: "email_taken",
        message: "Email already registered",
        details: [
          {
            field: "email",
            code: "email_taken",
            message: "Email already registered",
            params: null,
          },
        ],
      }),
      setError
    )

    expect(setError).toHaveBeenCalledExactlyOnceWith("email", {
      type: "server",
      message: "This email is already registered",
    })
  })

  it("puts a 422 validation error on its dot path", () => {
    const setError = setErrorSpy()

    applyServerErrors(
      apiError({
        code: "validation_error",
        message: "Please check the highlighted fields",
        details: [
          {
            field: "password",
            code: "string_too_short",
            message: "String should have at least 8 characters",
            params: { min_length: 8 },
          },
        ],
      }),
      setError
    )

    expect(setError).toHaveBeenCalledExactlyOnceWith("password", {
      type: "server",
      message: "Must be at least 8 characters",
    })
  })

  it("puts an error without details on root.server", () => {
    const setError = setErrorSpy()

    applyServerErrors(
      apiError({ code: "invalid_credentials", message: "Invalid email or password" }),
      setError
    )

    expect(setError).toHaveBeenCalledExactlyOnceWith("root.server", {
      type: "server",
      message: "Invalid email or password",
    })
  })

  it("treats a network failure as a root error", () => {
    const setError = setErrorSpy()

    applyServerErrors({ isAxiosError: true, response: undefined }, setError)

    expect(setError).toHaveBeenCalledExactlyOnceWith("root.server", {
      type: "server",
      message: "Cannot reach the server. Check your connection.",
    })
  })
})
