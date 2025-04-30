import { createContext, PropsWithChildren, useContext } from "react";
import useImperativeObject from "../imperative_object";
import BluetoothOps from "./connection";

const context = createContext<null | BluetoothOps>(null);

export function BluetoothProvider(props: PropsWithChildren) {
  const bluetooth = useImperativeObject(() => new BluetoothOps());

  //@ts-expect-error
  window.bluetooth = bluetooth;

  return <context.Provider value={bluetooth}>{props.children}</context.Provider>;
}

export default function useBluetoothConnection() {
  return useContext(context)!;
}
