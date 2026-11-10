export interface ActionSuccess {
  ok: true

  message?: string
}

export interface ActionFailure {
  ok: false
  error: string
}

export type ActionResult = ActionSuccess | ActionFailure

export function success(message?: string): ActionSuccess {
  if (message === undefined) {
    return { ok: true }
  }
  return { ok: true, message }
}

export function failure(error: string): ActionFailure {
  return { ok: false, error }
}
