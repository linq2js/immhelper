declare namespace ImmHelper {
    // tuple [selector, action, ...args]
    type UpdateSpec<T> = [(model: T) => any, string | Function, ...any[]];
    interface Update {
        <T>(model: T, ...specs: UpdateSpec<T>[]): T

        default: ImmHelper.Update;
    }
}