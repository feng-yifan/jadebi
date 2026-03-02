import type {ArgsOf, CommandNames, ResultOf} from './types';
import {invoke} from '@tauri-apps/api/core';

/**
 * Tauri 命令调用器的状态枚举类型。
 *
 * 定义了调用器在整个生命周期中可能处于的四种状态，用于跟踪命令调用的进度和结果：
 * - `idle`: 初始状态，表示调用器已创建但尚未发起任何命令调用
 * - `loading`: 加载状态，表示命令调用正在进行中，正在等待 Tauri 后端的响应
 * - `success`: 成功状态，表示命令调用已成功完成，可以通过 `data` 属性访问结果
 * - `error`: 错误状态，表示命令调用失败，可以通过 `error` 属性获取错误信息
 *
 * 这种状态机设计确保了调用过程的清晰性和可预测性，便于 UI 组件根据状态展示不同的界面，
 * 例如在 `loading` 状态显示加载指示器，在 `error` 状态显示错误信息。
 */
export type InvokerState = 'idle' | 'loading' | 'success' | 'error'

/**
 * 类型安全的 Tauri 命令调用器接口定义。
 *
 * 这是一个泛型类型，封装了 Tauri 命令的调用逻辑，提供了类型安全的 API 和响应式状态管理。
 * 该接口设计用于 Svelte 5 环境，利用了 TypeScript 的高级类型特性来确保编译时的类型安全。
 *
 * 主要特性：
 * 1. **条件调用签名**: 根据命令是否有参数，自动提供正确的 `call` 方法签名
 * 2. **类型自动推断**: 返回类型和参数类型根据命令定义自动推断，无需手动指定
 * 3. **响应式状态管理**: 使用 Svelte 5 的 runes 系统实现响应式状态更新
 * 4. **类型守卫方法**: 提供 `isSuccess()`, `isLoading()`, `isError()` 方法进行类型细化
 *
 * 设计原理：
 * - 通过泛型参数传递命令名称，利用 TypeScript 的类型系统确保命令名称的正确性
 * - 使用条件类型实现 API 的自适应性，简化开发者的调用体验
 * - 通过类型谓词（`this is`）实现智能的类型细化，提高代码安全性
 * - 使用只读属性保护内部状态，防止意外修改
 *
 * @template NAME - 命令名称类型，必须是 `CommandNames` 类型的子类型，确保类型安全
 * @template STATE - 调用器当前状态类型，默认为 `InvokerState`，支持状态特定的类型细化
 * @template ARGS - 命令参数类型，根据 `NAME` 从类型系统自动推断
 * @template RESULT - 命令返回结果类型，根据 `NAME` 从类型系统自动推断
 * @template ERROR - 错误信息类型，始终为 `string | undefined`，表示可能存在的错误信息
 */
export type Invoker<
  NAME extends CommandNames,
  STATE extends InvokerState = InvokerState,
  ARGS = ArgsOf<NAME>,
  RESULT = ResultOf<NAME> | undefined,
  ERROR = string | undefined
> = {
  /**
   * 调用器的当前状态，只读属性。
   *
   * 表示调用器当前所处的状态，可用于决定 UI 的展示逻辑。
   * 状态变化会自动触发 Svelte 的响应式更新。
   */
  readonly state: STATE

  /**
   * 调用成功时返回的数据，只读属性。
   *
   * 当调用器处于 `success` 状态时，此属性包含命令执行的结果数据。
   * 在 `idle`、`loading` 或 `error` 状态时，此属性为 `undefined`。
   *
   * 注意：由于使用 `$state.raw`，复杂对象不会被代理，保留了原始结构。
   */
  readonly data: RESULT

  /**
   * 调用失败时的错误信息，只读属性。
   *
   * 当调用器处于 `error` 状态时，此属性包含命令执行失败的错误信息（转换为字符串）。
   * 在 `idle`、`loading` 或 `success` 状态时，此属性为 `undefined`。
   */
  readonly error: ERROR

  /**
   * 调用 Tauri 命令的方法，条件类型实现。
   *
   * 这是一个高级 TypeScript 特性，根据命令参数类型动态决定方法签名：
   * - 如果命令没有参数（`ARGS extends void`），签名为 `() => Promise<RESULT>`
   * - 如果命令有参数，签名为 `(args: ARGS) => Promise<RESULT>`
   *
   * 设计原理：通过条件类型实现了 API 的自适应性，无需手动检查参数是否存在，
   * 提供了更好的开发者体验和编译时类型安全性。
   *
   * @param args - 可选的命令参数。当命令有参数时必需，类型根据 `NAME` 自动推断
   * @returns 命令执行结果的 Promise，结果类型根据 `NAME` 自动推断
   *
   * @throws 当命令执行失败时抛出原始错误对象，调用者可以捕获并进行错误处理
   */
  call: ARGS extends void
    ? () => Promise<RESULT>
    : (args: ARGS) => Promise<RESULT>

  /**
   * 类型守卫方法：检查调用器是否处于成功状态。
   *
   * 当此方法返回 `true` 时，TypeScript 会将调用器类型细化到特定的成功状态类型，
   * 这意味着：
   * - `state` 属性的类型被细化为 `'success'` 字面量类型
   * - `data` 属性的类型被细化为 `Exclude<RESULT, undefined>`（排除了 `undefined`）
   * - `error` 属性的类型被细化为 `undefined`
   *
   * 这种类型细化使得后续代码可以安全地访问 `data` 属性，无需额外的类型断言。
   *
   * @returns 如果调用器处于成功状态返回 `true`，否则返回 `false`
   */
  isSuccess(): this is Invoker<NAME, 'success', ARGS, Exclude<RESULT, undefined>, undefined>

  /**
   * 类型守卫方法：检查调用器是否处于加载状态。
   *
   * 当此方法返回 `true` 时，TypeScript 会将调用器类型细化到特定的加载状态类型，
   * 这意味着：
   * - `state` 属性的类型被细化为 `'loading'` 字面量类型
   * - `data` 属性的类型被细化为 `undefined`
   * - `error` 属性的类型被细化为 `undefined`
   *
   * @returns 如果调用器正在加载返回 `true`，否则返回 `false`
   */
  isLoading(): this is Invoker<NAME, 'loading', ARGS, undefined, undefined>

  /**
   * 类型守卫方法：检查调用器是否处于错误状态。
   *
   * 当此方法返回 `true` 时，TypeScript 会将调用器类型细化到特定的错误状态类型，
   * 这意味着：
   * - `state` 属性的类型被细化为 `'error'` 字面量类型
   * - `data` 属性的类型被细化为 `undefined`
   * - `error` 属性的类型被细化为 `string`（不是 `undefined`）
   *
   * @returns 如果调用器处于错误状态返回 `true`，否则返回 `false`
   */
  isError(): this is Invoker<NAME, 'error', ARGS, undefined, string>
}

/**
 * 创建类型安全的 Tauri 命令调用器实例的工厂函数。
 *
 * 此函数是 `Invoker` 类型的主要实现，使用 Svelte 5 的 runes 系统（`$state`, `$state.raw`）
 * 来管理调用器状态，提供了响应式的状态管理和类型安全的命令调用。
 *
 * 核心实现要点：
 * 1. **响应式状态管理**: 使用 `$state` 和 `$state.raw` 创建响应式状态，确保状态变化触发 UI 更新
 * 2. **状态转换逻辑**: 内部 `call` 函数处理 Tauri IPC 调用，管理状态机的转换
 * 3. **类型守卫实现**: 提供类型守卫方法，允许 TypeScript 进行智能的类型细化
 * 4. **状态保护机制**: 通过 getter 提供只读状态访问，保护内部状态不被意外修改
 * 5. **条件类型适配**: 处理条件调用签名的类型适配，简化开发者调用体验
 *
 * 状态转换流程：
 * 1. `idle` → `loading`: 调用 `call()` 方法开始时
 * 2. `loading` → `success`: 命令调用成功完成
 * 3. `loading` → `error`: 命令调用失败
 *
 * @template NAME - 命令名称类型，必须是 `CommandNames` 类型的子类型
 * @param commandName - 要调用的 Tauri 命令名称，必须是已注册的有效命令
 * @returns 一个配置好的 `Invoker<NAME>` 实例，包含该命令的调用逻辑和状态管理
 *
 * @throws 工厂函数本身不会抛出错误，但返回的调用器的 `call` 方法可能抛出 Tauri 命令执行错误
 *
 * 注意事项：
 * 1. 命令名称必须在类型系统中预先定义，否则 TypeScript 会报错
 * 2. 调用器实例的状态是响应式的，适合在 Svelte 组件中使用
 * 3. 错误处理建议使用 `try-catch` 包装 `call()` 调用
 * 4. 对于多次调用同一命令的场景，可以复用同一个调用器实例
 */
export function invoker<NAME extends CommandNames>(commandName: NAME): Invoker<NAME> {
  // 使用 Svelte 5 的 $state rune 创建响应式状态
  // state 跟踪调用器的当前状态，初始为 'idle'，状态变化会自动触发 UI 更新
  let state = $state<InvokerState>('idle');

  // 使用 $state.raw 创建非代理的响应式状态
  // data 存储命令调用成功后的结果，$state.raw 确保复杂对象不会被代理，保留了原始结构
  // 这对于需要保持对象引用或特殊对象类型（如 Date、Map、Set 等）的场景很重要
  let data = $state.raw<ResultOf<NAME>>();

  // 使用 $state 创建响应式错误状态
  // error 存储命令调用失败时的错误信息，初始为 undefined
  let error = $state<string | undefined>();

  /**
   * 内部命令调用函数，处理实际的 Tauri IPC 调用和状态管理。
   *
   * 此函数实现了调用器的核心逻辑，包括：
   * 1. 状态转换管理
   * 2. Tauri IPC 调用
   * 3. 结果处理和错误转换
   * 4. 响应式状态更新
   *
   * 状态转换流程：
   * 1. 调用开始：`state = 'loading'`
   * 2. 调用成功：`state = 'success'`, `data = result`
   * 3. 调用失败：`state = 'error'`, `error = String(err)`
   *
   * @param args - 可选的命令参数，类型根据 `NAME` 从类型系统自动推断
   * @returns 命令执行结果的 Promise，类型根据 `NAME` 自动推断
   *
   * @throws 当 Tauri 命令执行失败时，将错误转换为字符串并重新抛出
   *         调用者可以捕获错误并进行处理，同时调用器的状态会自动更新为 'error'
   */
  async function call(args?: ArgsOf<NAME>): Promise<ResultOf<NAME>> {
    // 状态转换：进入加载状态
    // 这会触发 Svelte 的响应式更新，UI 可以显示加载状态
    state = 'loading';

    try {
      // 调用 Tauri IPC 接口，传递命令名称和参数
      // invoke 函数是 Tauri 提供的核心 API，用于与 Rust 后端通信
      const result = await invoke<ResultOf<NAME>>(commandName, args);

      // 调用成功：更新状态和数据
      // 状态转换到 'success'，存储结果数据
      state = 'success';
      data = result;

      // 返回结果给调用者
      // 调用者可以使用 await 获取结果，也可以忽略返回值只关注状态变化
      return result;
    } catch (err) {
      // 调用失败：更新状态和错误信息
      // 状态转换到 'error'，将错误转换为字符串存储
      // String(err) 确保错误信息是可显示的字符串，无论原始错误类型是什么
      state = 'error';
      error = String(err);

      // 重新抛出错误，允许调用者进行错误处理
      // 调用者可以选择捕获错误，也可以让错误向上传播
      throw err;
    }
  }

  /**
   * 类型守卫实现：检查调用器是否处于成功状态。
   */
  function isSuccess(): this is Invoker<NAME, 'success', ArgsOf<NAME>, Exclude<ResultOf<NAME>, undefined>, undefined> {
    return state === 'success';
  }

  /**
   * 类型守卫实现：检查调用器是否处于加载状态。
   */
  function isLoading(): this is Invoker<NAME, 'loading', ArgsOf<NAME>, undefined, undefined> {
    return state === 'loading';
  }

  /**
   * 类型守卫实现：检查调用器是否处于错误状态。
   */
  function isError(): this is Invoker<NAME, 'error', ArgsOf<NAME>, undefined, string> {
    return state === 'error';
  }

  // 返回调用器实例，使用 getter 提供只读访问，保护内部状态不被意外修改
  return {
    get state() { return state; },
    get data() { return data; },
    get error() { return error; },
    // @ts-ignore - TypeScript 条件类型推断限制
    call,
    isSuccess,
    isLoading,
    isError,
  };
}

export default invoker;
