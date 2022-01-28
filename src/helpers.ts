export const returnTrue = () => true;

export function unimplementedAction<T extends string>(action: T) {
  console.log(`${action} (Not implemented)`);
}

export const voidNothing = () => void undefined;
export const return0 = () => 0;
export const asyncVoidNothing = async () => void undefined;
export const asyncReturn0 = async () => 0;
