/**
 * 表示一个 Tauri 命令的类型定义
 *
 * @template NAME   - 命令名称（字符串字面量类型）
 * @template ARGS   - 命令参数类型，必须是 Record<string, unknown> 或 void
 *                    - `void` 表示无参数
 *                    - `Record<string, unknown>` 表示有参数
 * @template RESULT - 命令返回值类型，默认 `null` 表示无返回值，是 Tauri 后端 Ok(()) 的默认值
 */
export type Command<
  NAME extends string,
  ARGS extends Record<string, unknown> | void = void,
  RESULT = null,
> = {
  name: NAME
  args: ARGS
  result: RESULT
}
/**
 * 提取 Command 类型中的命令名称
 */
export type CommandName<CMD> = CMD extends Command<infer NAME, any, any> ? NAME : never
/**
 * 提取指定名称的 Command 类型中的参数类型
 */
export type CommandArgs<CMD, NAME extends CommandName<CMD>> =
  CMD extends Command<NAME, infer ARGS, any> ? ARGS : never
/**
 * 提取指定名称的 Command 类型中的返回值类型
 */
export type CommandResult<CMD, NAME extends CommandName<CMD>> =
  CMD extends Command<NAME, any, infer RES> ? RES : never
