export type Emit<
  NAME extends string,
  PAYLOAD = unknown,
> = {
  name: NAME
  payload: PAYLOAD
}
export type EmitName<EMIT> = EMIT extends Emit<infer NAME, any> ? NAME : never
export type EmitPayload<EMIT, NAME extends EmitName<EMIT>> =
  EMIT extends Emit<NAME, infer PAYLOAD> ? PAYLOAD : never
